import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {stages,movedPages} from '../scripts/catalog-model.mjs';
const {products,categories}=JSON.parse(fs.readFileSync(new URL('../catalog/products.json',import.meta.url),'utf8'));
const visible=page=>page.locator('[data-product]:visible');
const product=id=>products.find(p=>p.id===id);
const count=(field,value)=>products.filter(p=>p[field]===value).length;

test('search, combined filters, empty state and reset',async({page})=>{
  await page.goto('/products.html');
  await expect(visible(page)).toHaveCount(products.length);
  await page.getByLabel('Category',{exact:true}).selectOption('family');
  await page.getByLabel('Availability',{exact:true}).selectOption('available');
  await expect(visible(page)).toHaveCount(products.filter(p=>p.category==='family'&&p.availability==='available').length);
  await page.getByRole('searchbox').fill('PLAIN');
  await expect(visible(page)).toHaveCount(1);
  await expect(visible(page)).toContainText('PlainSlang');
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  await page.getByRole('searchbox').fill('grocery');
  await expect(visible(page)).toHaveCount(products.filter(p=>(p.name+' '+p.description).toLowerCase().includes('grocery')).length);
  await page.getByRole('searchbox').fill('zzzz-no-match');
  await expect(page.getByRole('heading',{name:'No projects found.'})).toBeVisible();
  await expect(page.getByRole('status')).toHaveText(`Showing 0 of ${products.length} projects`);
  await page.getByRole('button',{name:'Reset filters'}).click();
  await expect(visible(page)).toHaveCount(products.length);
  await expect(page.getByRole('searchbox')).toBeFocused();
});

test('each category and availability matches the published manifest',async({page})=>{
  await page.goto('/products.html');
  for(const c of categories){
    await page.getByLabel('Category',{exact:true}).selectOption(c.id);
    await expect(visible(page)).toHaveCount(products.filter(p=>p.category===c.id).length);
  }
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  for(const status of Object.keys(stages)){
    await page.getByLabel('Availability',{exact:true}).selectOption(status);
    await expect(visible(page)).toHaveCount(count('availability',status));
  }
});

test('deep links persist and access-gated apps have no public launch action',async({page})=>{
  await page.goto('/products.html?availability=limited-access#veterinary');
  await expect(visible(page)).toHaveCount(count('availability','limited-access'));
  await expect(visible(page).locator('.card-actions a[href^="https:"]')).toHaveCount(0);
  await page.reload();await expect(visible(page)).toHaveCount(count('availability','limited-access'));
  await page.goto('/products.html#inventory');
  await expect(visible(page)).toHaveCount(count('category','veterinary'));
  await expect(page.getByLabel('Category',{exact:true})).toHaveValue('veterinary');
});

test('release labels, notes, and actions match the public catalog',async({page})=>{
  await page.goto('/products.html');
  for(const p of products){
    const card=page.locator(`[data-product]#${p.id}`);
    await expect(card).toHaveAttribute('data-availability',p.availability);
    await expect(card.locator('.availability')).toHaveText(stages[p.availability].label);
    await expect(card.locator('.card-release-note')).toHaveText(p.releaseNote);
    const action=card.locator('.card-actions .btn');
    if(p.launch){
      await expect(action).toHaveAttribute('href',p.launch);
      await expect(action).toContainText(stages[p.availability].action);
      await expect(action).toHaveAttribute('target','_blank');
    }else{
      await expect(action).toHaveAttribute('href',`/${p.detail}`);
      await expect(card.locator('.card-actions a[href^="https:"]')).toHaveCount(0);
    }
  }

  await expect(page.locator('#choremouse .card-actions .btn')).toHaveAttribute('href','https://choremouse.app/');
  await expect(page.locator('#what-list .card-release-note')).toContainText('recipe imports use sample content');
  await expect(page.locator('#what-list .card-release-note')).toContainText('not saved between sessions');
  await expect(page.locator('#megatory-live .card-release-note')).toContainText('still in progress');
  await expect(page.locator('#vmta')).toHaveCount(0);
});

