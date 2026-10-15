#!/usr/bin/env node
// Dependency-free static publishing. Never requires JavaScript to read the catalog.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stages, movedPages, validateCatalog } from './catalog-model.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogData = JSON.parse(fs.readFileSync(path.join(root, 'catalog/products.json'), 'utf8'));
validateCatalog(catalogData);
const { products, categories, reviewedOn } = catalogData;
const check = process.argv.includes('--check');
const changed = [];
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const category = id => categories.find(c => c.id === id);
const label = p => stages[p.availability].label;
const available = products.filter(p => p.launch);
const released = products.filter(p => p.availability === 'available');
const previews = products.filter(p => p.availability === 'preview');
const ordered = [...products].sort((a,b) => stages[a.availability].order-stages[b.availability].order || a.name.localeCompare(b.name, 'en'));
const contact = p => `mailto:info@delquro.com?subject=${encodeURIComponent(p.name)}`;
const iconGlyph = p => p.icon==='delquro-labs'?'<img src="/assets/dq-mark.png" width="96" height="96" alt="">':`<svg viewBox="0 0 32 32" focusable="false"><use href="/assets/product-icons.svg#${esc(p.icon)}"></use></svg>`;
const productIcon = (p, className) => `<span class="${className}" aria-hidden="true">${iconGlyph(p)}</span>`;
const categoryEmblem = p => `<span class="category-emblem" aria-hidden="true"><span class="emblem-orbit"></span>${iconGlyph(p)}</span>`;
const featuredDemos = {
  'ai-quest': fs.readFileSync(path.join(root, 'assets/product-previews/ai-quest.svg'), 'utf8').trim(),
  choremouse: `<svg viewBox="0 0 320 72" aria-hidden="true"><path class="demo-guide" d="M0 36h320"/><g class="demo-task"><rect x="22" y="13" width="86" height="46" rx="10"/><circle cx="42" cy="27" r="6"/><path d="m39 27 2 2 4-5"/><path d="M55 25h37M55 35h25"/></g><g class="demo-task"><rect x="117" y="13" width="86" height="46" rx="10"/><circle cx="137" cy="27" r="6"/><path d="m134 27 2 2 4-5"/><path d="M150 25h37M150 35h25"/></g><g class="demo-task"><rect x="212" y="13" width="86" height="46" rx="10"/><circle cx="232" cy="27" r="6"/><path d="m229 27 2 2 4-5"/><path d="M245 25h37M245 35h25"/></g></svg>`,
  clipscript: `<svg viewBox="0 0 320 72" aria-hidden="true"><path class="demo-guide" d="M0 36h320"/><g class="demo-frame"><rect x="24" y="12" width="75" height="43" rx="8"/><path d="m52 23 16 10-16 10z"/></g><g class="demo-frame"><rect x="111" y="12" width="75" height="43" rx="8"/><path d="M124 25h48M124 34h35M124 43h42"/></g><g class="demo-frame"><rect x="198" y="12" width="75" height="43" rx="8"/><path d="M211 25h48M211 34h31M211 43h42"/></g><path class="demo-playhead" d="M31 62h235"/><circle class="demo-playhead-dot" cx="31" cy="62" r="4"/></svg>`,
  jarvis: `<svg viewBox="0 0 320 72" aria-hidden="true"><path class="demo-link" d="M57 36h75m56 0h75M160 13v11m0 24v11"/><circle class="demo-node" cx="46" cy="36" r="11"/><circle class="demo-node" cx="274" cy="36" r="11"/><circle class="demo-node" cx="160" cy="8" r="6"/><circle class="demo-node" cx="160" cy="64" r="6"/><circle class="demo-hub" cx="160" cy="36" r="24"/><path class="demo-hub-mark" d="M149 37h22m-11-11v22"/></svg>`,
  'megatory-live': `<svg viewBox="0 0 320 72" aria-hidden="true"><g class="demo-stock"><rect x="26" y="12" width="268" height="14" rx="4"/><path d="M42 19h71m105 0h48"/><circle cx="192" cy="19" r="4"/></g><g class="demo-stock"><rect x="26" y="29" width="268" height="14" rx="4"/><path d="M42 36h96m80 0h48"/><circle cx="192" cy="36" r="4"/></g><g class="demo-stock"><rect x="26" y="46" width="268" height="14" rx="4"/><path d="M42 53h83m93 0h48"/><circle cx="192" cy="53" r="4"/></g></svg>`,
  plainslang: `<svg viewBox="0 0 320 72" aria-hidden="true"><g class="demo-bubble"><path d="M27 14h93a9 9 0 0 1 9 9v25a9 9 0 0 1-9 9H60l-12 8v-8H27a9 9 0 0 1-9-9V23a9 9 0 0 1 9-9z"/><path d="M42 30h54M42 41h36"/></g><path class="demo-translation" d="M145 36h30m-8-8 8 8-8 8"/><g class="demo-bubble"><path d="M202 14h91a9 9 0 0 1 9 9v25a9 9 0 0 1-9 9h-22v8l-12-8h-57a9 9 0 0 1-9-9V23a9 9 0 0 1 9-9z"/><path d="M214 30h67M214 41h52"/></g></svg>`,
  'vetform-go': `<svg viewBox="0 0 320 72" aria-hidden="true"><rect class="demo-form" x="64" y="5" width="192" height="62" rx="8"/><path class="demo-form-line" d="M82 20h86M82 31h112M82 42h100M82 53h71"/><rect class="demo-form-check" x="213" y="16" width="24" height="24" rx="5"/><path class="demo-form-tick" d="m219 28 5 5 8-10"/></svg>`,
  plotperks: `<svg viewBox="0 0 320 72" aria-hidden="true"><path class="demo-garden-line" d="M0 61h320"/><path class="demo-pot" d="M126 39h68l-8 25h-52z"/><path class="demo-stem" d="M160 40V12"/><path class="demo-leaf" d="M160 31c-24 0-28-19-28-19 16-1 27 5 28 19zm0-9c1-17 12-22 28-21-2 14-12 21-28 21z"/><circle class="demo-care" cx="245" cy="30" r="17"/><path class="demo-care-hand" d="M245 20v11l8 5"/><path class="demo-water" d="M79 31c0-9 8-17 8-17s8 8 8 17a8 8 0 0 1-16 0z"/></svg>`,
  'vet-survey': `<svg viewBox="0 0 320 72" aria-hidden="true"><g class="demo-survey-row"><rect x="51" y="10" width="218" height="14" rx="4"/><rect x="62" y="14" width="7" height="7" rx="2"/><path d="M79 17h93"/></g><g class="demo-survey-row"><rect x="51" y="29" width="218" height="14" rx="4"/><rect x="62" y="33" width="7" height="7" rx="2"/><path d="M79 36h121"/></g><g class="demo-survey-row"><rect x="51" y="48" width="218" height="14" rx="4"/><rect x="62" y="52" width="7" height="7" rx="2"/><path d="M79 55h76"/></g><path class="demo-survey-mark" d="m62 36 2 2 5-6"/></svg>`,
  'coloring-book-forge': `<svg viewBox="0 0 320 72" aria-hidden="true"><rect class="demo-page" x="87" y="5" width="146" height="62" rx="6"/><circle class="demo-color-petal" cx="145" cy="30" r="11"/><circle class="demo-color-petal" cx="166" cy="30" r="11"/><circle class="demo-color-petal" cx="156" cy="46" r="11"/><circle class="demo-color-center" cx="156" cy="35" r="6"/><path class="demo-color-stroke" d="M189 51c19-1 23-11 37-13"/></svg>`
};
const cardDemo = p => `<span class="card-demo" data-demo="${p.id}" data-preview="${featuredDemos[p.id]?'specific':'generic'}" aria-hidden="true">${featuredDemos[p.id] || `<span class="demo-generic-glyph">${iconGlyph(p)}</span><span class="demo-generic-lines"><i></i><i></i><i></i></span><span class="demo-generic-dot"></span>`}</span>`;
const logo = `<a class="brand" href="/" aria-label="DelQuro Labs home"><img src="/assets/dq-mark.png" width="44" height="44" alt=""><img class="brand-word" src="/assets/wordmark-light.svg" width="152" height="28" alt="DelQuro Labs"></a>`;
function nav(active) {
  return `<header class="topbar"><div class="wrap navrow">${logo}<button class="menu" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="primary-navigation">☰</button><nav id="primary-navigation" class="nav pill-nav" aria-label="Primary">${[['Home','/'],['Products','/products.html'],['About','/about.html'],['Resources','/resources.html'],['Support','/support.html']].map(([name,url])=>`<a href="${url}"${name===active?' class="active" aria-current="page"':''}><span>${name}</span></a>`).join('')}</nav></div></header>`;
}
function footer() {
  return `<footer><div class="wrap"><div class="footer-grid"><div class="footer-brand">${logo}<p>Small, focused software.<br>Made for the everyday.</p></div><div><div class="footer-title">Explore</div><div class="footer-links"><a href="/products.html">All ${products.length} products</a><a href="/#client-websites">Client website mockups</a><a href="/about.html">Our studio</a><a href="/resources.html">Resources</a><a href="/Sounds/">Sound Library</a></div></div><div><div class="footer-title">Get in touch</div><div class="footer-links"><a href="/support.html">Product support</a><a href="mailto:info@delquro.com">info@delquro.com</a></div></div><div><div class="footer-title">Details</div><div class="footer-links"><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/account-deletion.html">Account deletion</a><a href="/assets/react-bits-LICENSE.txt">Component notices</a></div></div></div><div class="copyright"><span>© 2026 DelQuro Labs, LLC.</span><span>Built thoughtfully in Virginia</span></div></div></footer>`;
}
function head(title, description, url, extras = '') {
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#0b171b"><link rel="icon" href="/assets/app-icon.svg"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><link rel="canonical" href="https://www.delquro.com${url}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="https://www.delquro.com${url}"><meta property="og:image" content="https://www.delquro.com/assets/og-image.jpg"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/refresh.css">${extras}`;
}
const page = (title,description,url,active,body,headExtras='',scripts='') => `<!doctype html>\n<html lang="en"><head>${head(title,description,url,headExtras)}</head><body><a class="skip" href="#main">Skip to content</a>${nav(active)}<main id="main">${body}</main>${footer()}<script src="/site.js" defer></script>${scripts}</body></html>\n`;
function actions(p, full=false) {
  const action=stages[p.availability].action;
  if(p.id==='ai-scripts' && full) return `<div class="card-actions"><a class="btn primary" href="#script-grid">Browse templates <span aria-hidden="true">↑</span></a><a class="text-link" href="${contact(p)}">Contact the studio</a></div>`;
  return `<div class="card-actions">${p.launch?`<a class="btn primary" href="${esc(p.launch)}" target="_blank" rel="noopener noreferrer">${action} <span aria-hidden="true">↗</span><span class="sr-only">: ${esc(p.name)} (new tab)</span></a>`:`<a class="btn ${full?'primary':'secondary'}" href="${full?contact(p):'/'+p.detail}">${full?(p.availability==='limited-access'?'Ask about clinic access':'Ask about progress'):(p.id==='ai-scripts'?'Try the templates':'View project')}<span class="sr-only">: ${esc(p.name)}</span> <span aria-hidden="true">→</span></a>`}${p.launch||!full?`<a class="text-link" href="${full||!p.launch?contact(p):'/'+p.detail}">${full?'Contact the studio':p.launch?'Details':'Contact us'}<span class="sr-only">: ${esc(p.name)}</span></a>`:''}</div>`;
}
function card(p, catalog=false) {
  return `<article class="app-card spotlight reveal" data-motion="${p.motion}"${catalog?` id="${p.id}" data-product data-category="${p.category}" data-availability="${p.availability}" data-search="${esc((p.name+' '+p.description).toLowerCase())}"`:''} style="--product:${p.color}"><div class="card-top">${productIcon(p,'product-symbol')}<span class="availability ${p.availability}">${label(p)}</span></div>${cardDemo(p)}<p class="card-category">${esc(category(p.category).name)}</p><h${catalog?'2':'3'}>${esc(p.name)}</h${catalog?'2':'3'}><p class="card-description">${esc(p.description)}</p><p class="card-release-note">${esc(p.releaseNote)}</p>${actions(p)}</article>`;
}
function write(name,content) {
  const target=path.join(root,name);
  if(fs.existsSync(target)&&fs.readFileSync(target,'utf8')===content) return;
  changed.push(name);
  if(!check) fs.writeFileSync(target,content);
}
const publicPages = new Set([...products.map(p=>p.detail),...Object.keys(movedPages),'apps/ai-agent-scripts.html','apps/ai-prompt-scripts.html']);
for(const entry of fs.readdirSync(path.join(root,'apps'),{withFileTypes:true})) {
  const name='apps/'+entry.name;
  if(entry.isFile() && entry.name.endsWith('.html') && !publicPages.has(name)) {
    throw new Error(`Unlisted app page requires review before publishing: ${name}. Add an intentional public listing/alias or remove the reviewed file manually. No pages were written.`);
  }
}
const highlights = ordered.filter(p=>p.highlight).sort((a,b)=>Number(b.id==='choremouse')-Number(a.id==='choremouse') || stages[a.availability].order-stages[b.availability].order || a.name.localeCompare(b.name,'en'));
for(const [name,target] of Object.entries(movedPages)) {
  write(name,`<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><link rel="canonical" href="https://www.delquro.com${target.split('#')[0]}"><meta http-equiv="refresh" content="0;url=${target}"><title>Continue to DelQuro Labs</title></head><body><a href="${target}">Continue to the current page</a></body></html>\n`);
}
const clientMockups = `<section class="section client-websites" id="client-websites" aria-labelledby="client-websites-heading">
  <div class="wrap">
    <div class="section-head">
      <div><p class="eyebrow">Website concepts</p><h2 id="client-websites-heading">Client website mockups</h2></div>
      <p>A closer look at website designs prepared for review.</p>
    </div>
    <article class="website-mockup" aria-labelledby="mfcc-heading">
      <div class="mockup-window">
        <div class="mockup-window-bar" aria-hidden="true"><span class="mockup-window-dots"><i></i><i></i><i></i></span><span>mfcc.delqurolabs.dev</span><span>↗</span></div>
        <img src="/assets/client-mockups/mfcc-preview.jpg" width="1280" height="800" loading="lazy" decoding="async" alt="MFCC website concept with a navy and white layout, the headline Chiropractic. Made personal., and a photograph of the two doctors.">
      </div>
      <div class="mockup-copy">
        <span class="availability prototype">Design preview</span>
        <p class="mockup-category">Healthcare · Midlothian, Virginia</p>
        <h3 id="mfcc-heading">Midlothian Family Chiropractic Center</h3>
        <p>A website concept featuring the practice's doctors, care options, and first-visit information.</p>
        <p class="mockup-note">Concept mockup prepared for practice review.</p>
        <a class="btn primary" href="https://mfcc.delqurolabs.dev/" target="_blank" rel="noopener noreferrer">View MFCC mockup <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>
      </div>
    </article>
  </div>
</section>`;
const home = `<section class="home-hero"><div class="wrap hero-layout"><div class="hero-copy"><p class="eyebrow"><span class="tiny-dot"></span> An independent product studio</p><h1>Small apps.<br><span class="gradient-text">Everyday possibilities.</span></h1><p class="lead">A little less friction. A little more room for what matters. We build focused tools for home, work, and the ideas in between.</p><div class="actions"><a class="btn primary" href="#available">Find your next useful app <span aria-hidden="true">↘</span></a><a class="text-link" href="/about.html">Meet the studio <span aria-hidden="true">→</span></a></div><div class="hero-proof"><span><b>${released.length}</b> available app</span><span><b>${previews.length}</b> public previews</span><a class="hero-mockup-link" href="#client-websites">Client website mockups <span aria-hidden="true">↘</span></a></div></div><div class="studio-art" aria-label="DelQuro Labs"><div class="art-grid" aria-hidden="true"></div><a class="hero-logo-glitch" href="/" aria-label="DelQuro Labs home"><img src="/assets/dq-lockup.png" width="400" height="247" alt="DelQuro Labs — teal D and silver Q"></a><span class="art-caption">Thoughtful tools. Real life.</span><span class="art-coordinate" aria-hidden="true">DQ / EST. 2022</span></div></div></section><section class="section releases" id="available"><div class="wrap"><div class="section-head"><div><p class="eyebrow">Explore what is open</p><h2 class="tech-text-heading" data-tech-text="Useful starts here.">Useful starts here.<canvas class="tech-text-canvas" aria-hidden="true"></canvas></h2></div><p>Explore an available app or try a clearly labeled preview.</p></div><div class="app-grid">${highlights.map(p=>card(p)).join('\n')}</div><div class="browse-line"><span>${available.length} public destinations. Every card shows its release stage.</span><a class="text-link" href="/products.html">Browse all products <span aria-hidden="true">→</span></a></div></div></section><section class="section category-section"><div class="wrap"><div class="section-head"><div><p class="eyebrow">Find your corner</p><h2>Made for different days.</h2></div><p>From family routines to veterinary workflows, there is a place to start.</p></div><div class="category-grid">${categories.map((c,i)=>`<a class="category-tile spotlight" data-motion="${c.motion}" href="/products.html#${c.id}" style="--product:${c.color}">${categoryEmblem(c)}<span class="category-number">0${i+1}</span><h3>${esc(c.name)}</h3><p>${esc(c.description)}</p><span class="category-bottom">${products.filter(p=>p.category===c.id).length} projects <span aria-hidden="true">↗</span></span></a>`).join('')}</div><div class="radar-band"><div class="radar-copy"><p class="eyebrow">The broader collection</p><h3>See what is on the horizon.</h3><p>Every project has a stage. Explore what you can use today and what the studio is still shaping.</p><a class="text-link" href="/products.html">Browse the full collection <span aria-hidden="true">→</span></a></div><div class="radar-panel" aria-hidden="true"><div class="radar-container" data-radar><canvas class="radar-canvas"></canvas></div><span class="radar-panel-label">DelQuro / discovery</span></div></div></div></section>${clientMockups}<section class="section studio-note"><div class="wrap note-layout"><div><p class="eyebrow">The DelQuro approach</p><h2>Keep it clear.<br>Make it matter.</h2></div><div><p>We start with the moments that could work better. Then we build small, listen closely, and keep refining.</p><p>Our collection includes available apps, experiments, and ideas still taking shape. Every project tells you where it stands.</p><a class="text-link" href="/about.html">A closer look at the studio <span aria-hidden="true">→</span></a></div></div></section><section class="section"><div class="wrap contact-band"><div><p class="eyebrow">A good conversation is a start</p><h2>Something on your mind?</h2><p>Questions, feedback, or an everyday problem worth solving.</p></div><a class="btn primary" href="mailto:info@delquro.com">Say hello <span aria-hidden="true">↗</span></a></div></section>`;
write('index.html',page('DelQuro Labs — Small apps. Everyday possibilities.',`Explore available apps, public previews, and ${products.length} focused projects for families, veterinary teams, creators, and learners.`, '/', 'Home',home,'<link rel="stylesheet" href="/radar.css"><link rel="stylesheet" href="/glitch-logo.css"><link rel="stylesheet" href="/tech-text.css">','<script src="/radar.js" defer></script><script src="/tech-text.js" defer></script>'));
const filters = `<form class="catalog-filters" id="catalog-filters" role="search" aria-label="Find products" hidden><div class="search-field"><label for="product-search">Search products</label><input id="product-search" type="search" name="search" placeholder="Try chores, forms, or writing" autocomplete="off"></div><div><label for="category-filter">Category</label><select id="category-filter" name="category"><option value="all">All categories</option>${categories.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div><div><label for="availability-filter">Availability</label><select id="availability-filter" name="availability"><option value="all">All stages</option>${Object.entries(stages).map(([value,stage])=>`<option value="${value}">${stage.label}</option>`).join('')}</select></div><button class="btn secondary" type="reset">Reset</button></form>`;
const catalog = `<section class="catalog-intro"><div class="wrap"><p class="eyebrow">The collection</p><h1>A useful little universe.</h1><p class="lead">Explore tools for your day and ideas for tomorrow. Available apps and public previews come first. Clinic access and work in progress are labeled separately.</p><div class="collection-counts"><span><b>${products.length}</b> projects</span><span><b>${released.length}</b> available</span><span><b>${previews.length}</b> public previews</span><span><b>${categories.length}</b> categories</span></div></div></section><section class="section catalog-section"><div class="wrap">${filters}<nav class="category-rail" aria-label="Browse by category"><a href="/products.html" data-category-link="all">All</a>${categories.map(c=>`<a id="${c.id}" data-category-link="${c.id}" href="#${c.id}">${esc(c.name)} <span>${products.filter(p=>p.category===c.id).length}</span></a>`).join('')}<a id="inventory" data-category-link="veterinary" href="#veterinary" class="sr-only">Inventory is now in Veterinary</a></nav><div class="results-line"><p id="result-count" role="status" aria-live="polite" aria-atomic="true">Showing all ${products.length} projects</p><span>By release stage · then A–Z</span></div><noscript><p class="no-script-note">All ${products.length} projects are shown below. Search and filters are available when JavaScript is enabled.</p></noscript><div class="app-grid catalog-grid" id="catalog-grid">${ordered.map(p=>card(p,true)).join('\n')}</div><div class="empty-state" id="empty-state" hidden><span aria-hidden="true">⌕</span><h2>No projects found.</h2><p>Try another word or choose a different category.</p><button class="btn primary" type="button" id="clear-filters">Reset filters</button></div><p class="catalog-footnote">Available apps, public previews, clinic access, and work in progress are separate stages. Preview limitations appear on each card. Last reviewed <time datetime="${reviewedOn}">${reviewedOn}</time>.</p></div></section>`;
write('products.html',page('Products — DelQuro Labs',`Find public apps and previews, and browse ${products.length} DelQuro projects by category and release stage.`, '/products.html','Products',catalog));
function status(p) {
  return `<section class="section generated-status" aria-label="Product availability" data-product-status="${p.id}" data-availability="${p.availability}"><div class="wrap status-strip"><div><span class="availability ${p.availability}">${label(p)}</span><h2>${esc(p.name)}</h2><p>${esc(p.releaseNote)}</p></div>${actions(p,true)}</div></section>`;
}
for(const p of products) {
  if(p.id==='ai-scripts') continue; // preserve the interactive library, enhance its shared shell below
  const body=`<section class="app-hero product-detail"><div class="wrap"><div class="crumb"><a href="/products.html#${p.category}">Products</a><span aria-hidden="true">/</span><span>${esc(category(p.category).name)}</span></div><div class="detail-layout"><div><p class="eyebrow">${esc(category(p.category).name)}</p><h1>${esc(p.name)}</h1><p class="lead">${esc(p.description)}</p>${actions(p,true)}</div><div class="detail-art spotlight" style="--product:${p.color}">${productIcon(p,'detail-symbol')}<span class="availability ${p.availability}">${label(p)}</span></div></div></div></section>${status(p)}<section class="section"><div class="wrap detail-note"><h2>A focused place to start.</h2><p>${p.availability==='limited-access'?'This product is used through participating clinics. Contact the studio about access and the current release.':p.launch?'Read the release note above, then explore the current app or preview. Contact the studio for help or feedback.':'This project is still taking shape. Its release stage is shown above; contact the studio about progress.'}</p><a class="text-link" href="/products.html">Back to all products <span aria-hidden="true">→</span></a></div></section>`;
  write(p.detail,page(`${p.name} — DelQuro Labs`,`${p.description} ${label(p)}.`,`/${p.detail}`,'Products',body));
}
// Normalize the shell only; keep existing legal copy, media, and AI Scripts code.
const supporting = ['about.html','resources.html','support.html','privacy.html','terms.html','account-deletion.html','Sounds/index.html','404.html','apps/ai-scripts.html','apps/ai-agent-scripts.html','apps/ai-prompt-scripts.html'];
for(const name of supporting) {
  const file=path.join(root,name); if(!fs.existsSync(file))continue;
  let html=fs.readFileSync(file,'utf8');
  const active = name.startsWith('apps/')?'Products':name==='about.html'?'About':name==='resources.html'||name.startsWith('Sounds/')?'Resources':name==='support.html'?'Support':'';
  html=html.replace(/<header\b[^>]*>[\s\S]*?<\/header>/i,nav(active)).replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/i,footer());
  html=html.replace(/<script\b[^>]*src="(?:\.\.\/)?site\.js[^"<>]*"[^>]*><\/script>/gi,'<script src="/site.js" defer></script>');
  html=html.replace(/<link\b[^>]*href="(?:\.\.\/|\/)?(?:style|refresh)\.css[^"<>]*"[^>]*>/gi,'');
  if(!/<link[^>]+rel="canonical"/i.test(html)) html=html.replace('</head>',`<link rel="canonical" href="https://www.delquro.com/${name==='Sounds/index.html'?'Sounds/':name}"></head>`);
  if(!/property="og:image"/.test(html))html=html.replace('</head>','<meta property="og:image" content="https://www.delquro.com/assets/og-image.jpg"><meta name="twitter:card" content="summary_large_image"></head>');
  if(!/name="viewport"/.test(html))html=html.replace('</head>','<meta name="viewport" content="width=device-width,initial-scale=1"></head>');
  if(!/name="description"/.test(html))html=html.replace('</head>','<meta name="description" content="Continue to the current DelQuro Labs product page."></head>');
  if(!/property="og:title"/.test(html)){
    const title=html.match(/<title>([^<]+)<\/title>/)?.[1]||'DelQuro Labs';
    const description=html.match(/<meta name="description" content="([^"]+)"/)?.[1]||'Focused software for everyday life.';
    const canonical=html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    html=html.replace('</head>',`<meta property="og:type" content="website"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${canonical}"></head>`);
  }
  html=html.replace(/<meta name="theme-color" content="[^"]+">/,'<meta name="theme-color" content="#0b171b">');
  if(name==='apps/ai-scripts.html') {
    const p=products.find(p=>p.id==='ai-scripts');
    html=html.replace(/<section class="section generated-status"[\s\S]*?<\/section>/g,'');
    html=html.replace('</main>',`${status(p)}</main>`);
  }
  html=html.replace(/<\/head>/i,'<link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/refresh.css"></head>');
  html=html.replace(/[ \t]+$/gm,'');
  write(name,html);
}
write('index-inline.html','<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><link rel="canonical" href="https://www.delquro.com/"><meta http-equiv="refresh" content="0;url=/"><title>DelQuro Labs</title></head><body><a href="/">Continue to DelQuro Labs</a></body></html>\n');
const urls = ['','products.html','about.html','resources.html','support.html','privacy.html','terms.html','account-deletion.html','Sounds/',...products.map(p=>p.detail)];
write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url=>`  <url><loc>https://www.delquro.com/${url}</loc></url>`).join('\n')}\n</urlset>\n`);
if(check && changed.length) { console.error('Generated files are stale:',changed.join(', ')); process.exitCode=1; }
else console.log(`${check?'Verified':'Generated'} ${products.length} entries, ${released.length} available, ${previews.length} previews, ${categories.length} categories. ${changed.length} files ${check?'differ':'updated'}.`);
