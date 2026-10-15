#!/usr/bin/env node
// Public standalone export. Reads canonical runtime inputs; never adapts its source.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {cpSync,existsSync,lstatSync,mkdtempSync,mkdirSync,readFileSync,readdirSync,realpathSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=realpathSync(resolve(dirname(fileURLToPath(import.meta.url)),'..'));
const args=process.argv.slice(2),check=args.includes('--check'),index=args.indexOf('--source');
if(index<0||!args[index+1]||args.some((v,i)=>v!=='--check'&&i!==index&&i!==index+1))throw Error('Usage: node scripts/export-ai-quest.mjs --source ../ai-quest [--check]');
const source=realpathSync(resolve(root,args[index+1])),target=join(root,'deploy/ai-quest'),site=join(target,'site'),manifestPath=join(target,'release-manifest.json');
assert.notEqual(source,root);assert.ok(!source.startsWith(target+sep));
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(...a)=>execFileSync('git',['-C',source,...a],{encoding:'utf8'}).trim();
const runtime=['src','public','index.html','package.json','package-lock.json','tsconfig.json','vite.config.ts'];
function walk(dir){return readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en')).flatMap(e=>{const p=join(dir,e.name);assert.ok(!lstatSync(p).isSymbolicLink(),'No symlink inputs');return e.isDirectory()?walk(p):[p]});}
const rel=(base,p)=>relative(base,p).replaceAll('\\','/');
const inputFiles=[...walk(join(source,'src')),...walk(join(source,'public')),...runtime.slice(2).map(n=>join(source,n))];
const inputHashes=Object.fromEntries(inputFiles.map(p=>[rel(source,p),sha(readFileSync(p))]));
assert.equal(git('status','--porcelain','--untracked-files=all','--',...runtime),'','Commit canonical runtime inputs before export.');
const registry=JSON.parse(readFileSync(join(source,'src/data/registry.json'),'utf8'));
const artMap=JSON.parse(readFileSync(join(source,'src/data/card-art.json'),'utf8'));
const allowed=n=>n==='index.html'||n==='maintenance.json'||/^assets\/[\w-]+-[\w-]+\.(js|css)$/.test(n)||/^art\/[\w-]+\.webp$/.test(n);
const mime=n=>n.endsWith('.html')?'text/html':n.endsWith('.json')?'application/json':n.endsWith('.js')?'text/javascript':n.endsWith('.css')?'text/css':'image/webp';
const counts={lessons:registry.modules.reduce((n,m)=>n+m.lessons.length,0),worlds:registry.modules.length};
counts.resources=counts.lessons+['commands','prompts','workflows','glossary','models','challenges'].reduce((n,k)=>n+registry[k].length,0);
counts.decisions=registry.modules.reduce((n,m)=>n+m.lessons.reduce((s,l)=>s+Number(!!l.exercise)+Number(!!l.quiz),0),0)+registry.placement.length+registry.challenges.reduce((n,c)=>n+c.questions.length,0);
counts.bespokeArtwork=Object.values(artMap).reduce((n,m)=>n+Object.keys(m).length,0);
counts.webpArtwork=walk(join(source,'public/art')).length;
assert.equal(registry.version,'1.9.0');assert.deepEqual(counts,{lessons:180,worlds:30,resources:749,decisions:420,bespokeArtwork:60,webpArtwork:138});
function verify(manifest){
 assert.equal(manifest.schemaVersion,1);assert.deepEqual(manifest.counts,counts);assert.equal(manifest.source.registryVersion,registry.version);
 assert.equal(manifest.source.registrySha256,inputHashes['src/data/registry.json']);assert.deepEqual(manifest.source.inputHashes,inputHashes);
 const actual=walk(site).map(p=>rel(site,p)).sort();assert.deepEqual(actual,manifest.files.map(f=>f.path).sort());
 for(const f of manifest.files){assert.ok(allowed(f.path),f.path);const b=readFileSync(join(site,f.path));assert.equal(b.length,f.bytes,f.path);assert.equal(sha(b),f.sha256,f.path);if(f.path.endsWith('.webp'))assert.equal(sha(readFileSync(join(source,'public',f.path))),f.sha256,f.path);}
 const text=manifest.files.filter(f=>!f.path.endsWith('.webp')).map(f=>readFileSync(join(site,f.path),'utf8')).join('\n');
 assert.ok(!text.includes('.maintenance/snapshots/'),'Private maintenance paths excluded');
 assert.ok(!text.includes('C:\\Users\\plane'),'No absolute local path');
 assert.doesNotMatch(text,/(?:sk-ant-api03-|sk-proj-)[A-Za-z0-9_-]{20,}/);
 assert.doesNotMatch(text,/warehouse13-ai-quest-progress-v1|\/api\/internal\/ai-quest\//);
 const report=JSON.parse(readFileSync(join(site,'maintenance.json'),'utf8'));assert.equal(report.activeVersion,registry.version);
 for(const s of report.sources){assert.ok(s.url.startsWith('https://'));assert.ok(!('snapshot' in s));}
 assert.equal(manifest.files.filter(f=>f.path.endsWith('.webp')).length,138);
 return {registryVersion:registry.version,counts,inputHashes:Object.keys(inputHashes).length,servedFiles:manifest.files.length,servedBytes:manifest.files.reduce((n,f)=>n+f.bytes,0),byteIdenticalCanonicalWebPs:138,registrySha256:manifest.source.registrySha256,deliveryManifestSha256:sha(readFileSync(manifestPath))};
}
if(check){const m=JSON.parse(readFileSync(manifestPath,'utf8'));console.log(JSON.stringify(verify(m),null,2));}
else{
 const tempRoot=realpathSync(tmpdir()),scratch=mkdtempSync(join(tempRoot,'aiquest-public-build-')),built=join(scratch,'site');
 try{
  execFileSync(process.execPath,[join(source,'node_modules/typescript/bin/tsc'),'--noEmit','-p',join(source,'tsconfig.json')],{cwd:source,stdio:'inherit'});
  execFileSync(process.execPath,[join(source,'node_modules/vite/bin/vite.js'),'build',source,'--outDir',built,'--emptyOutDir'],{cwd:source,stdio:'inherit'});
  const report=JSON.parse(readFileSync(join(source,'public/maintenance.json'),'utf8'));
  const publicReport={checkedAt:report.checkedAt,fetchedAll:report.fetchedAll,verifiedAll:report.verifiedAll,pendingReview:report.pendingReview,publishedAt:report.publishedAt,activeVersion:report.activeVersion,changelog:report.changelog?.map(({version,date,summary,affectedLessonIds})=>({version,date,summary,affectedLessonIds})),sources:report.sources.map(({id,title,url,fetchedAt,verifiedAt,fetched,changed,sha256})=>({id,title,url,fetchedAt,verifiedAt,fetched,changed,sha256}))};
  writeFileSync(join(built,'maintenance.json'),JSON.stringify(publicReport,null,2)+'\n');
  const files=walk(built).map(p=>{const name=rel(built,p);assert.ok(allowed(name),'Unexpected public delivery '+name);const b=readFileSync(p);return {path:name,mime:mime(name),bytes:b.length,sha256:sha(b)};});
  for(const[n,h]of Object.entries(inputHashes))assert.equal(sha(readFileSync(join(source,n))),h,'Canonical input changed during build: '+n);
  if(existsSync(site)){
   assert.ok(existsSync(manifestPath),'Refuse to replace an unmanifested site');
   verify(JSON.parse(readFileSync(manifestPath,'utf8')));
   assert.equal(realpathSync(site),site);assert.ok(site.startsWith(target+sep));rmSync(site,{recursive:true});
  }
  mkdirSync(target,{recursive:true});cpSync(built,site,{recursive:true});
  const manifest={schemaVersion:1,source:{commit:git('rev-parse','HEAD'),registryVersion:registry.version,registrySha256:inputHashes['src/data/registry.json'],inputHashes},counts,base:'/',learnerStorage:'browser-local; separate origin; explicit export/import only',reportPolicy:'Published public source metadata only; excludes maintenance snapshot paths, reviewer identity and local candidate identifiers',files};
  writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify(verify(manifest),null,2));
 }finally{assert.equal(realpathSync(scratch),scratch);assert.ok(scratch.startsWith(tempRoot+sep+'aiquest-public-build-'));rmSync(scratch,{recursive:true,force:true});}
}