test('clinic-only products have contact actions and no public app links',async({page})=>{
  for(const id of ['delquro-connect','vetform-go']){
    const p=product(id);
    expect(p.availability).toBe('limited-access');
    expect(p.launch).toBeUndefined();
    await page.goto(`/${p.detail}`);
    const status=page.locator(`[data-product-status="${id}"]`);
    await expect(status).toHaveAttribute('data-availability','limited-access');
    await expect(status.locator('.availability')).toHaveText('Clinic access');
    await expect(status.locator('p')).toHaveText(p.releaseNote);
    await expect(status.getByRole('link',{name:/Ask about clinic access/})).toHaveAttribute('href',new RegExp('^mailto:info@delquro\\.com\\?subject='));
    await expect(page.locator('.product-detail .card-actions a[href^="https:"]')).toHaveCount(0);
    await expect(status.locator('.card-actions a[href^="https:"]')).toHaveCount(0);
  }
});

test('public previews identify their destination and limits on detail pages',async({page})=>{
  for(const id of ['choremouse','what-list','megatory-live']){
    const p=product(id);
    expect(p.availability).toBe('preview');
    await page.goto(`/${p.detail}`);
    const status=page.locator(`[data-product-status="${id}"]`);
    await expect(status.locator('.availability')).toHaveText('Public preview');
    await expect(status.locator('p')).toHaveText(p.releaseNote);
    await expect(status.getByRole('link',{name:/Try preview/})).toHaveAttribute('href',p.launch);
  }
});

test('private PlotPerks and its empty category are not published',async({page})=>{
  expect(product('plotperks')).toBeUndefined();
  expect(categories.some(c=>c.id==='garden')).toBe(false);
  await page.goto('/products.html');
  await expect(page.locator('#plotperks,[data-category="garden"]')).toHaveCount(0);
  await expect(page.getByLabel('Category',{exact:true}).locator('option[value="garden"]')).toHaveCount(0);
  await expect(page.getByRole('link',{name:/PlotPerks/i})).toHaveCount(0);
  await page.goto('/');
  await expect(page.locator('.app-card').filter({hasText:/PlotPerks/i})).toHaveCount(0);
  await expect(page.locator('a[href="/products.html#garden"]')).toHaveCount(0);
  const route=await page.goto('/apps/plot-perks.html');
  expect(route.status()).toBe(404);
  expect(fs.existsSync(new URL('../apps/plot-perks.html',import.meta.url))).toBe(false);
});

