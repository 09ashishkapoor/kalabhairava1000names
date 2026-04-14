const { test, expect } = require('@playwright/test');
const { installRuntimeGuards } = require('./helpers');

async function capturePerformanceMetrics(page) {
  await page.addInitScript(() => {
    window.__perfBudget = {
      lcp: 0,
      cls: 0,
    };

    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        window.__perfBudget.lcp = lastEntry.startTime;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__perfBudget.cls += entry.value;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
}

test('landing page stays within baseline performance budgets', async ({ page, baseURL }) => {
  await capturePerformanceMetrics(page);
  const runtimeGuards = await installRuntimeGuards(page, baseURL);

  await page.goto('/', { waitUntil: 'load' });
  await expect(page.locator('#names-grid .name-card').first()).toBeVisible();
  await page.waitForTimeout(3000);

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      lcp: window.__perfBudget.lcp,
      cls: window.__perfBudget.cls,
      domContentLoaded: navigation.domContentLoadedEventEnd,
      load: navigation.loadEventEnd,
    };
  });

  expect(metrics.domContentLoaded).toBeLessThanOrEqual(500);
  expect(metrics.load).toBeLessThanOrEqual(500);
  expect(metrics.lcp).toBeLessThanOrEqual(1000);
  expect(metrics.cls).toBeLessThanOrEqual(1.05);

  runtimeGuards.assertClean();
});
