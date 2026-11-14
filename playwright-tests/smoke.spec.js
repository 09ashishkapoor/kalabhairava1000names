const { test, expect } = require("@playwright/test");
const { blockExternalTelemetry, gotoHome, gotoName, gotoRange } = require("./helpers/site");

test("the homepage server-renders the first set of eleven", async ({ page }) => {
	await gotoHome(page);
	await expect(page.locator("#headSet")).toHaveText("01");
	await expect(page.locator("#headRange")).toHaveText("1–11");
	await expect(page.locator("#toc button")).toHaveCount(11);
	await expect(page.locator(".reader .leaf-right .page-name")).toHaveText("भैरवाय");
	await expect(page.locator(".reader .leaf-right .page-iast")).toHaveText("Bhairavāya");
});

test("the reader pages to the next set and back", async ({ page }) => {
	await gotoHome(page);
	await page.locator("#next").click();
	await expect(page.locator("#headSet")).toHaveText("02");
	await expect(page.locator("#headRange")).toHaveText("12–22");
	await expect(page.locator("#toc button")).toHaveCount(11);
	await page.locator("#prev").click();
	await expect(page.locator("#headSet")).toHaveText("01");
});

test("the reader search is accent-insensitive and set-scoped", async ({ page }) => {
	await gotoHome(page);
	await page.locator("#q").fill("bhairava");
	await expect(page.locator("#toc li:not(.is-hidden)")).toHaveCount(1);
	await expect(page.locator("#toc li:not(.is-hidden) .i")).toHaveText("Bhairavāya");
	await page.locator("#q").fill("no-such-name");
	await expect(page.locator("#findCount")).toHaveText("0/11");
});

test("a name page renders Devanagari, IAST, the spelling table and the pager", async ({ page }) => {
	await gotoName(page);
	await expect(page.locator("h1.dev-title")).toHaveText("भैरवाय");
	await expect(page.locator(".iast-title")).toHaveText("Bhairavāya");
	await expect(page.locator(".spellings dt")).toHaveText([
		"Devanagari",
		"IAST",
		"Common spelling",
		"Source form",
		"Also spelled",
	]);
	await expect(page.locator(".pager a.next")).toHaveAttribute("href", "/names/bhutanathaya/");
});

test("a range page lists one hundred names in two columns with range tabs", async ({ page }) => {
	await gotoRange(page);
	await expect(page.locator(".index-cols .nrow")).toHaveCount(100);
	await expect(page.locator('.rtabs a[aria-current="page"]')).toHaveText("1–100");
	await expect(page.locator(".nrow#name-1")).toBeVisible();
});

test("the night control persists the reader's choice", async ({ page }) => {
	await gotoHome(page);
	await expect(page.locator("html")).not.toHaveAttribute("data-theme", "night");
	await page.locator("[data-theme-toggle]").click();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
	await expect(page.locator("[data-theme-toggle]")).toHaveAttribute("aria-pressed", "true");
	await page.reload({ waitUntil: "load" });
	await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
	await page.locator("[data-theme-toggle]").click();
	await expect(page.locator("html")).not.toHaveAttribute("data-theme", "night");
});

test("unknown URLs return a real 404", async ({ page }) => {
	await blockExternalTelemetry(page);
	const response = await page.goto("/this-page-does-not-exist/", { waitUntil: "load" });
	expect(response.status()).toBe(404);
});

test("there are no failed same-origin requests on a page", async ({ page }) => {
	const failed = [];
	page.on("requestfailed", (request) => {
		const url = request.url();
		if (url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost")) {
			failed.push(url);
		}
	});
	await page.goto("/names/bhairavaya/", { waitUntil: "networkidle" });
	expect(failed).toEqual([]);
});
