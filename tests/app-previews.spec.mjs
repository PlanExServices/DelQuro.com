import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const {products}=JSON.parse(fs.readFileSync(new URL('../catalog/products.json',import.meta.url),'utf8'));

test('every card has an honest preview and every captured screen loads',async({page})=>{
  await page.goto('/products.html');
  for(const p of products){
    const preview=page.locator(`#${p.id} .store-preview`);
    await preview.scrollIntoViewIfNeeded();
    await expect(preview).toHaveAttribute('data-preview-kind',p.preview.kind);
    await expect(preview.locator('.store-preview-headline')).toHaveText(p.preview.headline);
    expect(['screenshot','demo','development']).toContain(p.preview.kind);
    await expect(preview.locator('img')).toHaveCount(p.preview.device==='both'?2:1);
    await expect(preview.locator('svg.card-art')).toHaveCount(0);
    await expect(preview.locator('.store-monitor')).toHaveCount(p.preview.device==='phone'?0:1);
    await expect(preview.locator('.store-browser')).toHaveCount(0);
    if(p.preview.device!=='phone') await expect(preview.locator('.store-monitor-base')).toBeVisible();
    for(const img of await preview.locator('img').all()){
      await expect.poll(()=>img.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
      expect(await img.evaluate(el=>getComputedStyle(el).objectFit)).toBe('contain');
    }
  }
  await expect(page.locator('#megatory-live .store-preview-kind')).toHaveText('Offline build preview');
  await expect(page.locator('#solar .store-preview-kind')).toHaveText('App screenshot');
});

test('screenshots enlarge without JavaScript and galleries remain keyboard scrollable',async({browser,baseURL})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:812}});
  const page=await context.newPage();
  await page.goto(baseURL+'/apps/choremouse.html');
  const gallery=page.getByRole('region',{name:'ChoreMouse screenshots'});
  await gallery.scrollIntoViewIfNeeded();
  await expect.poll(()=>gallery.locator('img').first().evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
  expect(await page.evaluate(()=>innerWidth)).toBe(375);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/app-store-mobile-detail.png',fullPage:true});
  await expect(gallery.locator('figure')).toHaveCount(2);
  await expect(page.locator('.preview-disclosure')).toContainText('public demo with sample family data');
  await gallery.focus();await page.keyboard.press('ArrowRight');
  await expect.poll(()=>gallery.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
  const link=gallery.getByRole('link').first();
  await link.click();
  await expect(page).toHaveURL(/choremouse-mobile-1-20261018\.webp$/);
  await page.goto(baseURL+'/apps/vmta.html');
  await expect(page.locator('.preview-disclosure')).toContainText('synthetic');
  await expect(page.locator('main a[href^="https:"]')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await context.close();
});

for(const id of ['choremouse','solar','megatory-live','delquro-connect','plainslang']){
 test(id+' uses uncropped mobile screenshots and phone frames throughout',async({page,browser,baseURL})=>{
  for(const route of ['/','/products.html','/apps/'+id+'.html']){
   await page.goto(route);
   const preview=page.locator('[data-demo="'+id+'"]').first();
   await preview.scrollIntoViewIfNeeded();
   await expect(preview).toHaveAttribute('data-preview-device','phone');
   await expect(preview.locator('.store-browser')).toHaveCount(0);
   const screen=preview.locator('.store-phone img');
   await expect.poll(()=>screen.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
   const dimensions=await screen.evaluate(el=>({w:el.naturalWidth,h:el.naturalHeight,ratio:el.clientWidth/el.clientHeight,fit:getComputedStyle(el).objectFit}));
   expect(dimensions.w).toBeLessThan(dimensions.h);
   expect(dimensions.ratio).toBeCloseTo(390/844,2);expect(dimensions.fit).toBe('contain');
  }
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:812},reducedMotion:'reduce'});
  const mobile=await context.newPage();
  for(const route of ['/products.html','/apps/'+id+'.html']){
   await mobile.goto(baseURL+route);
   expect(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   const frame=mobile.locator('[data-demo="'+id+'"] .store-phone').first();await frame.scrollIntoViewIfNeeded();
   expect(await frame.evaluate(el=>getComputedStyle(el).transform)).toBe('none');
  }
  const gallery=mobile.locator('.screenshot-track');await gallery.scrollIntoViewIfNeeded();
  await expect(gallery.locator('.store-phone')).toHaveCount(2);
  await expect(gallery.locator('.store-browser')).toHaveCount(0);
  await gallery.focus();await mobile.keyboard.press('ArrowRight');await expect.poll(()=>gallery.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
  await mobile.screenshot({path:'test-results/'+id+'-phone-preview.png',fullPage:true});
  await context.close();
 });
}

for(const id of ['ai-quest','vetform-go','delquro-zen','cats-journey']){
 test(id+' shows real desktop and phone previews without JavaScript',async({browser,baseURL})=>{
  const c=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:812},reducedMotion:'reduce'});const p=await c.newPage();
  for(const route of ['/','/products.html','/apps/'+id+'.html']){
   await p.goto(baseURL+route);const preview=p.locator('[data-demo="'+id+'"]').first();await preview.scrollIntoViewIfNeeded();
   await expect(preview).toHaveAttribute('data-preview-device','both');await expect(preview).toContainText('Phone + desktop');
   await expect(preview.locator('img')).toHaveCount(2);await expect(preview.locator('.store-browser')).toHaveCount(0);await expect(preview.locator('.store-monitor')).toHaveCount(1);await expect(preview.locator('.store-phone')).toHaveCount(1);
   for(const image of await preview.locator('img').all()){
    await expect.poll(()=>image.evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
    const d=await image.evaluate(e=>({ratio:e.clientWidth/e.clientHeight,natural:e.naturalWidth/e.naturalHeight}));expect(d.ratio).toBeCloseTo(d.natural,1);
   }
   expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  const gallery=p.locator('.screenshot-track');await gallery.scrollIntoViewIfNeeded();await expect(gallery.locator('figure')).toHaveCount(4);await expect(gallery.locator('.store-phone')).toHaveCount(2);
  await gallery.focus();await p.keyboard.press('ArrowRight');await expect.poll(()=>gallery.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);
  const href=await gallery.locator('a').last().getAttribute('href');await gallery.locator('a').last().click();await expect(p).toHaveURL(baseURL+href);
  if(id==='vetform-go'){await p.goto(baseURL+'/apps/vetform-go.html');await expect(p.locator('main a[href^="https:"]')).toHaveCount(0);}
  await c.close();
 });
}