test('the catalog and mobile navigation work without JavaScript',async({browser,baseURL})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const page=await context.newPage();await page.goto(baseURL+'/products.html');
  await expect(visible(page)).toHaveCount(products.length);
  await expect(page.getByRole('navigation',{name:'Primary'})).toBeVisible();
  await expect(page.locator('#catalog-filters')).toBeHidden();
  await expect(page.locator('#result-count')).toHaveText(`Showing all ${products.length} projects`);
  expect(await page.locator('body').evaluate(el=>el.scrollWidth<=innerWidth)).toBe(true);
  await page.goto(baseURL+'/');
  await expect(page.getByRole('heading',{name:'See what is on the horizon.'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Useful starts here.'})).toBeVisible();
  await expect(page.locator('[data-tech-text]')).not.toHaveClass(/tech-text-ready/);
  await expect(page.locator('.studio-art img')).toHaveAttribute('src','/assets/dq-lockup.png');
  const mockups=page.getByRole('region',{name:'Client website mockups'});
  await mockups.scrollIntoViewIfNeeded();
  await expect(mockups.getByRole('heading',{name:'Midlothian Family Chiropractic Center'})).toBeVisible();
  await expect(mockups.getByText('Design preview',{exact:true})).toBeVisible();
  await expect(mockups.getByRole('link',{name:/Open live preview/})).toHaveAttribute('href','https://mfcc.delqurolabs.dev/');
  await expect(mockups.locator('.mockup-window img')).toHaveJSProperty('naturalWidth',1280);
  await expect(mockups.locator('.mockup-window')).toHaveAttribute('href','https://mfcc.delqurolabs.dev/');
  await expect(mockups.getByRole('link',{name:/Open MFCC meet the doctors/})).toHaveAttribute('href','https://mfcc.delqurolabs.dev/about-us/');
  await expect(mockups.getByRole('link',{name:/Open MFCC patient resources/})).toHaveAttribute('href','https://mfcc.delqurolabs.dev/patients/');
  await expect(mockups.getByRole('link',{name:/Download preview PNGs/})).toHaveAttribute('download','');
  expect(await page.locator('body').evaluate(el=>el.scrollWidth<=innerWidth)).toBe(true);
  await context.close();
});

test('Radar renders as an optional enhancement while the original logo stays visible',async({page})=>{
  await page.goto('/');
  await expect(page.locator('.studio-art img')).toHaveAttribute('src','/assets/dq-lockup.png');
  const radar=page.locator('[data-radar]');
  await radar.scrollIntoViewIfNeeded();
  await expect(radar).toHaveAttribute('data-radar-state',/^active-(webgl|2d)$/);
  expect(await radar.locator('canvas').evaluate(canvas=>canvas.width)).toBeGreaterThan(300);
  await expect(page.getByRole('link',{name:'Browse the full collection'})).toHaveAttribute('href','/products.html');
  expect(await page.locator('body').evaluate(el=>el.scrollWidth<=innerWidth)).toBe(true);
});

test('original hero logo glitches on hover and keyboard focus only when motion is allowed',async({page})=>{
  await page.goto('/');
  const logo=page.locator('.hero-logo-glitch');
  await expect(logo.locator('img')).toHaveAttribute('src','/assets/dq-lockup.png');
  const before=()=>logo.evaluate(el=>({opacity:getComputedStyle(el,'::before').opacity,animation:getComputedStyle(el,'::before').animationName}));
  expect(await before()).toEqual({opacity:'0',animation:'none'});
  await logo.hover();
  await expect.poll(async()=>(await before()).animation).toBe('logo-glitch');
  await expect.poll(async()=>(await before()).opacity).toBe('0.8');
  await page.mouse.move(0,0);
  for(let i=0;i<12 && !(await logo.evaluate(el=>document.activeElement===el));i++) await page.keyboard.press('Tab');
  await expect(logo).toBeFocused();
  await expect.poll(async()=>(await before()).animation).toBe('logo-glitch');
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await before()).toEqual({opacity:'0',animation:'none'});
  await expect(logo.locator('img')).toBeVisible();
});

test('TechText animates the real heading and supports pointer and keyboard input',async({page})=>{
  await page.goto('/');
  const heading=page.getByRole('heading',{name:'Useful starts here.'});
  await expect(heading).toHaveText('Useful starts here.');
  await expect(heading).toHaveClass(/tech-text-ready/);
  expect(await heading.evaluate(el=>getComputedStyle(el).color)).toBe('rgb(237, 244, 242)');
  expect(await heading.locator('canvas').evaluate(el=>el.width)).toBeGreaterThan(200);
  await heading.scrollIntoViewIfNeeded();
  await expect.poll(()=>heading.getAttribute('data-tech-text-state')).toBe('idle');
  await heading.hover();
  await expect(heading).toHaveAttribute('data-tech-text-state','active');
  await expect(heading).toHaveAttribute('data-tech-text-letter',/\S/);
  await page.screenshot({path:'test-results/tech-text-readable.png'});
  await heading.press('End');
  await expect(heading).toHaveAttribute('data-tech-text-letter','.');
  await heading.press('ArrowLeft');
  await expect(heading).toHaveAttribute('data-tech-text-letter','e');
  await heading.press('Escape');
  await expect(heading).toHaveAttribute('data-tech-text-state','idle');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(heading).not.toHaveClass(/tech-text-ready/);
  await expect(heading).toBeVisible();
  await expect(heading).toHaveAttribute('data-tech-text-state','reduced');
});

test('mobile keyboard navigation exposes links, Escape closes and restores focus',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');
  await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Skip to content'})).toBeFocused();
  const menu=page.locator('button.menu');
  await menu.press('Enter');
  await expect(page.getByRole('navigation',{name:'Primary'})).toBeVisible();
  await menu.press('Tab');await expect(page.getByRole('link',{name:'Home',exact:true})).toBeFocused();
  await page.keyboard.press('Escape');await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute('aria-expanded','false');
  await expect(page.getByRole('link',{name:'Privacy',exact:true})).toBeVisible();
});

