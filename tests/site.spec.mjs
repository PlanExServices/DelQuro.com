import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const {products,categories}=JSON.parse(fs.readFileSync(new URL('../catalog/products.json',import.meta.url),'utf8'));
const visible=page=>page.locator('[data-product]:visible');

test('search, combined filters, empty state and reset',async({page})=>{
  await page.goto('/products.html');
  await expect(visible(page)).toHaveCount(30);
  await page.getByLabel('Category',{exact:true}).selectOption('family');
  await page.getByLabel('Availability',{exact:true}).selectOption('available');
  await expect(visible(page)).toHaveCount(3);
  await page.getByRole('searchbox').fill('PLAIN');
  await expect(visible(page)).toHaveCount(1);
  await expect(visible(page)).toContainText('PlainSlang');
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  await page.getByRole('searchbox').fill('grocery');
  await expect(visible(page)).toHaveCount(2);
  await page.getByRole('searchbox').fill('zzzz-no-match');
  await expect(page.getByRole('heading',{name:'No projects found.'})).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Showing 0 of 30 projects');
  await page.getByRole('button',{name:'Reset filters'}).click();
  await expect(visible(page)).toHaveCount(30);
  await expect(page.getByRole('searchbox')).toBeFocused();
});

test('each category and availability matches the published manifest',async({page})=>{
  await page.goto('/products.html');
  for(const c of categories){
    await page.getByLabel('Category',{exact:true}).selectOption(c.id);
    await expect(visible(page)).toHaveCount(products.filter(p=>p.category===c.id).length);
  }
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  for(const status of ['available','coming-soon','prototype','access-pending','studio']){
    await page.getByLabel('Availability',{exact:true}).selectOption(status);
    await expect(visible(page)).toHaveCount(products.filter(p=>p.availability===status).length);
  }
});

test('deep links persist and access-gated apps have no public launch action',async({page})=>{
  await page.goto('/products.html?availability=access-pending#veterinary');
  await expect(visible(page)).toHaveCount(2);
  await expect(visible(page).locator('a[href^="https:"]')).toHaveCount(0);
  await page.reload();await expect(visible(page)).toHaveCount(2);
  await page.goto('/products.html#inventory');
  await expect(visible(page)).toHaveCount(5);
  await expect(page.getByLabel('Category',{exact:true})).toHaveValue('veterinary');
});

test('the catalog and mobile navigation work without JavaScript',async({browser,baseURL})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const page=await context.newPage();await page.goto(baseURL+'/products.html');
  await expect(visible(page)).toHaveCount(30);
  await expect(page.getByRole('navigation',{name:'Primary'})).toBeVisible();
  await expect(page.locator('#catalog-filters')).toBeHidden();
  await expect(page.locator('#result-count')).toHaveText('Showing all 30 projects');
  expect(await page.locator('body').evaluate(el=>el.scrollWidth<=innerWidth)).toBe(true);
  await page.goto(baseURL+'/');
  await expect(page.getByRole('heading',{name:'See what is on the horizon.'})).toBeVisible();
  await expect(page.locator('.studio-art img')).toHaveAttribute('src','/assets/dq-lockup.png');
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
  await page.locator('[data-product]').first().tap();
  await expect(page.locator('[data-product]').first()).not.toHaveAttribute('style',/--spot-x/);
  await context.close();
});

test('reduced motion is static immediately and content stays visible',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  expect(await page.locator('.gradient-text').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  expect(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length)).toBe(0);
  await expect(page.locator('.radar-canvas')).toBeHidden();
  await expect(page.getByRole('heading',{name:'See what is on the horizon.'})).toBeVisible();
  await page.goto('/products.html');await expect(visible(page)).toHaveCount(30);
  await page.mouse.move(200,620);
  await expect(page.locator('[data-product]').first()).not.toHaveAttribute('style',/--spot-x/);
});

test('video and audio load, play and seek without missing sources',async({page})=>{
  await page.goto('/about.html');
  const video=page.locator('video');await expect(video).toHaveCount(1);
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
  for(const [oldPage,newPage] of [['ai-agent-scripts','ai-scripts'],['ai-prompt-scripts','ai-scripts'],['book-forge','ghostforge']]){
    await page.goto(`/apps/${oldPage}.html`);await expect(page).toHaveURL(new RegExp(`/apps/${newPage}\\.html$`));
    await expect(page.locator('h1')).toBeVisible();
  }
});

test('AI Scripts search, recommended filters, random, copy and fallback',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/apps/ai-scripts.html');
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
