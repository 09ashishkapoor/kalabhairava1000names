const fs = require("node:fs");
const path = require("node:path");
const { test, expect } = require("@playwright/test");
const { gotoHome } = require("./helpers/site");

const DIST_DIR = path.join(__dirname, "..", "dist");
const BUDGET = {
	domContentLoadedMs: 1500,
	initialHtmlBytes: 320000,
	bootstrapJsBytes: 70000,
	// The Pothi system: pothi-system + theme-kalabhairava + pothi-reader.
	initialCssBytes: 50000,
};

test.use({ viewport: { width: 390, height: 844 } });

test("the reader stays within the performance budget", async ({ page }) => {
	await gotoHome(page);

	const navigation = await page.evaluate(() => {
		const entry = performance.getEntriesByType("navigation")[0];
		return {
			domContentLoaded: entry.domContentLoadedEventEnd,
			load: entry.loadEventEnd,
		};
	});

	const bytes = {
		initialHtml: fs.statSync(path.join(DIST_DIR, "index.html")).size,
		bootstrapJs:
			fs.statSync(path.join(DIST_DIR, "pothi-reader.js")).size +
			fs.statSync(path.join(DIST_DIR, "pothi-theme.js")).size,
		initialCss:
			fs.statSync(path.join(DIST_DIR, "pothi-system.css")).size +
			fs.statSync(path.join(DIST_DIR, "theme-kalabhairava.css")).size +
			fs.statSync(path.join(DIST_DIR, "pothi-reader.css")).size,
	};

	expect(navigation.domContentLoaded).toBeLessThan(BUDGET.domContentLoadedMs);
	expect(bytes.initialHtml).toBeLessThanOrEqual(BUDGET.initialHtmlBytes);
	expect(bytes.bootstrapJs).toBeLessThanOrEqual(BUDGET.bootstrapJsBytes);
	expect(bytes.initialCss).toBeLessThanOrEqual(BUDGET.initialCssBytes);
});
