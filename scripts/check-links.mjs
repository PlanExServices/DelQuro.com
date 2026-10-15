#!/usr/bin/env node
/**
 * Dependency-free site reference checker (Node 18+).
 *
 * node scripts/check-links.mjs                      local files and anchors
 * node scripts/check-links.mjs http://localhost:8080 live crawl + server checks
 *
 * Checks HTML href/src/poster/srcset, CSS url(), and web manifest assets.
 * External destinations are deliberately outside this internal link check.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = process.argv[2];
const LIVE = /^https?:\/\//i.test(TARGET || '');
const LOCAL_ORIGIN = 'https://delquro.local';
const TIMEOUT_MS = 10000;
const MAX_CRAWL_URLS = 500;
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

function decodeEntities(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, entity => {
    const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const code = entity[2].toLowerCase() === 'x' ? parseInt(entity.slice(3, -1), 16) : parseInt(entity.slice(2, -1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  });
}

function stripNonMarkup(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '').replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi, '$1</script>');
}

// Data URLs contain commas; separating a srcset on every comma corrupts them.
function srcsetUrls(value) {
  const urls = [];
  let offset = 0;
  while (offset < value.length) {
    while (/[\s,]/.test(value[offset] || '') && offset < value.length) offset++;
    const start = offset;
    while (offset < value.length && !/\s/.test(value[offset])) offset++;
    let url = value.slice(start, offset);
    if (!url) break;
    if (url.endsWith(',')) {
      urls.push(url.replace(/,+$/, ''));
      continue;
    }
    urls.push(url);
    let depth = 0;
    while (offset < value.length) {
      const character = value[offset++];
      if (character === '(') depth++;
      if (character === ')') depth--;
      if (character === ',' && depth <= 0) break;
    }
  }
  return urls;
}

function cssRefs(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...clean.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi)]
    .map(match => (match[1] ?? match[2] ?? match[3]).trim());
}

function htmlRefs(html) {
  const clean = stripNonMarkup(html);
  const refs = [];
  for (const match of clean.matchAll(/\b(href|src|poster|srcset)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+))/gi)) {
    const value = decodeEntities(match[2] ?? match[3] ?? match[4]);
    refs.push(...(match[1].toLowerCase() === 'srcset' ? srcsetUrls(value) : [value]));
  }
  for (const match of clean.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) refs.push(...cssRefs(match[1]));
  for (const match of clean.matchAll(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) refs.push(...cssRefs(decodeEntities(match[1] ?? match[2])));
  return refs;
}

function manifestRefs(text) {
  const manifest = JSON.parse(text);
  const refs = [...(manifest.icons || []), ...(manifest.screenshots || [])].map(item => item.src);
  for (const shortcut of manifest.shortcuts || []) {
    if (shortcut.url) refs.push(shortcut.url);
    refs.push(...(shortcut.icons || []).map(item => item.src));
  }
  if (manifest.start_url) refs.push(manifest.start_url);
  return refs.filter(value => typeof value === 'string');
}

function documentIds(html) {
  const ids = new Set();
  const clean = stripNonMarkup(html);
  for (const match of clean.matchAll(/\bid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+))/gi)) ids.add(decodeEntities(match[1] ?? match[2] ?? match[3]));
  for (const match of clean.matchAll(/<a\b[^>]*\bname\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+))/gi)) ids.add(decodeEntities(match[1] ?? match[2] ?? match[3]));
  return ids;
}

function sourceFiles() {
  const found = [];
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (['.git', 'node_modules', '.agents', '.codex'].includes(entry.name)) continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (/\.(html|css|webmanifest)$/i.test(entry.name)) found.push(absolute);
    }
  }
  walk(ROOT);
  return found.sort();
}

function refsFor(text, kind) {
  return kind === 'css' ? cssRefs(text) : kind === 'webmanifest' ? manifestRefs(text) : htmlRefs(text);
}

function checkLocal() {
  const files = sourceFiles();
  const failures = [];
  const ids = new Map();
  let references = 0;
  let anchors = 0;
  for (const file of files) {
    const kind = path.extname(file).slice(1).toLowerCase();
    const sourceUrl = new URL('/' + path.relative(ROOT, file).split(path.sep).join('/'), LOCAL_ORIGIN);
    let refs;
    try { refs = refsFor(fs.readFileSync(file, 'utf8'), kind); }
    catch (error) { failures.push(`${path.relative(ROOT, file)}: ${error.message}`); continue; }
    for (const raw of refs) {
      if (!raw || EXTERNAL.test(raw)) continue;
      // Fragment-only CSS references target the rendered document, not a file.
      if (kind === 'css' && raw.startsWith('#')) continue;
      references++;
      try {
        const url = new URL(raw, sourceUrl);
        const decoded = decodeURIComponent(url.pathname);
        let absolute = path.resolve(ROOT, '.' + decoded);
        const relative = path.relative(ROOT, absolute);
        if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('reference escapes the site root');
        if (fs.existsSync(absolute) && fs.statSync(absolute).isDirectory()) absolute = path.join(absolute, 'index.html');
        if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) throw new Error('missing file');
        if (url.hash && /\.(html|svg)$/i.test(absolute)) {
          const fragment = decodeURIComponent(url.hash.slice(1));
          // #top is the browser-defined beginning of a document.
          if (fragment && fragment.toLowerCase() !== 'top' && !fragment.startsWith(':~:text=')) {
            anchors++;
            if (!ids.has(absolute)) ids.set(absolute, documentIds(fs.readFileSync(absolute, 'utf8')));
            if (!ids.get(absolute).has(fragment)) throw new Error(`missing anchor #${fragment}`);
          }
        }
      } catch (error) {
        failures.push(`${path.relative(ROOT, file)} -> ${raw} (${error.message})`);
      }
    }
  }
  console.log(`Local mode: ${ROOT}`);
  console.log(`  Source files scanned: ${files.length}`);
  console.log(`  Local references: ${references}; anchors: ${anchors}`);
  return report(failures, 'All internal links, anchors, and assets resolve.');
}

const CORE_PATHS = ['/', '/index.html', '/products.html', '/about.html', '/resources.html', '/support.html', '/privacy.html', '/terms.html', '/account-deletion.html', '/style.css', '/site.js', '/refresh.css', '/site.webmanifest', '/robots.txt', '/sitemap.xml', '/assets/logo-mark.svg', '/assets/app-icon.svg', '/Sounds/', '/Sounds/index.html', '/Sounds/Lake%20Lapping%20Bark.mp3', '/health'];
const EXPECT_404 = ['/this-page-does-not-exist', '/nope/deep/path.html'];

async function probe(url, method = 'HEAD') {
  try {
    return await fetch(url, {
      method,
      redirect: 'manual',
      headers: { 'User-Agent': 'delquro-linkcheck' },
      // This signal remains active while response bodies are read, so a
      // streaming or stalled HTML/CSS/manifest body cannot hang the crawl.
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    return { status: 0, headers: new Headers(), error: error.message };
  }
}

async function discard(response) {
  try { await response.body?.cancel(); } catch { /* aborted responses are already closed */ }
}

