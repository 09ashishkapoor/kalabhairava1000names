const { expect } = require("@playwright/test");

const EXTERNAL_TELEMETRY_PATTERNS = [
	"https://www.googletagmanager.com/**",
	"https://www.google-analytics.com/**",
];

async function blockExternalTelemetry(page) {
	for (const pattern of EXTERNAL_TELEMETRY_PATTERNS) {
		await page.route(pattern, (route) => route.abort());
	}
}

async function waitForFonts(page) {
	await page.evaluate(async () => {
		if (document.fonts && document.fonts.ready) {
			await document.fonts.ready;
		}
	});
}

async function disableMotionForStableTests(page) {
	await page.addStyleTag({
		content: `
      html { scroll-behavior: auto !important; }
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
	});
}

async function gotoHome(page) {
	await blockExternalTelemetry(page);
	await page.goto("/", { waitUntil: "load" });
	await disableMotionForStableTests(page);
	await expect(page.locator(".reader .leaf-right .page-name")).toBeVisible();
	await waitForFonts(page);
}

async function openNamesExplorer(page) {
	await gotoHome(page);
	await page.locator("#read").scrollIntoViewIfNeeded();
	await expect(page.locator(".reader .spread")).toBeVisible();
}

async function gotoName(page, slug = "bhairavaya") {
	await blockExternalTelemetry(page);
	await page.goto(`/names/${slug}/`, { waitUntil: "load" });
	await disableMotionForStableTests(page);
	await waitForFonts(page);
}

async function gotoRange(page, slug = "1-100") {
	await blockExternalTelemetry(page);
	await page.goto(`/names/${slug}/`, { waitUntil: "load" });
	await disableMotionForStableTests(page);
	await waitForFonts(page);
}

module.exports = {
	blockExternalTelemetry,
	gotoHome,
	gotoName,
	gotoRange,
	openNamesExplorer,
	waitForFonts,
};
