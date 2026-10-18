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
    if(p.preview.kind==='concept'){
      await expect(preview).toContainText('Concept preview');
      await expect(preview.locator('img')).toHaveCount(0);
    }else{
      await expect.poll(()=>preview.locator('img').evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
      expect(await preview.locator('img').evaluate(el=>getComputedStyle(el).objectFit)).toBe('contain');
    }
  }
  await expect(page.locator('#megatory-live .store-preview-kind')).toHaveText('Access screen');
  await expect(page.locator('#solar .store-preview-kind')).toHaveText('Offline build preview');
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
  await expect(page).toHaveURL(/choremouse-1-20261018\.webp$/);
  await page.goto(baseURL+'/apps/vmta.html');
  await expect(page.locator('.preview-disclosure')).toContainText('Concept illustration');
  await expect(page.locator('main a[href^="https:"]')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await context.close();
});
