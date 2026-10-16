import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const {products}=JSON.parse(fs.readFileSync(new URL('../catalog/products.json',import.meta.url),'utf8'));

test('home answers are keyboard accessible and work without JavaScript',async({browser,baseURL})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:812}});
  const page=await context.newPage();
  await page.goto(baseURL+'/');
  const question=page.locator('.faq-list summary').first();
  await question.focus();
  await question.press('Enter');
  const answer=page.locator('.faq-list details').first();
  await expect(answer).toHaveAttribute('open','');
  await expect(answer.getByRole('link',{name:'AI Quest',exact:true})).toHaveAttribute('href','/apps/ai-quest.html');
  await question.press('Enter');
  await expect(answer).not.toHaveAttribute('open','');
  await expect(page.locator('#available .app-card h3')).toHaveText(['AI Quest','PlainSlang']);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await context.close();
});

test('product detail pages show real audience, uses, stage, and breadcrumb navigation',async({page})=>{
  await page.setViewportSize({width:375,height:812});
  for(const id of ['ai-quest','choremouse','delquro-connect','ghostforge']){
    const product=products.find(p=>p.id===id);
    await page.goto('/'+product.detail);
    await expect(page).toHaveTitle(product.seoTitle+' | DelQuro Labs');
    await expect(page.getByRole('navigation',{name:'Breadcrumb'}).getByRole('link',{name:'Products',exact:true})).toHaveAttribute('href','/products.html');
    await expect(page.locator('.detail-content-grid')).toContainText(product.audience);
    await expect(page.locator('.use-case-list li')).toHaveText(product.useCases);
    if(!product.launch) await expect(page.locator('main a[href^="https:"]')).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
});

test('redesigned routes fit mobile and tablet and retain forced-color content',async({page})=>{
  // Existing analytics is unrelated to layout; do not send synthetic visits or
  // let that third-party script delay this deterministic local/CI check.
  await page.route('https://static.cloudflareinsights.com/**',route=>route.abort());
  for(const width of [375,768,820]){
    await page.setViewportSize({width,height:900});
    for(const route of ['/','/products.html','/about.html','/support.html']){
      await page.goto(route);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await expect(page.locator('h1')).toBeVisible();
    }
  }
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
  await page.goto('/');
  await expect(page.getByRole('link',{name:'Explore available apps',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Different days. Different possibilities.'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Browse all products',exact:true}).first()).toBeVisible();
});
