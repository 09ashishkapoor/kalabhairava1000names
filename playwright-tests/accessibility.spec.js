const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { openNamesExplorer } = require('./helpers/site');

test('names explorer passes the scoped axe accessibility scan', async ({ page }) => {
  await openNamesExplorer(page);

  const results = await new AxeBuilder({ page })
    .include('#names-section')
    .analyze();

  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});
