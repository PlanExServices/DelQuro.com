#!/usr/bin/env node
// Dependency-free static publishing. Never requires JavaScript to read the catalog.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stages, movedPages, validateCatalog, catalogSections, orderProducts } from './catalog-model.mjs';
import { renderPreview, renderGallery } from './product-previews.mjs';
import { renderSeo, applySeo, renderBreadcrumbs, publicRoutes, SITE_ORIGIN } from './seo.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogData = JSON.parse(fs.readFileSync(path.join(root, 'catalog/products.json'), 'utf8'));
validateCatalog(catalogData);
const { products, categories, reviewedOn } = catalogData;
const check = process.argv.includes('--check');
const changed = [];
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const category = id => categories.find(c => c.id === id);
const label = p => stages[p.availability].label;
const released = products.filter(p => p.availability === 'available');
const previews = products.filter(p => p.availability === 'preview');
const ordered = orderProducts(products);
const contact = p => `mailto:info@delquro.com?subject=${encodeURIComponent(p.name)}`;
const iconGlyph = p => p.icon==='delquro-labs'?'<img src="/assets/dq-mark.png" width="96" height="96" alt="">':`<svg viewBox="0 0 32 32" focusable="false"><use href="/assets/product-icons.svg#${esc(p.icon)}"></use></svg>`;
const productIcon = (p, className) => `<span class="${className}" aria-hidden="true">${iconGlyph(p)}</span>`;
const categoryEmblem = p => `<span class="category-emblem" aria-hidden="true"><span class="emblem-orbit"></span>${iconGlyph(p)}</span>`;
const artPalettes = {
  'note-thyme': ['#8de0a7', '#f4c884'],
  choremouse: ['#ffd479', '#f88e86'],
  plainslang: ['#79dce8', '#b2a2ff'],
  'what-list': ['#8de2b3', '#f6c577'],
  'delquro-connect': ['#98b4ff', '#78e5d2'],
  'vetform-go': ['#8fe4bd', '#88baff'],
  vmta: ['#9ed9dd', '#c1eedb'],
  'megatory-live': ['#5debd1', '#9dc8ff'],
  'ai-scripts': ['#b5a5ff', '#f4a4d6'],
  'ai-quest': ['#b6b5ff', '#ffd28a'],
  'delquro-zen': ['#9de6bb', '#a4b9f6'],
  solar: ['#ffd976', '#f598a5'],
  'cats-journey': ['#e5bf8c', '#8dcfe8']
};
const cardDemo = p => renderPreview(p,{palette:artPalettes[p.id]});
const logo = `<a class="brand" href="/" aria-label="DelQuro Labs home"><img src="/assets/dq-mark.png" width="44" height="44" alt=""><img class="brand-word" src="/assets/wordmark-light.svg" width="152" height="28" alt="DelQuro Labs"></a>`;
function nav(active) {
  return `<header class="topbar"><div class="wrap navrow">${logo}<button class="menu" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="primary-navigation">☰</button><nav id="primary-navigation" class="nav pill-nav" aria-label="Primary">${[['Home','/'],['Products','/products.html'],['About','/about.html'],['Resources','/resources.html'],['Support','/support.html']].map(([name,url])=>`<a href="${url}"${name===active?' class="active" aria-current="page"':''}><span>${name}</span></a>`).join('')}</nav></div></header>`;
}
function footer() {
  return `<footer><div class="wrap"><div class="footer-grid"><div class="footer-brand">${logo}<p>Small, focused software.<br>Made for the everyday.</p></div><div><div class="footer-title">Explore</div><div class="footer-links"><a href="/products.html">All ${products.length} products</a><a href="/about.html">Our studio</a><a href="/resources.html">Resources</a><a href="/Sounds/">Sound Library</a></div></div><div><div class="footer-title">Get in touch</div><div class="footer-links"><a href="/support.html">Product support</a><a href="mailto:info@delquro.com">info@delquro.com</a></div></div><div><div class="footer-title">Details</div><div class="footer-links"><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/account-deletion.html">Account deletion</a><a href="/assets/react-bits-LICENSE.txt">Component notices</a></div></div></div><div class="copyright"><span>© 2026 DelQuro Labs, LLC.</span><span>Built thoughtfully in Virginia</span></div></div></footer>`;
}
function head(title, description, url, extras = '') {
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${renderSeo({path:url,title,description,catalog:catalogData})}<meta name="theme-color" content="#0b171b"><link rel="icon" href="/assets/app-icon.svg"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/refresh.css?v=20261018-screens">${extras}<link rel="stylesheet" href="/redesign.css?v=20261018-screens"><link rel="stylesheet" href="/app-store.css?v=20261018-centered">`;
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
const previewHighlights = ordered.filter(p=>p.highlight && p.availability==='preview' && p.category!=='veterinary');
const veterinarySuite = ordered.filter(p=>p.category==='veterinary');
for(const [name,target] of Object.entries(movedPages)) {
  write(name,`<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><link rel="canonical" href="https://www.delquro.com${target.split('#')[0]}"><meta http-equiv="refresh" content="0;url=${target}"><title>Continue to DelQuro Labs</title></head><body><a href="${target}">Continue to the current page</a></body></html>\n`);
}
const home = `<section class="home-hero"><div class="wrap hero-layout">
  <div class="hero-copy"><p class="eyebrow"><span class="tiny-dot"></span> DelQuro Labs · Independent software studio</p><h1>Useful apps.<br><span class="gradient-text">For real life.</span></h1><p class="lead">Learn something new. Find a little clarity. Make the everyday easier. Explore focused apps for families, learners, creators, and veterinary teams.</p><div class="actions"><a class="btn primary" href="#available">Explore available apps <span aria-hidden="true">↗</span></a><a class="text-link" href="/products.html">Browse all products <span aria-hidden="true">↘</span></a></div><p class="hero-location">Small on purpose. Built in Virginia. <span>Est. 2022</span></p></div>
  <div class="studio-art" aria-label="DelQuro Labs"><div class="art-grid" aria-hidden="true"></div><div class="studio-art-top"><span>IDEAS INTO EVERYDAY TOOLS</span><span aria-hidden="true">↗</span></div><a class="hero-logo-glitch" href="/" aria-label="DelQuro Labs home"><img src="/assets/dq-lockup.png" width="400" height="247" fetchpriority="high" alt="DelQuro Labs — teal D and silver Q"></a><span class="art-caption">Thoughtful tools. Real life.</span><div class="studio-art-bottom"><span>Independent by design</span><span class="art-coordinate">DQ / EST. 2022</span></div></div>
</div></section>
<nav class="discovery-strip" aria-label="Find your starting point"><div class="wrap discovery-grid"><a href="#available"><b>${String(released.length).padStart(2,'0')}</b><span>Available apps<small>Find something useful today</small></span><span aria-hidden="true">↘</span></a><a href="#previews"><b>${String(previews.length).padStart(2,'0')}</b><span>Public previews<small>Explore what we are shaping</small></span><span aria-hidden="true">↘</span></a><a href="#categories"><b>${String(categories.length).padStart(2,'0')}</b><span>App categories<small>Find the right tool for your day</small></span><span aria-hidden="true">↘</span></a></div></nav>
<div class="releases">
  <section class="section available-section" id="available" aria-labelledby="available-heading"><div class="wrap"><div class="section-head"><div><p class="eyebrow">01 / Available apps</p><h2 class="tech-text-heading" id="available-heading" data-tech-text="Useful starts here.">Useful starts here.<canvas class="tech-text-canvas" aria-hidden="true"></canvas></h2></div><p>Focused tools to explore, learn, and make sense of your world. Open an app to get started.</p></div><div class="app-grid available-grid">${ordered.filter(p=>p.availability==='available').map(p=>card(p)).join('\n')}</div></div></section>
  <section class="section previews-section" id="previews" aria-labelledby="preview-heading"><div class="wrap"><div class="section-head"><div><p class="eyebrow">02 / From the studio</p><h2 id="preview-heading">A look at what’s next.</h2></div><p>Try a public preview and see where it stands. Each card explains the current limitations.</p></div><div class="app-grid preview-grid">${previewHighlights.map(p=>card(p)).join('\n')}</div><div class="browse-line"><span>${previews.length} public previews in the collection. Clinic access and future projects are labeled separately.</span><a class="text-link" href="/products.html">Browse all products <span aria-hidden="true">→</span></a></div></div></section>
</div>
<section class="section veterinary-section" id="veterinary-suite" aria-labelledby="veterinary-heading"><div class="wrap"><div class="section-head"><div><p class="eyebrow">03 / The veterinary suite</p><h2 id="veterinary-heading">Built for veterinary teams.</h2></div><p>Tools for clinic workflows, forms, team coordination and inventory. Each card explains its preview or clinic access.</p></div><div class="app-grid veterinary-grid">${veterinarySuite.map(p=>card(p)).join('\n')}</div><div class="browse-line"><span>Explore the screens, then check the release and access details.</span><a class="text-link" href="/products.html#veterinary">Explore the veterinary suite <span aria-hidden="true">→</span></a></div></div></section>
<section class="section category-section" id="categories"><div class="wrap"><div class="section-head"><div><p class="eyebrow">04 / Find your focus</p><h2>Different days.<br>Different possibilities.</h2></div><p>Explore apps and projects by the part of life they are built for.</p></div><div class="category-grid">${categories.map((c,i)=>{const total=products.filter(p=>p.category===c.id).length;return `<a class="category-tile spotlight" data-motion="${c.motion}" href="/products.html#${c.id}" style="--product:${c.color}">${categoryEmblem(c)}<span class="category-number">0${i+1}</span><h3>${esc(c.name)}</h3><p>${esc(c.description)}</p><span class="category-bottom">${total} ${total===1?'project':'projects'} <span aria-hidden="true">↗</span></span></a>`}).join('')}</div><div class="radar-band"><div class="radar-copy"><p class="eyebrow">Still taking shape</p><h3>See what is on the horizon.</h3><p>Public previews are a chance to explore and give feedback. Projects in development are ideas we are still building.</p><a class="text-link" href="/products.html">Browse the full collection <span aria-hidden="true">→</span></a></div><div class="radar-panel" aria-hidden="true"><div class="radar-container" data-radar><canvas class="radar-canvas"></canvas></div><span class="radar-panel-label">DelQuro / discovery</span></div></div></div></section>
<section class="section studio-note"><div class="wrap note-layout"><div><p class="eyebrow">05 / A small, focused studio</p><h2>Good software starts<br>with a real need.</h2></div><div><p>DelQuro Labs is an independent software studio in Virginia. We build around everyday tasks: understanding a new phrase, learning how AI works, organizing a family routine, or helping a veterinary team.</p><p>Some tools are available now. Others are public experiments or works in progress. We keep their stages clear so you know what to expect.</p><a class="text-link" href="/about.html">Meet the studio <span aria-hidden="true">→</span></a></div></div></section>
<section class="section faq-section" aria-labelledby="questions-heading"><div class="wrap faq-layout"><div><p class="eyebrow">Before you explore</p><h2 id="questions-heading">A few useful answers.</h2><a class="text-link" href="/support.html">Visit product support <span aria-hidden="true">↗</span></a></div><div class="faq-list"><details><summary>Which DelQuro apps can I use now?</summary><p>${released.map(p=>`<a href="/${p.detail}">${esc(p.name)}</a>`).join(" and ")} ${released.length===1?"is":"are"} available. Other public projects carry a preview, clinic-access, or coming-soon label. Check the product page for its current release note.</p></details><details><summary>What does “public preview” mean?</summary><p>A preview lets you explore work that is still being developed. It may use sample data, have incomplete features, or store progress only in your browser. Read the limitations on each product card before using it.</p></details><details><summary>How do veterinary teams get access?</summary><p><a href="/apps/delquro-connect.html">DelQuro Connect</a>, <a href="/apps/vetform-go.html">VetForm GO</a>, and the protected <a href="/apps/vmta.html">VMTA demo</a> have clinic-arranged access. <a href="/support.html">Contact the studio</a> about availability. Pet owners receive form links directly from their clinic.</p></details></div></div></section>
<section class="section contact-section"><div class="wrap contact-band"><div><p class="eyebrow">Let’s make the everyday better</p><h2>Have something in mind?</h2><p>A question, a little friction, or an idea worth exploring. We would like to hear it.</p></div><a class="btn primary" href="mailto:info@delquro.com">Talk to the studio <span aria-hidden="true">↗</span></a></div></section>`;
write('index.html',page('DelQuro Labs | Useful Apps for Life, Learning & Work',`Explore DelQuro Labs apps for families, learners, creators, and veterinary teams. Find available tools, public previews, and clearly labeled projects.`, '/', 'Home',home,'<link rel="stylesheet" href="/radar.css"><link rel="stylesheet" href="/glitch-logo.css"><link rel="stylesheet" href="/tech-text.css">','<script src="/radar.js" defer></script><script src="/tech-text.js" defer></script>'));
const filters = `<form class="catalog-filters" id="catalog-filters" role="search" aria-label="Find products" hidden><div class="search-field"><label for="product-search">Search products</label><input id="product-search" type="search" name="search" placeholder="Try chores, forms, or writing" autocomplete="off"></div><div><label for="category-filter">Category</label><select id="category-filter" name="category"><option value="all">All categories</option>${categories.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div><div><label for="availability-filter">Availability</label><select id="availability-filter" name="availability"><option value="all">All stages</option>${Object.entries(stages).map(([value,stage])=>`<option value="${value}">${stage.label}</option>`).join('')}</select></div><button class="btn secondary" type="reset">Reset</button></form>`;
const catalogGroups = catalogSections.map(group=>{const entries=ordered.filter(group.matches);return entries.length?`<section class="catalog-group" data-product-group id="${group.id}" aria-labelledby="${group.id}-heading"><div class="section-head"><div><h2 id="${group.id}-heading">${group.title}</h2></div><p>${group.note}</p></div><div class="app-grid catalog-grid">${entries.map(p=>card(p,true)).join('\n')}</div></section>`:'';}).join('\n');
const catalog = `<section class="catalog-intro"><div class="wrap"><p class="eyebrow">The collection</p><h1>Find your next<br><span class="gradient-text">useful app.</span></h1><p class="lead">Explore tools for your day and ideas for tomorrow. Available apps and public previews come first. Clinic access and work in progress are labeled separately.</p><div class="collection-counts"><span><b>${products.length}</b> projects</span><span><b>${released.length}</b> available</span><span><b>${previews.length}</b> public previews</span><span><b>${categories.length}</b> categories</span></div></div></section><section class="section catalog-section"><div class="wrap">${filters}<nav class="category-rail" aria-label="Browse by category"><a href="/products.html" data-category-link="all">All</a>${categories.map(c=>`<a id="${c.id}" data-category-link="${c.id}" href="#${c.id}">${esc(c.name)} <span>${products.filter(p=>p.category===c.id).length}</span></a>`).join('')}<a id="inventory" data-category-link="veterinary" href="#veterinary" class="sr-only">Inventory is now in Veterinary</a></nav><div class="results-line"><p id="result-count" role="status" aria-live="polite" aria-atomic="true">Showing all ${products.length} projects</p><span>By collection · release stage · then A–Z</span></div><noscript><p class="no-script-note">All ${products.length} projects are shown below. Search and filters are available when JavaScript is enabled.</p></noscript><div id="catalog-grid">${catalogGroups}</div><div class="empty-state" id="empty-state" hidden><span aria-hidden="true">⌕</span><h2>No projects found.</h2><p>Try another word or choose a different category.</p><button class="btn primary" type="button" id="clear-filters">Reset filters</button></div><p class="catalog-footnote">Available apps, public previews, clinic access, and coming-soon projects are separate stages. Preview limitations appear on each card. Last reviewed <time datetime="${reviewedOn}">${reviewedOn}</time>.</p></div></section>`;
write('products.html',page('Apps & Public Previews | DelQuro Labs',`Find public apps and previews, and browse ${products.length} DelQuro projects by category and release stage.`, '/products.html','Products',catalog));
function status(p) {
  return `<section class="section generated-status" aria-label="Product availability" data-product-status="${p.id}" data-availability="${p.availability}"><div class="wrap status-strip"><div><span class="availability ${p.availability}">${label(p)}</span><h2>${esc(p.name)}</h2><p>${esc(p.releaseNote)}</p></div>${actions(p,true)}</div></section>`;
}
for(const p of products) {
  if(p.id==='ai-scripts') continue; // preserve the interactive library, enhance its shared shell below
  const related=ordered.filter(other=>other.category===p.category && other.id!==p.id).slice(0,3);
  const [artA,artB]=artPalettes[p.id];
  const body=`<section class="app-hero product-detail"><div class="wrap">${renderBreadcrumbs({path:'/'+p.detail,catalog:catalogData})}<div class="detail-layout"><div>${productIcon(p,"detail-store-icon")}<p class="eyebrow">${esc(category(p.category).name)}</p><h1>${esc(p.name)}</h1><p class="lead">${esc(p.description)}</p>${actions(p,true)}</div><div class="detail-store-preview">${renderPreview(p,{href:'#screenshots',palette:[artA,artB],detail:true})}</div></div></div></section>${status(p)}${renderGallery(p)}
  <section class="section"><div class="wrap detail-content-grid"><div><p class="eyebrow">Made with a purpose</p><h2>${['in-development','coming-soon'].includes(p.availability)?'What we are exploring':'A closer look'}</h2><p>${esc(p.audience)}</p><ul class="use-case-list">${p.useCases.map(use=>`<li>${esc(use)}</li>`).join('')}</ul></div><aside class="detail-access"><p class="eyebrow">Before you begin</p><h2>${p.availability==='limited-access'?'Access through your clinic':['in-development','coming-soon'].includes(p.availability)?'Follow its progress':p.availability==='preview'?'Explore the preview':'Ready to explore'}</h2><p>${p.availability==='limited-access'?'This listing is for participating clinics. Contact the studio about availability and the appropriate access route.':['in-development','coming-soon'].includes(p.availability)?'This is a project in development. There is no public app to open yet. Contact the studio to ask about progress.':p.availability==='preview'?'This is a public preview. Review the release note above for current limitations before you get started.':'The public app is open. Check the release note above for access and progress details.'}</p><a class="text-link" href="/support.html">Get product support <span aria-hidden="true">→</span></a></aside></div></section>
  <section class="section related-section"><div class="wrap"><div class="section-head"><div><p class="eyebrow">Keep exploring</p><h2>${related.length?'More in '+esc(category(p.category).name):'Find your next useful app.'}</h2></div><a class="text-link" href="/products.html#${p.category}">Browse ${esc(category(p.category).name)} <span aria-hidden="true">→</span></a></div>${related.length?`<div class="related-links">${related.map(other=>`<a href="/${other.detail}"><span class="availability ${other.availability}">${label(other)}</span><strong>${esc(other.name)} <span aria-hidden="true">↗</span></strong><p>${esc(other.description)}</p></a>`).join('')}</div>`:'<p class="lead">Discover available apps, public previews, and projects in the full collection.</p>'}</div></section>`;
  write(p.detail,page(undefined,undefined,`/${p.detail}`,'Products',body));
}
// Normalize the shell only; keep existing legal copy, media, and AI Scripts code.
const supporting = ['about.html','resources.html','support.html','privacy.html','terms.html','account-deletion.html','Sounds/index.html','404.html','apps/ai-scripts.html','apps/ai-agent-scripts.html','apps/ai-prompt-scripts.html'];
for(const name of supporting) {
  const file=path.join(root,name); if(!fs.existsSync(file))continue;
  let html=fs.readFileSync(file,'utf8');
  const active = name.startsWith('apps/')?'Products':name==='about.html'?'About':name==='resources.html'||name.startsWith('Sounds/')?'Resources':name==='support.html'?'Support':'';
  html=html.replace(/<header\b[^>]*>[\s\S]*?<\/header>/i,nav(active)).replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/i,footer());
  html=html.replace(/<script\b[^>]*src="(?:\.\.\/)?site\.js[^"<>]*"[^>]*><\/script>/gi,'<script src="/site.js" defer></script>');
  html=html.replace(/<link\b[^>]*href="(?:\.\.\/|\/)?(?:style|refresh|redesign|app-store)\.css[^"<>]*"[^>]*>/gi,'');
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
    html=html.replace(/<section class="section screenshot-gallery"[\s\S]*?<\/section>/g,'');
    html=html.replace('</main>',`${renderGallery(p)}${status(p)}</main>`);
  }
  html=html.replace(/<\/head>/i,'<link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/refresh.css?v=20261018-screens"><link rel="stylesheet" href="/redesign.css?v=20261018-screens"><link rel="stylesheet" href="/app-store.css?v=20261018-centered"></head>');
  html=html.replace(/[ \t]+$/gm,'');
  if(!name.includes('ai-agent-scripts')&&!name.includes('ai-prompt-scripts')) html=applySeo(html,{path:name==='Sounds/index.html'?'/Sounds/':'/'+name,catalog:catalogData});
  write(name,html);
}
write('index-inline.html','<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><link rel="canonical" href="https://www.delquro.com/"><meta http-equiv="refresh" content="0;url=/"><title>DelQuro Labs</title></head><body><a href="/">Continue to DelQuro Labs</a></body></html>\n');
const urls = publicRoutes(catalogData);
write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url=>`  <url><loc>${SITE_ORIGIN}${url}</loc></url>`).join('\n')}\n</urlset>\n`);
if(check && changed.length) { console.error('Generated files are stale:',changed.join(', ')); process.exitCode=1; }
else console.log(`${check?'Verified':'Generated'} ${products.length} entries, ${released.length} available, ${previews.length} previews, ${categories.length} categories. ${changed.length} files ${check?'differ':'updated'}.`);
