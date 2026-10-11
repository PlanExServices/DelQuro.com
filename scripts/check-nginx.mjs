#!/usr/bin/env node
/** Exercise the built nginx container; not a substitute for browser QA. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = new URL(process.argv[2] || 'http://127.0.0.1:8080');
assert.match(base.protocol, /^https?:$/);
const failures = [];
let checks = 0;

async function request(uri, options = {}) {
  return fetch(new URL(uri, base), {
    redirect: 'manual',
    signal: AbortSignal.timeout(5000),
    ...options,
  });
}

function headers(response) {
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  assert.match(response.headers.get('permissions-policy') || '', /camera=\(\)/);
  const csp = response.headers.get('content-security-policy') || '';
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self' 'unsafe-inline' https:\/\/static\.cloudflareinsights\.com/);
  assert.match(csp, /style-src 'self' 'unsafe-inline'/);
  assert.match(csp, /media-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'self'/);
  assert.doesNotMatch(response.headers.get('server') || '', /nginx\//);
}

async function check(label, run) {
  try {
    await run();
    checks++;
    console.log(`PASS ${label}`);
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
    console.error(`FAIL ${label}: ${error.message}`);
  }
}

// The container can take a moment to start on a busy runner.
let ready = false;
for (let attempt = 0; attempt < 20; attempt++) {
  try {
    ready = (await request('/health')).status === 200;
    if (ready) break;
  } catch { /* retry startup only */ }
  await delay(500);
}
assert.ok(ready, 'nginx did not become ready');

for (const uri of ['/', '/index.html', '/products.html', '/about.html', '/apps/ai-scripts.html', '/Sounds/']) {
  await check(`HTML and headers ${uri}`, async () => {
    const response = await request(uri, { method: 'HEAD' });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /^text\/html/);
    assert.equal(response.headers.get('cache-control'), 'no-cache, must-revalidate');
    headers(response);
  });
}

for (const uri of ['/style.css', '/site.js', '/site.webmanifest']) {
  await check(`safe caching and headers ${uri}`, async () => {
    const response = await request(uri, { method: 'HEAD' });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=300, must-revalidate');
    assert.doesNotMatch(response.headers.get('cache-control'), /immutable/);
    headers(response);
    if (uri === '/style.css') assert.match(response.headers.get('content-type') || '', /^text\/css/);
    if (uri === '/site.js') assert.match(response.headers.get('content-type') || '', /javascript/);
    if (uri === '/site.webmanifest') assert.match(response.headers.get('content-type') || '', /^application\/manifest\+json/);
  });
}

await check('asset caching and headers', async () => {
  const response = await request('/assets/app-icon.svg', { method: 'HEAD' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=86400, must-revalidate');
  headers(response);
});

await check('conditional CSS revalidation', async () => {
  const first = await request('/style.css', { method: 'HEAD' });
  const etag = first.headers.get('etag');
  assert.ok(etag, 'missing ETag');
  const response = await request('/style.css', { headers: { 'If-None-Match': etag } });
  assert.equal(response.status, 304);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=300, must-revalidate');
  headers(response);
});

await check('health is exactly plain text', async () => {
  const response = await request('/health');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/plain');
  assert.equal(await response.text(), 'ok\n');
  headers(response);
});

await check('directory redirect and headers', async () => {
  const response = await request('/Sounds', { method: 'HEAD' });
  assert.equal(response.status, 301);
  assert.equal(new URL(response.headers.get('location'), base).pathname, '/Sounds/');
  headers(response);
});

await check('directory listings are forbidden with security headers', async () => {
  const response = await request('/assets/', { method: 'HEAD' });
  assert.equal(response.status, 403);
  assert.equal(response.headers.get('cache-control'), 'no-cache, must-revalidate');
  headers(response);
});

const custom404 = fs.readFileSync(path.join(root, '404.html'), 'utf8');
for (const uri of ['/this-page-does-not-exist', '/nope/deep/path.html', '/missing.css', '/health/extra', '/404.html', '/.git/config', '/apps/.env', '/scripts/check-links.mjs', '/catalog/products.json', '/README.md', '/nginx.conf', '/Dockerfile', '/deploy/nginx/nginx.conf']) {
  await check(`genuine custom 404 ${uri}`, async () => {
    const response = await request(uri);
    assert.equal(response.status, 404);
    assert.equal(await response.text(), custom404);
    assert.equal(response.headers.get('cache-control'), 'no-cache, must-revalidate');
    headers(response);
  });
}

for (const uri of ['/Sounds/Train.mp3', '/Sounds/Lake%20Lapping%20Bark.mp3', '/assets/William_DelQuro_Intro.mp4']) {
  await check(`media playback ranges ${uri}`, async () => {
    const response = await request(uri, { headers: { Range: 'bytes=0-31' } });
    assert.equal(response.status, 206);
    assert.match(response.headers.get('content-range') || '', /^bytes 0-31\/\d+$/);
    assert.equal((await response.arrayBuffer()).byteLength, 32);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=86400, must-revalidate');
    headers(response);
  });
}

console.log(`\n${checks} nginx checks passed; ${failures.length} failed.`);
if (failures.length) process.exitCode = 1;
