import { test, expect } from '@playwright/test';

const configuredUrl = process.env.AI_QUEST_URL?.trim();
let appUrl;
if (configuredUrl) {
  const parsed = new URL(configuredUrl);
  const loopbackHost = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  const secureHost = parsed.protocol === 'https:' || (parsed.protocol === 'http:' && loopbackHost);
  if (!secureHost || parsed.username || parsed.password) {
    throw new Error('AI_QUEST_URL must be HTTPS, except for loopback HTTP, and must not contain embedded credentials.');
  }
  parsed.search = '';
  parsed.hash = '';
  if (!parsed.pathname.endsWith('/')) parsed.pathname += '/';
  appUrl = parsed;
}

test.skip(!appUrl, 'Set AI_QUEST_URL explicitly to run the public-host release smoke.');

const at = (hash) => new URL(hash, appUrl).toString();

async function newIsolatedPage(browser, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport });
  return { context, page: await context.newPage() };
}

async function expectNoHorizontalOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document, label).toBeLessThanOrEqual(dimensions.viewport + 1);
}

test('public host serves the 1.9 dashboard and searchable illustrated library', async ({ browser }) => {
  const { context, page } = await newIsolatedPage(browser);
  try {
    const response = await page.goto(appUrl.toString());
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/AI Quest/);
    await expect(page.getByRole('heading', { name: /Big skills\./ })).toBeVisible();
    await expect(page.locator('.page-footer')).toContainText('Sources & content v1.9.0');

    await page.goto(at('#library'));
    const search = page.getByLabel('Search all learning content');
    await expect(search).toBeVisible();
    await search.fill('codex-slash-model');
    const card = page.locator('.resource-card[data-resource-id="codex-slash-model"]');
    await expect(card).toBeVisible();
    const image = card.locator('.card-artwork img').first();
    await expect.poll(() => image.evaluate((node) => {
      const img = node;
      return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
    }), { message: 'the matching library artwork should decode' }).toBe(true);
  } finally {
    await context.close();
  }
});

test('375px host layout keeps the dashboard and navigation in the viewport', async ({ browser }) => {
  const { context, page } = await newIsolatedPage(browser, { width: 375, height: 812 });
  try {
    await page.goto(appUrl.toString());
    await expect(page.getByRole('heading', { name: /Big skills\./ })).toBeVisible();
    await expectNoHorizontalOverflow(page, 'dashboard at 375px');

    const bottomNav = page.getByRole('navigation', { name: 'Mobile navigation' });
    for (const label of ['Home', 'Trail', 'Play', 'Toolkit', 'More']) {
      await expect(bottomNav.getByText(label, { exact: true })).toBeVisible();
    }
    const menu = page.getByRole('button', { name: 'Open navigation' });
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    const navigation = page.locator('aside[aria-label="Main navigation"]');
    await expect(navigation.getByRole('link', { name: 'Learning path' })).toBeVisible();
    await navigation.getByRole('link', { name: 'Learning path' }).click();
    await expect(page).toHaveURL(/#course$/);
    await expectNoHorizontalOverflow(page, 'learning path at 375px');
  } finally {
    await context.close();
  }
});

test('first lesson feedback, completion XP, and exported progress survive fresh-context import', async ({ browser }, testInfo) => {
  const { context, page } = await newIsolatedPage(browser, { width: 375, height: 812 });
  let importContext;
  try {
    await page.goto(at('#lesson/surface-map'));
    await expect(page.locator('.lp-header h1')).toHaveText('Find the right place');
    await expect(page.locator('.lp-stage')).toHaveAttribute('aria-label', 'Learn lesson step');
    await expect(page.locator('.xp-chip')).toContainText('0');

    await page.getByRole('button', { name: 'Let’s try it' }).click();
    await expect(page.locator('.lp-stage')).toHaveAttribute('aria-label', 'Try lesson step');
    const exercise = page.locator('.question-card').filter({ hasText: 'Where do you type codex review?' });
    await exercise.getByRole('radio').nth(1).check();
    await exercise.getByRole('button', { name: 'Check my answer' }).click();
    await expect(exercise.getByRole('status')).toContainText('Good try. Here’s a clue.');
    await expect(exercise.getByRole('status')).toContainText('A browser chat has its own tools.');
    await exercise.getByRole('button', { name: 'Try again' }).click();
    await exercise.getByRole('radio').nth(0).check();
    await exercise.getByRole('button', { name: 'Check my answer' }).click();
    await expect(exercise.getByRole('status')).toContainText('That’s the move.');
    await page.getByRole('button', { name: 'Go to the check' }).click();
    await expect(page.locator('.lp-stage')).toHaveAttribute('aria-label', 'Check lesson step');

    const quiz = page.locator('.question-card').filter({ hasText: 'A model name is listed for Codex.' });
    await quiz.getByRole('radio').nth(0).check();
    await quiz.getByRole('button', { name: 'Check my answer' }).click();
    await expect(quiz.getByRole('status')).toContainText('That’s the move.');
    await page.getByRole('button', { name: 'See my win' }).click();
    await expect(page.locator('.lp-stage')).toHaveAttribute('aria-label', 'Win lesson step');

    // The win is saved before the reward action; claim once, then verify the stored total after reload.
    await page.reload();
    await expect(page.locator('.lp-stage')).toHaveAttribute('aria-label', 'Win lesson step');
    await expect(page.locator('.xp-chip')).toContainText('0');
    await page.getByRole('button', { name: 'Finish lesson' }).click();
    await expect(page.locator('.xp-chip')).toContainText('50');
    await page.reload();
    await expect(page.locator('.xp-chip')).toContainText('50');
    await expect(page.getByRole('button', { name: 'Next lesson' })).toBeVisible();

    await page.goto(at('#settings'));
    const downloadReady = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export progress' }).click();
    const download = await downloadReady;
    const exportPath = testInfo.outputPath(download.suggestedFilename());
    await download.saveAs(exportPath);

    importContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const importPage = await importContext.newPage();
    await importPage.goto(at('#settings'));
    await importPage.getByRole('button', { name: 'Import progress' }).click();
    await importPage.locator('input[type="file"]').setInputFiles(exportPath);
    await expect(importPage.getByRole('status')).toContainText('Progress imported and validated');
    await expect(importPage.locator('.xp-chip')).toContainText('50');
    await importPage.goto(at('#lesson/surface-map'));
    await expect(importPage.getByRole('button', { name: 'Next lesson' })).toBeVisible();
    await expect(importPage.getByRole('button', { name: 'Finish lesson' })).toHaveCount(0);
    await expect(importPage.locator('.xp-chip')).toContainText('50');
  } finally {
    await context.close();
    await importContext?.close();
  }
});