async function checkLive() {
  const base = new URL(TARGET);
  const failures = [];
  console.log(`Live mode: ${base.origin}`);
  for (const uri of CORE_PATHS) {
    const response = await probe(new URL(uri, base));
    if (response.status !== 200) failures.push(`${uri} returned ${response.status || response.error}, expected 200`);
  }
  for (const uri of EXPECT_404) {
    const response = await probe(new URL(uri, base));
    if (response.status !== 404) failures.push(`${uri} returned ${response.status || response.error}, expected 404`);
  }
  const directory = await probe(new URL('/Sounds', base));
  let slashTarget;
  try { slashTarget = new URL(directory.headers.get('location'), base).pathname; } catch { /* failure recorded below */ }
  if (![301, 302, 308].includes(directory.status) || slashTarget !== '/Sounds/') failures.push(`/Sounds returned ${directory.status} -> ${slashTarget}, expected a slash redirect`);
  const home = await probe(new URL('/', base));
  for (const name of ['content-security-policy', 'x-content-type-options', 'referrer-policy']) {
    if (!home.headers.get(name)) failures.push(`missing ${name} on /`);
  }
  const audio = await probe(new URL('/Sounds/Train.mp3', base));
  if (audio.headers.get('accept-ranges') !== 'bytes') failures.push('MP3 is missing Accept-Ranges: bytes');

  const seen = new Set(['/']);
  const queue = ['/'];
  const parsedIds = new Map();
  const anchorRefs = [];
  let crawled = 0;
  function enqueue(url) {
    if (url.origin !== base.origin) return;
    if (!seen.has(url.pathname)) {
      seen.add(url.pathname);
      queue.push(url.pathname);
    }
  }
  while (queue.length && crawled < MAX_CRAWL_URLS) {
    const uri = queue.shift();
    const url = new URL(uri, base);
    const response = await probe(url, 'GET');
    crawled++;
    if (!response.status || response.status >= 400) {
      failures.push(`crawl: ${uri} -> ${response.status || response.error}`);
      await discard(response);
      continue;
    }
    if (response.status >= 300) {
      const location = response.headers.get('location');
      if (location) enqueue(new URL(location, url));
      else failures.push(`crawl: ${uri} redirect has no Location`);
      await discard(response);
      continue;
    }
    const type = response.headers.get('content-type') || '';
    const kind = type.includes('text/html') ? 'html' : type.includes('text/css') ? 'css' : uri.endsWith('.webmanifest') ? 'webmanifest' : null;
    if (!kind) { await discard(response); continue; }
    try {
      const text = await response.text();
      if (kind === 'html') parsedIds.set(uri, documentIds(text));
      for (const raw of refsFor(text, kind)) {
        if (!raw || EXTERNAL.test(raw) || (kind === 'css' && raw.startsWith('#'))) continue;
        const target = new URL(raw, url);
        enqueue(target);
        if (target.hash && kind === 'html') anchorRefs.push({ source: uri, target: target.pathname, fragment: decodeURIComponent(target.hash.slice(1)) });
      }
    } catch (error) {
      failures.push(`crawl: ${uri} body/reference read failed (${error.message})`);
      await discard(response);
    }
  }
  if (queue.length) failures.push(`crawl limit ${MAX_CRAWL_URLS} reached with ${queue.length} URLs unchecked`);
  for (const { source, target, fragment } of anchorRefs) {
    if (!fragment || fragment.toLowerCase() === 'top' || fragment.startsWith(':~:text=')) continue;
    if (parsedIds.has(target) && !parsedIds.get(target).has(fragment)) failures.push(`crawl: ${source} -> ${target}#${fragment} missing anchor`);
  }
  console.log(`  Crawled ${crawled} internal URLs with bounded response/body reads.`);
  return report(failures, 'All internal links, anchors, assets, and server checks passed.');
}

function report(failures, success) {
  if (failures.length) {
    const unique = [...new Set(failures)];
    console.error(`  Failures (${unique.length}):`);
    for (const failure of unique) console.error(`    ${failure}`);
    return 1;
  }
  console.log(`  Result: ${success}`);
  return 0;
}

process.exitCode = LIVE ? await checkLive() : checkLocal();
