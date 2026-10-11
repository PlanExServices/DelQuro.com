import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const {products,categories}=JSON.parse(read('catalog/products.json'));
assert.equal(products.length,30,'Approved map has 30 entries');
assert.equal(new Set(products.map(p=>p.id)).size,products.length,'Unique product ids');
assert.equal(new Set(products.map(p=>p.detail)).size,products.length,'Unique detail pages');
const allowed=new Set(['available','coming-soon','prototype','access-pending','studio']);
const catalog=read('products.html'),home=read('index.html'),sitemap=read('sitemap.xml');
assert.equal([...catalog.matchAll(/data-product /g)].length,products.length);
for(const p of products){
  assert(categories.some(c=>c.id===p.category),`Category for ${p.id}`);
  assert(allowed.has(p.availability),`Availability for ${p.id}`);
  assert.equal(Boolean(p.launch),p.availability==='available',`Only approved available apps may launch: ${p.id}`);
  if(p.launch)assert.equal(new URL(p.launch).protocol,'https:');
  assert.match(p.detail,/^apps\/[a-z0-9-]+\.html$/);
  const detail=read(p.detail);
  assert(detail.includes(`data-product-status="${p.id}" data-availability="${p.availability}"`),`Detail status for ${p.id}`);
  assert(sitemap.includes(`/${p.detail}</loc>`),`Sitemap for ${p.id}`);
  assert(catalog.includes(`id="${p.id}" data-product data-category="${p.category}" data-availability="${p.availability}"`),`Card for ${p.id}`);
  if(p.highlight){assert(p.launch,`Highlight is launchable: ${p.id}`);assert(home.includes(p.launch),`Home highlight link: ${p.id}`)}
}
for(const id of ['delquro-connect','vmta']){const p=products.find(p=>p.id===id);assert.equal(p.availability,'access-pending');assert(!read(p.detail).includes('target="_blank"'),'Gated detail has no app launcher');}
assert.equal(products.filter(p=>p.launch).length,9);
assert.equal(products.find(p=>p.id==='megatory-live').category,'veterinary');
assert.match(products.find(p=>p.id==='solar').description,/K–12/);
assert(!/solar\.delquro\.com|plainslang\.com|choremouse\.com|99% Match/.test(catalog+home));
assert(!sitemap.includes('/404.html')&&!sitemap.includes('index-inline'));
const about=read('about.html');assert.match(about,/AI.rendered character/);assert(!/\.webm[?"']/.test(about));
assert(read('assets/react-bits-LICENSE.txt').includes('Copyright (c) 2026 David Haz'));
console.log('Catalog verified: 30 consistent entries, 9 launchable apps, gated access, metadata and source notices.');
