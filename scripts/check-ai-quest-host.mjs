#!/usr/bin/env node
// Structural checks need only Node. Pass a running nginx URL for real HTTP checks.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,lstatSync} from 'node:fs';
import {resolve,join,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),dir=join(root,'deploy/ai-quest'),site=join(dir,'site');
const manifest=JSON.parse(readFileSync(join(dir,'release-manifest.json'),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=n=>readFileSync(join(dir,n),'utf8');
const allowed=n=>n==='index.html'||n==='maintenance.json'||/^assets\/[\w-]+-[\w-]+\.(js|css)$/.test(n)||/^art\/[\w-]+\.webp$/.test(n);
function walk(p){return readdirSync(p,{withFileTypes:true}).flatMap(e=>{const n=join(p,e.name);assert.ok(!lstatSync(n).isSymbolicLink());return e.isDirectory()?walk(n):[relative(site,n).replaceAll('\\','/')];});}
let checks=0;
function pass(name){checks++;console.log('PASS '+name);}
assert.equal(manifest.source.registryVersion,'1.9.0');
assert.deepEqual(manifest.counts,{lessons:180,worlds:30,resources:749,decisions:420,bespokeArtwork:60,webpArtwork:138});
assert.equal(Object.keys(manifest.source.inputHashes).length,170);
assert.equal(manifest.source.inputHashes['src/data/registry.json'],manifest.source.registrySha256);
assert.match(manifest.source.commit,/^[0-9a-f]{40}$/);assert.equal(manifest.files.length,142);
assert.deepEqual(walk(site).sort(),manifest.files.map(f=>f.path).sort());
for(const f of manifest.files){assert.ok(allowed(f.path),f.path);const b=readFileSync(join(site,f.path));assert.equal(b.length,f.bytes);assert.equal(sha(b),f.sha256);if(f.path.endsWith('.webp'))assert.equal(f.sha256,manifest.source.inputHashes['public/'+f.path]);}
assert.equal(manifest.files.filter(f=>f.path.endsWith('.webp')).length,138);
pass('142 allowlisted files and hashes; 138 canonical artwork hashes; 170 source pins');
const report=JSON.parse(readFileSync(join(site,'maintenance.json'),'utf8'));assert.equal(report.activeVersion,'1.9.0');
assert.ok(report.sources.every(s=>!('snapshot'in s)&&!('error'in s)));assert.ok(!('publishedBy'in report));assert.ok(!('lastReviewedCandidateId'in report));
const publicText=manifest.files.filter(f=>!f.path.endsWith('.webp')).map(f=>readFileSync(join(site,f.path),'utf8')).join('\n');
assert.doesNotMatch(publicText,/\.maintenance\/snapshots\/|C:\\Users\\plane|sk-ant-api03-[A-Za-z0-9_-]{20,}|sk-proj-[A-Za-z0-9_-]{20,}|warehouse13-ai-quest-progress-v1|\/api\/internal\/ai-quest\//);
pass('published report stripped of private paths/reviewer/candidate; standalone storage/mount retained');
const html=readFileSync(join(site,'index.html'),'utf8');assert.match(html,/id="root"/);assert.match(html,/src="\/assets\//);
const css=manifest.files.filter(f=>f.path.endsWith('.css')).map(f=>readFileSync(join(site,f.path),'utf8')).join('\n');
assert.match(css,/https:\/\/fonts\.googleapis\.com/);
const conf=read('nginx.conf'),docker=read('Dockerfile'),ignore=read('Dockerfile.dockerignore');
assert.match(docker,/^FROM nginx:1\.30\.5-alpine@sha256:[a-f0-9]{64}$/m);
assert.match(docker,/EXPOSE 80/);assert.match(docker,/127\.0\.0\.1\/health/);
const copyLines=docker.split('\n').filter(l=>l.startsWith('COPY '));assert.equal(copyLines.length,4);assert.ok(copyLines.every(l=>l.startsWith('COPY deploy/ai-quest/')));
assert.ok(copyLines.every(l=>!l.includes('release-manifest')&&!l.includes('README')));
assert.match(ignore,/^\*\*$/m);assert.match(ignore,/^!deploy\/ai-quest\/site\/art\/\*\.webp$/m);assert.ok(!ignore.includes('!deploy/**'));
assert.match(conf,/root \/usr\/share\/nginx\/ai-quest;/);
assert.match(conf,/style-src 'self' 'unsafe-inline' https:\/\/fonts\.googleapis\.com/);
assert.match(conf,/font-src 'self' https:\/\/fonts\.gstatic\.com/);assert.match(conf,/connect-src 'self';/);
assert.match(conf,/location \/ \{\s*return 404;/);
assert.match(conf,/immutable/);assert.match(conf,/no-cache, must-revalidate/);
const rootDocker=readFileSync(join(root,'Dockerfile'),'utf8'),rootIgnore=readFileSync(join(root,'.dockerignore'),'utf8');
assert.ok(!rootDocker.split('\n').filter(l=>l.startsWith('COPY ')).some(l=>l.includes('deploy/')));
assert.ok(!rootIgnore.includes('!deploy'));
pass('separate pinned container, Docker context allowlist, font-compatible CSP, no shared root publication');
if(process.argv[2]==='--static'){console.log(JSON.stringify({checks,mode:'structural-only',httpVerified:false,manifestSha256:sha(readFileSync(join(dir,'release-manifest.json')))}));process.exit(0);}
const base=new URL(process.argv[2]||'http://127.0.0.1:8081');assert.match(base.protocol,/^https?:$/);
const request=(uri,options={})=>fetch(new URL(uri,base),{redirect:'manual',signal:AbortSignal.timeout(7000),...options});
function headers(r){assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.equal(r.headers.get('x-frame-options'),'SAMEORIGIN');assert.equal(r.headers.get('referrer-policy'),'strict-origin-when-cross-origin');assert.match(r.headers.get('permissions-policy')||'',/camera=\(\)/);const csp=r.headers.get('content-security-policy')||'';assert.match(csp,/script-src 'self';/);assert.match(csp,/style-src 'self' 'unsafe-inline' https:\/\/fonts\.googleapis\.com/);assert.match(csp,/font-src 'self' https:\/\/fonts\.gstatic\.com/);assert.match(csp,/connect-src 'self';/);assert.match(csp,/object-src 'none'/);assert.doesNotMatch(r.headers.get('server')||'',/nginx\//);}
let ready=false;for(let n=0;n<20;n++){try{ready=(await request('/health')).status===200;if(ready)break;}catch{}await delay(250);}assert.ok(ready,'Host did not become ready');
const health=await request('/health');headers(health);assert.equal(await health.text(),'ok\n');pass('health and security headers');
for(const uri of ['/','/index.html','/#course','/#library','/#lesson/data-reliable-code-missing-reasons']){const r=await request(uri);headers(r);assert.equal(r.status,200);assert.match(r.headers.get('content-type')||'',/^text\/html/);assert.equal(r.headers.get('cache-control'),'no-cache, must-revalidate');assert.equal(sha(Buffer.from(await r.arrayBuffer())),manifest.files.find(f=>f.path==='index.html').sha256);}
pass('standalone entry, hash routes and revalidating HTML');
for(const f of manifest.files){const r=await request('/'+f.path);headers(r);assert.equal(r.status,200,f.path);const contentType=r.headers.get('content-type')||'';if(f.path.endsWith('.js'))assert.match(contentType,/^(?:text|application)\/javascript/,f.path);else assert.ok(contentType.startsWith(f.mime),f.path);assert.equal(sha(Buffer.from(await r.arrayBuffer())),f.sha256,f.path);const cache=r.headers.get('cache-control');if(f.path.startsWith('assets/'))assert.equal(cache,'public, max-age=31536000, immutable',f.path);else if(f.path.startsWith('art/'))assert.equal(cache,'public, max-age=86400, must-revalidate');else assert.equal(cache,'no-cache, must-revalidate');}
pass('all 142 HTTP deliveries match manifest, MIME and cache rules');
for(const uri of ['/assets/missing-abcdefgh.js','/art/missing.webp','/missing','/course','/release-manifest.json','/deploy/ai-quest/release-manifest.json','/Dockerfile','/nginx.conf','/README.md','/.git/config','/.env','/.maintenance/snapshots/private.snapshot','/memory/PROJECT.md','/scripts/export-ai-quest.mjs','/src/main.tsx','/package.json','/assets/index.js.map','/api/anything']){const r=await request(uri);headers(r);assert.equal(r.status,404,uri);assert.equal(r.headers.get('cache-control'),'no-cache, must-revalidate',uri);assert.ok(!(await r.text()).includes('<div id="root">'),uri);}
pass('missing assets and nonpublic paths are genuine nonimmutable 404s');
const head=await request('/index.html',{method:'HEAD'});assert.equal(head.status,200);headers(head);assert.equal((await head.arrayBuffer()).byteLength,0);pass('HEAD response');
console.log(JSON.stringify({checks,mode:'nginx-http',httpVerified:true,manifestSha256:sha(readFileSync(join(dir,'release-manifest.json')))}));
