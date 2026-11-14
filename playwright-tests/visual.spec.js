const { test, expect } = require("@playwright/test");
const { gotoHome, gotoName, gotoRange } = require("./helpers/site");

const screenshotOptions = {
	animations: "disabled",
	caret: "hide",
	maxDiffPixelRatio: 0.02,
	scale: "css",
};

test("the cover stays visually stable", async ({ page }) => {
	await gotoHome(page);
	await expect(page.locator(".cover")).toHaveScreenshot(
		"home-cover.png",
		screenshotOptions,
	);
});

test("the reader spread stays visually stable", async ({ page }) => {
	await gotoHome(page);
	await page.locator("#read").scrollIntoViewIfNeeded();
	await expect(page.locator(".spread")).toHaveScreenshot(
		"home-reader-spread.png",
		screenshotOptions,
	);
});

test("the name-page panel stays visually stable", async ({ page }) => {
	await gotoName(page);
	await expect(page.locator(".sheet .panel")).toHaveScreenshot(
		"name-panel.png",
		screenshotOptions,
	);
});

test("the range tabs stay visually stable", async ({ page }) => {
	await gotoRange(page);
	await expect(page.locator(".rtabs")).toHaveScreenshot(
		"range-tabs.png",
		screenshotOptions,
	);
});
