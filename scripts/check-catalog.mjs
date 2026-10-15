import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stages, movedPages, validateCatalog } from './catalog-model.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const data=JSON.parse(read('catalog/products.json'));
validateCatalog(data);
const {products,categories}=data;
assert(!products.some(p=>p.id==='plotperks'),'Private PlotPerks is not a public catalog entry');
assert(!categories.some(c=>c.id==='garden'),'Empty Garden category is not public');
assert(!fs.existsSync(path.join(root,'apps/plot-perks.html')),'Private PlotPerks detail route is not published');
assert.equal(new Set(products.map(p=>p.id)).size,products.length,'Unique product ids');
assert.equal(new Set(products.map(p=>p.detail)).size,products.length,'Unique detail pages');
const allowed=new Set(Object.keys(stages));
const catalog=read('products.html'),home=read('index.html'),sitemap=read('sitemap.xml');
const iconSprite=read('assets/product-icons.svg');
const sceneSprite=read('assets/product-scenes.svg');
assert.deepEqual([...sceneSprite.matchAll(/<symbol id="([^"]+)"/g)].map(([,id])=>id).sort(),products.map(p=>p.id).sort(),'One unique card scene for every public product');
assert(!/plot-?perks|category-garden|Garden · 21\+/i.test(catalog+home+sitemap+iconSprite+sceneSprite),'Private PlotPerks artwork, links and copy are absent from published pages');
const motions=new Set(['sequence','signal','sway','scan','build','orbit','glide','spark','breathe']);
assert.equal([...catalog.matchAll(/data-product /g)].length,products.length);
for(const c of categories){
  assert(motions.has(c.motion),`Category motion for ${c.id}`);
  assert.match(c.color,/^#[0-9a-f]{6}$/i,`Category color for ${c.id}`);
  assert.equal(c.icon,`category-${c.id}`,`Category artwork key for ${c.id}`);
  assert(iconSprite.includes(`<symbol id="${c.icon}"`),`Category artwork for ${c.id}`);
  assert(home.includes(`class="category-tile spotlight" data-motion="${c.motion}" href="/products.html#${c.id}" style="--product:${c.color}"`),`Category emblem for ${c.id}`);
}
for(const p of products){
  assert.equal(p.icon,p.id,`Manifest icon key for ${p.id}`);
  assert(motions.has(p.motion),`Product motion for ${p.id}`);
  assert(catalog.includes(`data-motion="${p.motion}" id="${p.id}"`),`Motion scene for ${p.id}`);
  if(p.id!=='delquro-labs'){
    assert(iconSprite.includes(`<symbol id="${p.icon}"`),`Vector artwork for ${p.id}`);
    assert(catalog.includes(`/assets/product-icons.svg#${p.icon}`),`Catalog icon for ${p.id}`);
  }
  assert(categories.some(c=>c.id===p.category),`Category for ${p.id}`);
  assert(allowed.has(p.availability),`Availability for ${p.id}`);
  assert.equal(p.visibility,'public',`Only public listings may be generated: ${p.id}`);
  if(p.launch)assert.equal(new URL(p.launch).protocol,'https:');
  assert.match(p.detail,/^apps\/[a-z0-9-]+\.html$/);
  const detail=read(p.detail);
  if(p.id!=='ai-scripts'&&p.id!=='delquro-labs')assert(detail.includes(`/assets/product-icons.svg#${p.icon}`),`Detail icon for ${p.id}`);
  assert(detail.includes(`data-product-status="${p.id}" data-availability="${p.availability}"`),`Detail status for ${p.id}`);
  assert(sitemap.includes(`/${p.detail}</loc>`),`Sitemap for ${p.id}`);
  assert(catalog.includes(`id="${p.id}" data-product data-category="${p.category}" data-availability="${p.availability}"`),`Card for ${p.id}`);
  if(p.highlight){assert(p.launch,`Highlight is launchable: ${p.id}`);assert(home.includes(p.launch),`Home highlight link: ${p.id}`)}
}
for(const p of products.filter(p=>p.availability==='limited-access')){
  assert(!p.launch,`Clinic-only listing has no launch: ${p.id}`);
  assert(!read(p.detail).includes('target="_blank"'),'Clinic detail has no app launcher');
}
const expectedPages=new Set([...products.map(p=>p.detail),...Object.keys(movedPages),'apps/ai-agent-scripts.html','apps/ai-prompt-scripts.html']);
for(const file of fs.readdirSync(path.join(root,'apps'))){
  if(file.endsWith('.html'))assert(expectedPages.has('apps/'+file),`Unlisted app page would be published: ${file}`);
}
const expectedIcons=new Set([...products.map(p=>p.icon),...categories.map(c=>c.icon)]);
for(const [,id] of iconSprite.matchAll(/<symbol id="([^"]+)"/g))assert(expectedIcons.has(id),`Unlisted icon would be published: ${id}`);
const privateFixture=structuredClone(data);privateFixture.products[0].visibility='private';
assert.throws(()=>validateCatalog(privateFixture),/Explicit public visibility/,'Private records fail before HTML generation');
const gatedFixture=structuredClone(data);gatedFixture.products[0].availability='limited-access';gatedFixture.products[0].launch='https://example.invalid/';
assert.throws(()=>validateCatalog(gatedFixture),/Restricted\/development projects cannot launch/,'Restricted products cannot receive public app buttons');
assert.equal(products.find(p=>p.id==='megatory-live').category,'veterinary');
assert.match(products.find(p=>p.id==='solar').description,/K–12/);
assert(!/solar\.delquro\.com|plainslang\.com|choremouse\.com|99% Match/.test(catalog+home));
assert(!sitemap.includes('/404.html')&&!sitemap.includes('index-inline'));
const about=read('about.html');assert.match(about,/AI.rendered character/);assert(!/\.webm[?"']/.test(about));
assert(read('assets/react-bits-LICENSE.txt').includes('Copyright (c) 2026 David Haz'));
console.log(`Catalog verified: ${products.length} public entries, ${products.filter(p=>p.launch).length} public destinations; release labels, visibility declarations, published pages and metadata agree.`);