test('touch layouts do not overflow and pointer effects stay off',async({browser,baseURL})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();await page.goto(baseURL+'/products.html');
  await page.getByRole('button',{name:'Open navigation'}).tap();
  await expect(page.getByRole('navigation',{name:'Primary'})).toBeVisible();
  expect(await page.locator('body').evaluate(el=>el.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Close navigation'}).tap();
  await page.locator('[data-product] .card-top').first().tap();
  await expect(page.locator('[data-product]').first()).not.toHaveAttribute('style',/--spot-x/);
  expect(await page.locator('[data-product] .card-demo .art-focal').first().evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  await page.goto(baseURL+'/');
  await page.locator('.app-card').first().scrollIntoViewIfNeeded();
  await page.screenshot({path:'test-results/mini-cards-mobile.png'});
  const categoryTile=page.locator('.category-tile').first();
  await categoryTile.scrollIntoViewIfNeeded();
  const [emblem,title]=await Promise.all([categoryTile.locator('.category-emblem').evaluate(el=>el.getBoundingClientRect().toJSON()),categoryTile.locator('h3').evaluate(el=>el.getBoundingClientRect().toJSON())]);
  expect(emblem.bottom).toBeLessThanOrEqual(title.top);
  expect(await categoryTile.locator('.category-emblem svg').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  await page.screenshot({path:'test-results/category-motion-mobile.png'});
  await page.locator('.hero-logo-glitch').tap();
  expect(await page.locator('.hero-logo-glitch').evaluate(el=>getComputedStyle(el,'::before').opacity)).toBe('0');
  await page.locator('[data-tech-text]').tap();
  await expect(page.locator('[data-tech-text]')).toHaveAttribute('data-tech-text-state','active');
  expect(await page.locator('body').evaluate(el=>el.scrollWidth<=innerWidth)).toBe(true);
  await context.close();
});

test('product previews stay clear and animate for pointer and keyboard focus',async({page})=>{
  await page.goto('/');
  const card=page.locator('.app-card').first();
  const highlighted=['choremouse','plainslang','megatory-live','delquro-zen','cats-journey','ai-quest'];
  expect(products.filter(p=>p.highlight).map(p=>p.id)).toEqual(highlighted);
  await expect(page.locator('.app-card')).toHaveCount(highlighted.length);
  await expect(page.locator('.app-card .product-symbol svg use')).toHaveCount(highlighted.length);
  for(const id of highlighted){
    const p=product(id);
    const homeCard=page.locator('.releases .app-card').filter({has:page.getByRole('heading',{name:p.name,exact:true})});
    await expect(homeCard).toHaveCount(1);
    await expect(homeCard.locator('.availability')).toHaveText(stages[p.availability].label);
    await expect(homeCard.locator('.card-actions .btn')).toHaveAttribute('href',p.launch);
    const art=homeCard.locator('.card-demo[data-preview="specific"]');
    await expect(art).toHaveAttribute('data-demo',id);
    await expect(art).toHaveAttribute('href',`/${p.detail}`);
    await expect(art).toHaveAttribute('aria-label',`View ${p.name} details`);
    await expect(art.locator('svg.card-art')).toHaveAttribute('aria-hidden','true');
    await expect(art.locator('use.art-focal')).toHaveAttribute('href',`/assets/product-scenes.svg#${id}`);
  }
  // The redesign prioritizes available apps before any public preview.
  await expect(page.locator('#available .app-card .availability')).toHaveText(['Available','Available']);
  await expect(page.locator('#available .app-card h3')).toHaveText(['AI Quest','PlainSlang']);
  await expect(page.locator('#previews .app-card .availability')).toHaveText(Array(4).fill('Public preview'));
  await expect(card.locator('.product-symbol use')).toHaveAttribute('href','/assets/product-icons.svg#ai-quest');
  await expect(card).toHaveAttribute('data-motion',product('ai-quest').motion);
  expect(await card.evaluate(el=>getComputedStyle(el,'::before').backgroundImage)).toContain('radial-gradient');
  await card.hover();
  await expect.poll(()=>card.evaluate(el=>el.style.getPropertyValue('--spot-x'))).not.toBe('');
  await expect.poll(()=>card.evaluate(el=>el.style.getPropertyValue('--tilt-y'))).not.toBe('');
  await expect.poll(()=>card.evaluate(el=>getComputedStyle(el,'::before').opacity)).toBe('1');
  const art=card.locator('.card-demo');
  await art.hover();
  await expect.poll(()=>art.locator('.art-focal').evaluate(el=>getComputedStyle(el).animationName)).not.toBe('none');
  const [preview,copy]=await Promise.all([card.locator('.card-demo').evaluate(el=>el.getBoundingClientRect().toJSON()),card.locator('.card-description').evaluate(el=>el.getBoundingClientRect().toJSON())]);
  expect(preview.bottom).toBeLessThan(copy.top);
  expect(preview.height).toBeGreaterThan(120);
  await page.screenshot({path:'test-results/mini-cards-desktop.png'});
  await art.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(art).toBeFocused();
  await page.mouse.move(0,0);
  await expect.poll(()=>card.evaluate(el=>getComputedStyle(el,'::before').opacity)).toBe('1');
  await expect.poll(()=>art.locator('.art-focal').evaluate(el=>getComputedStyle(el).animationName)).not.toBe('none');
  const tile=page.locator('.category-tile').first();
  await expect(tile).toHaveAttribute('data-motion','sequence');
  await tile.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(tile).toBeFocused();
  await expect.poll(()=>tile.evaluate(el=>getComputedStyle(el,'::before').opacity)).toBe('1');
  expect(await tile.locator('.category-emblem svg').evaluate(el=>getComputedStyle(el).animationName)).toBe('scene-step');
  expect(await tile.locator('.category-emblem').evaluate(el=>el.getBoundingClientRect().right)).toBeLessThanOrEqual(await tile.evaluate(el=>el.getBoundingClientRect().right));
  await page.screenshot({path:'test-results/category-motion-desktop.png'});
  await page.goto('/products.html');
  await expect(page.locator('.app-card .product-symbol svg use')).toHaveCount(products.filter(p=>p.icon!=='delquro-labs').length);
  await expect(page.locator('.app-card .product-symbol img[src="/assets/dq-mark.png"]')).toHaveCount(products.filter(p=>p.icon==='delquro-labs').length);
  await expect(page.locator('.app-card[data-motion]')).toHaveCount(products.length);
  await expect(page.locator('.app-card .card-demo')).toHaveCount(products.length);
  await expect(page.locator('.app-card .card-demo[data-preview="specific"]')).toHaveCount(products.length);
  for(const p of products){
    const art=page.locator(`#${p.id} .card-demo`);
    await expect(art).toHaveAttribute('data-demo',p.id);
    await expect(art).toHaveAttribute('href',`/${p.detail}`);
    await expect(art).toHaveAttribute('aria-label',`View ${p.name} details`);
    await expect(art.locator('svg.card-art')).toHaveAttribute('aria-hidden','true');
    await expect(art.locator('use.art-focal')).toHaveAttribute('href',`/assets/product-scenes.svg#${p.id}`);
  }
});

test('reduced motion is static immediately and content stays visible',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  expect(await page.locator('.gradient-text').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  expect(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length)).toBe(0);
  await expect(page.locator('.radar-canvas')).toBeHidden();
  await expect(page.locator('[data-tech-text]')).not.toHaveClass(/tech-text-ready/);
  await expect(page.getByRole('heading',{name:'Useful starts here.'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'See what is on the horizon.'})).toBeVisible();
  await page.goto('/products.html');await expect(visible(page)).toHaveCount(products.length);
  await page.mouse.move(200,620);
  await expect(page.locator('[data-product]').first()).not.toHaveAttribute('style',/--spot-x/);
  expect(await page.locator('[data-product] .card-demo .art-focal').first().evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});

test('video and audio load, play and seek without missing sources',async({page})=>{
  await page.goto('/about.html');
  const video=page.locator('video');await expect(video).toHaveCount(1);
  await expect(video).toHaveAttribute('poster','assets/william-intro-poster.jpg?v=20261015');
  const poster=await video.evaluate(async el=>{
    const image=new Image();image.src=el.poster;await image.decode();
    return {width:image.naturalWidth,height:image.naturalHeight};
  });
  expect(poster).toEqual({width:720,height:1280});
  expect(fs.existsSync(new URL('../assets/william-delquro-front.jpg',import.meta.url))).toBe(false);
  expect(fs.existsSync(new URL('../assets/william-delquro-front.webp',import.meta.url))).toBe(false);
  await video.evaluate(async el=>{el.muted=true;await el.play()});
  await expect.poll(()=>video.evaluate(el=>el.currentTime)).toBeGreaterThan(0);
  expect(await video.evaluate(el=>el.error)).toBeNull();
  await video.evaluate(el=>{el.currentTime=2});
  await expect.poll(()=>video.evaluate(el=>!el.seeking&&el.currentTime>=2)).toBe(true);
  await video.evaluate(el=>el.pause());
  await page.goto('/Sounds/');
  await page.locator('.sound-list a').first().click();
  const audio=page.locator('audio');
  await expect.poll(()=>audio.evaluate(el=>el.currentTime)).toBeGreaterThan(0);
  expect(await audio.evaluate(el=>el.error)).toBeNull();
  await audio.evaluate(el=>{el.currentTime=1});
  await expect.poll(()=>audio.evaluate(el=>!el.seeking&&el.currentTime>=1)).toBe(true);
  await audio.evaluate(el=>el.pause());
});

test('legacy aliases still reach their current product pages',async({page})=>{
  for(const [oldPage,newPage] of [['ai-agent-scripts','ai-scripts'],['ai-prompt-scripts','ai-scripts']]){
    await page.goto(`/apps/${oldPage}.html`);await expect(page).toHaveURL(new RegExp(`/apps/${newPage}\\.html$`));
    await expect(page.locator('h1')).toBeVisible();
  }
  for(const [oldPage,target] of Object.entries(movedPages)){
    await page.goto('/'+oldPage);
    await expect(page).toHaveURL(new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$'));
    await expect(page.locator('h1')).toBeVisible();
  }
});

test('AI Scripts search, recommended filters, random, copy and fallback',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/apps/ai-scripts.html');
  await expect(page.locator('[data-product-status="ai-scripts"] .availability')).toHaveText('Public preview');
  await expect(page.getByRole('link',{name:'Browse templates'})).toHaveAttribute('href','#script-grid');
  const templates=page.locator('[data-script]:visible');
  await expect(templates).toHaveCount(8);
  await page.getByLabel('Template type').selectOption('agent');
  await expect(templates).toHaveCount(4);
  await page.getByLabel('Recommended starters').check();
  await expect(templates).toHaveCount(2);
  await page.getByRole('button',{name:'Random starter'}).click();
  await expect(templates.locator('details[open]')).toHaveCount(1);
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  await page.getByLabel('Template type').selectOption('prompt');
  await page.getByRole('searchbox',{name:'Search templates'}).fill('message');
  await expect(templates).toHaveCount(1);
  await templates.getByRole('button',{name:/Copy template/}).click();
  await expect(templates.locator('[data-copy-status]')).toContainText('Template copied');
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toContain('Help me make this message');
  await page.getByRole('searchbox',{name:'Search templates'}).fill('zzzz-no-match');
  await expect(templates).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Random starter'})).toBeDisabled();
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  await expect(templates).toHaveCount(8);
  // Simulate a browser that blocks clipboard access; selectable text remains usable.
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('Blocked')}}}));
  await templates.first().getByRole('button',{name:/Copy template/}).click();
  await expect(templates.first().locator('[data-copy-status]')).toContainText('text is selected');
  expect(await page.evaluate(()=>getSelection().toString())).toContain('Help me plan a focused week.');
});
