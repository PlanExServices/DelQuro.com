import assert from 'node:assert/strict';

export const stages = {
  available: { label: 'Available', action: 'Open app', order: 0 },
  preview: { label: 'Public preview', action: 'Try preview', order: 1 },
  'limited-access': { label: 'Clinic access', action: 'Ask about access', order: 2 },
  'coming-soon': { label: 'Coming soon', action: 'Ask about launch', order: 3 },
  'in-development': { label: 'In development', action: 'Ask about progress', order: 3 },
};

// Shared visible grouping keeps catalog markup and its structured list aligned.
export const catalogSections = [
  {id:'public-apps',title:'Apps & public previews',note:'Open an available app or explore a clearly labeled preview.',matches:p=>p.category!=='veterinary'&&['available','preview'].includes(p.availability)},
  {id:'clinic-access',title:'Veterinary suite',note:'Tools for veterinary teams. Public previews and clinic-arranged access are labeled on each card.',matches:p=>p.category==='veterinary'},
  {id:'coming-soon',title:'Coming soon & in progress',note:'A look ahead. These projects do not have a public app to open yet.',matches:p=>p.category!=='veterinary'&&['coming-soon','in-development'].includes(p.availability)},
];
export const orderProducts = products => [...products].sort((a,b)=>stages[a.availability].order-stages[b.availability].order||a.name.localeCompare(b.name,'en'));
export const catalogOrder = products => catalogSections.flatMap(section=>orderProducts(products).filter(section.matches));

// Public pages moved out of the product grid retain useful destinations.
export const movedPages = {
  'apps/vet-survey.html': '/resources.html#veterinary-workflow-survey',
  'apps/delquro-labs.html': '/about.html',
};

// This public repository contains only the reviewed public listing. Keep the
// private inventory and unresolved audience decisions outside this repository.
export function validateCatalog({products, categories, reviewedOn}) {
  assert.match(reviewedOn || '', /^\d{4}-\d{2}-\d{2}$/);
  assert(products.length > 0, 'The public catalog must not be empty');
  assert.equal(new Set(products.map(p => p.id)).size, products.length, 'Unique product IDs');
  assert.equal(new Set(products.map(p => p.detail)).size, products.length, 'Unique detail paths');
  for (const p of products) {
    assert.equal(p.visibility, 'public', `Explicit public visibility required: ${p.id}`);
    assert(stages[p.availability], `Unsupported release stage: ${p.id}`);
    assert(p.description && p.releaseNote, `Description and release context required: ${p.id}`);
    assert(typeof p.seoTitle === 'string' && p.seoTitle.trim().length > 0 && p.seoTitle.length <= 90, `SEO title must contain 1–90 characters: ${p.id}`);
    assert(typeof p.audience === 'string' && p.audience.trim().length > 0, `Audience required: ${p.id}`);
    assert(Array.isArray(p.useCases) && p.useCases.length >= 2 && p.useCases.length <= 3, `Two or three use cases required: ${p.id}`);
    assert(p.useCases.every(item => typeof item === 'string' && item.trim().length > 0), `Use cases must be non-empty text: ${p.id}`);
    assert.match(p.reviewedOn || '', /^\d{4}-\d{2}-\d{2}$/);
    const preview=p.preview;
    assert(preview&&['screenshot','demo','access','development','concept'].includes(preview.kind), `Explicit preview type required: ${p.id}`);
    assert(preview.headline&&preview.note, `Preview headline and disclosure required: ${p.id}`);
    assert(!preview.device||['phone','both'].includes(preview.device), `Supported preview device required: ${p.id}`);
    if(preview.device==='both') {
      assert(preview.screens?.some(s=>s.device==='phone')&&preview.screens.some(s=>s.device==='desktop'), `Both-device previews require real phone and desktop captures: ${p.id}`);
      assert(preview.screens.every(s=>['phone','desktop'].includes(s.device)), `Each mixed-gallery screen needs a device: ${p.id}`);
    }
    if(preview.kind==='concept') assert(!preview.screens?.length, `Concepts cannot claim screenshots: ${p.id}`);
    else {
      assert.match(preview.capturedOn||'', /^\d{4}-\d{2}-\d{2}$/);
      assert(preview.screens?.length>0&&preview.screens.length<=4, `One to four real screenshots required: ${p.id}`);
      for(const screen of preview.screens){
        if(preview.device==='phone'||screen.device==='phone') assert(screen.width<screen.height, `Phone previews require portrait captures: ${p.id}`);
        if(screen.device==='desktop') assert(screen.width>screen.height, `Desktop previews require landscape captures: ${p.id}`);
        assert.match(screen.src, /^\/assets\/app-previews\/[a-z0-9-]+\.webp$/);
        assert.match(screen.thumbnail, /^\/assets\/app-previews\/[a-z0-9-]+\.webp$/);
        assert(Number.isInteger(screen.width)&&screen.width>0&&Number.isInteger(screen.height)&&screen.height>0&&screen.caption, `Screenshot dimensions and caption required: ${p.id}`);
      }
    }
    assert.match(p.id, /^[a-z0-9-]+$/);
    assert.match(p.detail, /^apps\/[a-z0-9-]+\.html$/);
    assert(categories.some(c => c.id === p.category), `Category required: ${p.id}`);
    if (p.launch) {
      assert(['available', 'preview'].includes(p.availability), `Restricted/development projects cannot launch: ${p.id}`);
      assert.equal(new URL(p.launch).protocol, 'https:');
      assert(p.linkCheck?.titleIncludes?.length > 2, `Destination identity required: ${p.id}`);
    }
    if (p.availability === 'available') assert(p.launch, `Available release needs a verified destination: ${p.id}`);
    if (p.highlight) assert(p.launch, `Homepage highlights need a public destination: ${p.id}`);
  }
  for (const c of categories) assert(products.some(p => p.category === c.id), `Empty category: ${c.id}`);
}
