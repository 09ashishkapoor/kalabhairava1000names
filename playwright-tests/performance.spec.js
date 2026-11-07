const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const { gotoHome } = require('./helpers/site');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const BUDGET = {
  domContentLoadedMs: 1000,
  initialHtmlBytes: 320000,
  bootstrapJsBytes: 70000,
  // Measured 2026-11-07: 36,944 bytes after the static reference pages shipped.
  initialCssBytes: 40000
};

test.use({ viewport: { width: 390, height: 844 } });

test('main page stays within the validation performance budget', async ({ page }) => {
  await gotoHome(page);

  const navigation = await page.evaluate(() => {
    const entry = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: entry.domContentLoadedEventEnd,
      load: entry.loadEventEnd
    };
  });

  const bytes = {
    initialHtml: fs.statSync(path.join(DIST_DIR, 'index.html')).size,
    bootstrapJs:
      fs.statSync(path.join(DIST_DIR, 'app.js')).size +
      fs.statSync(path.join(DIST_DIR, 'navigation.js')).size +
      fs.statSync(path.join(DIST_DIR, 'translations.js')).size,
    initialCss: fs.statSync(path.join(DIST_DIR, 'styles.min.css')).size
  };

  expect(navigation.domContentLoaded).toBeLessThan(BUDGET.domContentLoadedMs);
  expect(bytes.initialHtml).toBeLessThanOrEqual(BUDGET.initialHtmlBytes);
  expect(bytes.bootstrapJs).toBeLessThanOrEqual(BUDGET.bootstrapJsBytes);
  expect(bytes.initialCss).toBeLessThanOrEqual(BUDGET.initialCssBytes);
});
