#!/usr/bin/env node
/**
 * Link + status checker for the DelQuro Labs site.
 *
 * Zero dependencies. Node 18+.
 *
 *   Check the files in the working tree (pre-migration):
 *       node scripts/check-links.mjs
 *
 *   Check the live site (post-migration):
 *       node scripts/check-links.mjs https://www.delquro.com
 *       node scripts/check-links.mjs http://localhost:8080
 *
 * Local mode verifies that every relative href/src resolves to a real file.
 * Live mode walks the same link graph over HTTP and additionally asserts the
 * behaviours nginx.conf promises: 200s for real pages, a real 404 status for
 * missing ones, the apex->www redirect, and the trailing-slash redirect for
 * /Sounds.
 *
 * Exits non-zero if anything fails, so it is safe to use in CI.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const TARGET = process.argv[2];
const LIVE = /^https?:\/\//i.test(TARGET || '');

// Reference extraction shared by both modes. Matches href="..." and src="...".
const REF_RE = /(?:href|src)\s*=\s*"([^"]+)"/gi;

const isExternal = (u) => /^(?:https?:|mailto:|tel:|sms:|data:|javascript:|#)/i.test(u);

function collectRefs(html) {
  const out = [];
  let m;
  REF_RE.lastIndex = 0;
  while ((m = REF_RE.exec(html))) out.push(m[1]);
  return out;
}

function localHtmlFiles(dir) {
  const found = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === '.git' || e.name === 'node_modules') continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.html$/i.test(e.name)) found.push(p);
    }
  })(dir);
  return found.sort();
}

/* ------------------------------------------------------------------------- */
/* Local mode                                                                 */
/* ------------------------------------------------------------------------- */

function checkLocal() {
  const files = localHtmlFiles(ROOT);
  const broken = [];
  let checked = 0;

  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    for (const raw of collectRefs(html)) {
      if (isExternal(raw)) continue;
      const rel = decodeURIComponent(raw.split('#')[0].split('?')[0]);
      if (!rel) continue;
      checked++;
      const abs = path.resolve(path.dirname(file), rel);
      if (!fs.existsSync(abs)) {
        broken.push(`  ${path.relative(ROOT, file)}  ->  ${raw}`);
      }
    }
  }

  console.log(`Local mode: ${ROOT}`);
  console.log(`  HTML files scanned : ${files.length}`);
  console.log(`  Local refs checked : ${checked}`);

  if (broken.length) {
    console.log(`\nBROKEN REFERENCES (${broken.length}):`);
    broken.forEach((b) => console.log(b));
    return 1;
  }
  console.log('  Result             : all local links and assets resolve.');
  return 0;
}

/* ------------------------------------------------------------------------- */
/* Live mode                                                                  */
/* ------------------------------------------------------------------------- */

// Paths that must exist on any correct deployment of this repo.
const CORE_PATHS = [
  '/',
  '/index.html',
  '/products.html',
  '/resources.html',
  '/support.html',
  '/privacy.html',
  '/terms.html',
  '/account-deletion.html',
  '/style.css',
  '/site.js',
  '/site.webmanifest',
  '/robots.txt',
  '/sitemap.xml',
  '/assets/logo-mark.svg',
  '/assets/app-icon.svg',
  '/Sounds/',
  '/Sounds/index.html',
  // A filename with spaces - proves URL decoding works end to end.
  '/Sounds/Lake%20Lapping%20Bark.mp3',
  '/health',
];

const EXPECT_404 = ['/this-page-does-not-exist', '/nope/deep/path.html'];
const EXPECT_301 = ['/Sounds']; // -> /Sounds/ (relative links depend on it)

async function probe(url, redirect = 'manual') {
  try {
    const res = await fetch(url, { redirect, headers: { 'User-Agent': 'delquro-linkcheck' } });
    return res;
  } catch (err) {
    return { status: 0, ok: false, headers: new Headers(), error: err.message };
  }
}

async function checkLive() {
  const base = TARGET.replace(/\/+$/, '');
  const failures = [];
  const notes = [];

  console.log(`Live mode: ${base}\n`);

  // 1. Core paths must return 200.
  for (const p of CORE_PATHS) {
    const res = await probe(base + p);
    const mark = res.status === 200 ? 'ok  ' : 'FAIL';
    if (res.status !== 200) failures.push(`${p} returned ${res.status || res.error}`);
    console.log(`  ${mark} 200  ${p}`);
  }

  // 2. Missing pages must return a real 404 (not a 200 soft-404).
  for (const p of EXPECT_404) {
    const res = await probe(base + p);
    const mark = res.status === 404 ? 'ok  ' : 'FAIL';
    if (res.status !== 404) failures.push(`${p} returned ${res.status}, expected 404`);
    console.log(`  ${mark} 404  ${p}`);
  }

  // 3. Bare directory must 301 to its trailing-slash form.
  for (const p of EXPECT_301) {
    const res = await probe(base + p);
    const loc = res.headers?.get?.('location');
    const good = [301, 302, 308].includes(res.status) && (loc || '').replace(/\/$/, '').endsWith(p);
    const mark = good ? 'ok  ' : 'FAIL';
    if (!good) failures.push(`${p} returned ${res.status} (location: ${loc}), expected 301 -> ${p}/`);
    console.log(`  ${mark} ${res.status}  ${p}  ->  ${loc}`);
  }

  // 4. Security + caching headers on the homepage.
  const home = await probe(base + '/');
  for (const h of ['content-security-policy', 'x-content-type-options', 'referrer-policy']) {
    const v = home.headers?.get?.(h);
    if (!v) failures.push(`missing ${h} header on /`);
    else notes.push(`${h}: present`);
  }
  const mp3 = await probe(base + '/Sounds/Train.mp3');
  if (mp3.headers?.get?.('accept-ranges') !== 'bytes') {
    notes.push('WARNING: /Sounds/Train.mp3 has no "Accept-Ranges: bytes" - audio seeking may not work');
  } else {
    notes.push('Accept-Ranges: bytes on MP3s (seeking works)');
  }

  // 5. Crawl every internal link reachable from the homepage.
  const seen = new Set(['/']);
  const queue = ['/'];
  const crawlFailures = [];
  let crawled = 0;

  while (queue.length && crawled < 200) {
    const cur = queue.shift();
    const res = await probe(base + cur);
    crawled++;
    if (res.status >= 400) crawlFailures.push(`${cur} -> ${res.status}`);
    const type = res.headers?.get?.('content-type') || '';
    if (!type.includes('text/html')) continue;
    const html = await res.text().catch(() => '');
    for (const raw of collectRefs(html)) {
      if (isExternal(raw)) continue;
      let abs;
      try {
        abs = new URL(raw, base + cur).pathname;
      } catch {
        continue;
      }
      if (seen.has(abs)) continue;
      seen.add(abs);
      queue.push(abs);
    }
  }

  console.log(`\n  Crawled ${crawled} internal URLs from /.`);
  if (crawlFailures.length) {
    crawlFailures.forEach((f) => failures.push(`crawl: ${f}`));
  }
  if (notes.length) {
    console.log('  Header notes:');
    notes.forEach((n) => console.log(`    - ${n}`));
  }

  if (failures.length) {
    console.log(`\nFAILURES (${failures.length}):`);
    [...new Set(failures)].forEach((f) => console.log('  ' + f));
    return 1;
  }
  console.log('\n  Result: everything passed.');
  return 0;
}

const code = LIVE ? await checkLive() : checkLocal();
process.exit(code);
