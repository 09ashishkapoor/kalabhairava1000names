const { test, expect } = require('@playwright/test');
const { installRuntimeGuards, stabilizeVisualState } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.removeItem('selectedLanguage');
  });
});

test('landing hero matches the baseline', async ({ page, baseURL }) => {
  const runtimeGuards = await installRuntimeGuards(page, baseURL);

  await page.setViewportSize({ width: 1440, height: 1400 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await stabilizeVisualState(page);

  await expect(page.locator('#landing-page')).toHaveScreenshot('landing-hero.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixels: 5000,
  });
  runtimeGuards.assertClean();
});

test('names explorer controls match the baseline', async ({ page, baseURL }) => {
  const runtimeGuards = await installRuntimeGuards(page, baseURL);

  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await stabilizeVisualState(page);
  await expect(page.locator('#names-grid .name-card').first()).toBeVisible();

  await expect(page.locator('#names-section .controls-panel')).toHaveScreenshot('names-controls.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixels: 1000,
  });
  runtimeGuards.assertClean();
});

test('first name card matches the baseline', async ({ page, baseURL }) => {
  const runtimeGuards = await installRuntimeGuards(page, baseURL);

  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await stabilizeVisualState(page);
  await expect(page.locator('#names-grid .name-card').first()).toBeVisible();

  await expect(page.locator('#names-grid .name-card').first()).toHaveScreenshot('first-name-card.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixels: 1000,
  });
  runtimeGuards.assertClean();
});
