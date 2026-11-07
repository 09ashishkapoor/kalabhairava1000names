const { test, expect } = require("@playwright/test");
const { gotoHome, openNamesExplorer } = require("./helpers/site");

const screenshotOptions = {
	animations: "disabled",
	caret: "hide",
	maxDiffPixelRatio: 0.02,
	scale: "css",
};

test("landing hero content stays visually stable", async ({ page }) => {
	await gotoHome(page);
	await expect(page.locator(".landing-content")).toHaveScreenshot(
		"landing-content.png",
		screenshotOptions,
	);
});

test("names explorer controls stay visually stable", async ({ page }) => {
	await openNamesExplorer(page);
	await expect(page.locator(".controls-panel")).toHaveScreenshot(
		"names-controls-panel.png",
		screenshotOptions,
	);
});

test("first visible name card stays visually stable", async ({ page }) => {
	await openNamesExplorer(page);
	const firstCard = page.locator("#names-grid .name-card.visible").first();
	await expect(firstCard).toHaveScreenshot(
		"first-visible-name-card.png",
		screenshotOptions,
	);
});
