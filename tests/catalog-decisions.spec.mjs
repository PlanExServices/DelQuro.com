import {test,expect} from '@playwright/test';

test('owner release decisions, clinic separation and removed routes remain consistent',async({page})=>{
  await page.goto('/products.html');
  await expect(page.locator('#public-apps #choremouse .availability')).toHaveText('Available');
  await expect(page.locator('#choremouse .card-actions .btn')).toContainText('Open app');
  await expect(page.locator('#coming-soon #note-thyme .availability')).toHaveText('Coming soon');
  await expect(page.locator('#note-thyme a[href^="https:"]')).toHaveCount(0);
  await expect(page.locator('#clinic-access [data-product]')).toHaveCount(4);
  await expect(page.locator('#clinic-access #vmta .card-release-note')).toContainText('sample data and simulated mailbox');
  await expect(page.locator('#clinic-access [data-availability="limited-access"] a[href^="https:"]')).toHaveCount(0);
  await page.getByRole('searchbox').fill('VMTA');
  await expect(page.locator('[data-product]:visible')).toHaveCount(1);
  await expect(page.locator('#public-apps')).toBeHidden();
  await expect(page.locator('#clinic-access')).toBeVisible();
  await expect(page.locator('#coming-soon')).toBeHidden();
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  await expect(page.locator('#public-apps')).toBeVisible();
  await expect(page.locator('#coming-soon')).toBeVisible();
  for(const id of ['delquro-echo','ghostforge','clt-academy','vibe-coding-101']){
    await expect(page.locator(`[data-product]#${id}`)).toHaveCount(0);
    const response=await page.request.get(`/apps/${id}.html`);
    expect(response.status()).toBe(404);
  }
});


test('Megatory joins the complete veterinary suite without changing clinic gates',async({browser,baseURL})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:812}});
 const page=await context.newPage();
 const names=['DelQuro Connect','VetForm GO','VMTA','Megatory Live'];
 await page.goto(baseURL+'/products.html');
 await expect(page.locator('#clinic-access-heading')).toHaveText('Veterinary suite');
 await expect(page.locator('#clinic-access [data-product]')).toHaveCount(4);
 await expect(page.locator('#clinic-access #megatory-live .availability')).toHaveText('Public preview');
 await expect(page.locator('#public-apps #megatory-live')).toHaveCount(0);
 await expect(page.locator('#clinic-access [data-availability="limited-access"] a[href^="https:"]')).toHaveCount(0);
 await page.goto(baseURL+'/');
 for(const name of names) await expect(page.locator('#veterinary-suite').getByRole('heading',{name,exact:true})).toBeVisible();
 await expect(page.locator('#previews [data-demo="megatory-live"]')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await context.close();
});
