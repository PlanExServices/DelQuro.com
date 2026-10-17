#!/usr/bin/env node
// Read-only, opt-in check of external public product destinations. Run separately
// from deterministic CI: external services and certificate chains can be down.
import fs from 'node:fs';
import { validateCatalog } from './catalog-model.mjs';

const data=JSON.parse(fs.readFileSync(new URL('../catalog/products.json',import.meta.url),'utf8'));
validateCatalog(data);
const targets=data.products.filter(p=>p.launch);
const results=[];
for(const p of targets){
  try {
    // GET is intentional: some healthy sites do not implement HEAD correctly.
    const response=await fetch(p.launch,{redirect:'follow',signal:AbortSignal.timeout(20000)});
    const type=response.headers.get('content-type')||'';
    const html=type.includes('text/html')?await response.text():'';
    const title=html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()||'';
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    if(new URL(response.url).protocol!=='https:')throw new Error('Redirect downgraded HTTPS');
    if(!title.toLowerCase().includes(p.linkCheck.titleIncludes.toLowerCase()))throw new Error(`Destination identity differs: ${title||type}`);
    results.push({id:p.id,ok:true,status:response.status,url:response.url,title});
    console.log(`PASS ${p.name}: ${response.status} ${response.url}`);
  } catch(error) {
    results.push({id:p.id,ok:false,url:p.launch,error:error.cause?.code||error.message});
    console.error(`FAIL ${p.name}: ${error.cause?.code||error.message}`);
  }
}
console.log(`${results.filter(r=>r.ok).length}/${targets.length} public destinations verified by GET and page identity. This is not a production-readiness assessment.`);
if(results.some(r=>!r.ok))process.exitCode=1;
