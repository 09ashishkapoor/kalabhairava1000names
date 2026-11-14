const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { gotoHome, gotoName, gotoRange } = require("./helpers/site");

test("the reader passes an axe scan in day mode", async ({ page }) => {
	await gotoHome(page);
	const results = await new AxeBuilder({ page })
		.include("main")
		.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
		.analyze();
	expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test("the reader passes an axe scan in night mode", async ({ page }) => {
	await gotoHome(page);
	await page.locator("[data-theme-toggle]").click();
	const results = await new AxeBuilder({ page })
		.include("main")
		.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
		.analyze();
	expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test("a name page passes an axe scan", async ({ page }) => {
	await gotoName(page);
	const results = await new AxeBuilder({ page })
		.include("main")
		.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
		.analyze();
	expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test("a range page passes an axe scan", async ({ page }) => {
	await gotoRange(page);
	const results = await new AxeBuilder({ page })
		.include("main")
		.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
		.analyze();
	expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});
