const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { installRuntimeGuards } = require("./helpers");

test("loads the landing page and initial names explorer content", async ({
	page,
	baseURL,
}) => {
	const runtimeGuards = await installRuntimeGuards(page, baseURL);

	await page.goto("/", { waitUntil: "domcontentloaded" });

	await expect(page).toHaveTitle(/Kalabhairava/i);
	await expect(page.locator("#explore-btn")).toBeVisible();
	await expect(page.locator("#learn-btn")).toBeVisible();
	await expect(page.locator("#search-input")).toBeVisible();
	await expect(page.locator("#names-grid .name-card").first()).toBeVisible();
	await expect(page.locator("#names-grid .name-card")).toHaveCount(11);
	await expect(page.locator("#stats-display")).toContainText(/1000/);

	runtimeGuards.assertClean();
});

test("stays English-only and does not expose a language toggle", async ({
	page,
	baseURL,
}) => {
	const runtimeGuards = await installRuntimeGuards(page, baseURL);

	await page.goto("/", { waitUntil: "domcontentloaded" });

	await expect(page.locator("html")).toHaveAttribute("lang", "en");
	await expect(page.locator("#language-toggle")).toHaveCount(0);
	await expect(page.locator("#explore-btn")).toContainText(
		"Start With the Names",
	);
	await expect(page.locator("#search-input")).toHaveAttribute(
		"placeholder",
		"Search names or meanings...",
	);
	await expect
		.poll(() =>
			page.evaluate(() => window.localStorage.getItem("selectedLanguage")),
		)
		.toBe(null);

	runtimeGuards.assertClean();
});

test("supports focused search on the bootstrap dataset without breaking the reader", async ({
	page,
	baseURL,
}) => {
	const runtimeGuards = await installRuntimeGuards(page, baseURL);

	await page.goto("/", { waitUntil: "domcontentloaded" });

	const searchInput = page.locator("#search-input");
	await searchInput.fill("Bhairavaaya");

	await expect(page.locator("#stats-display")).toContainText(/bhairavaaya/i);
	await expect
		.poll(async () => page.locator("#names-grid .name-card").count())
		.toBeGreaterThan(0);
	await expect(page.locator("#names-grid .name-card").first()).toContainText(
		"BHAIRAVAAYA",
	);

	await page.locator("#clear-btn").click();
	await expect(searchInput).toHaveValue("");
	await expect(page.locator("#names-grid .name-card")).toHaveCount(11);

	runtimeGuards.assertClean();
});

test("keeps elaboration disclosure state accessible for keyboard and screen reader users", async ({
	page,
	baseURL,
}) => {
	const runtimeGuards = await installRuntimeGuards(page, baseURL);

	await page.goto("/", { waitUntil: "domcontentloaded" });

	const toggleButton = page.locator("#names-grid .toggle-btn").first();
	const elaboration = page.locator("#names-grid .elaboration").first();
	const elaborationContent = page
		.locator("#names-grid .elaboration-content")
		.first();

	await expect(toggleButton).toHaveAttribute("aria-expanded", "false");
	await expect(elaboration).toHaveAttribute("aria-hidden", "true");
	await expect(elaborationContent).toHaveAttribute("tabindex", "-1");
	await expect(elaborationContent).toHaveAttribute("inert", "");

	await toggleButton.click();

	await expect(toggleButton).toHaveAttribute("aria-expanded", "true");
	await expect(elaboration).toHaveAttribute("aria-hidden", "false");
	await expect(elaborationContent).toHaveAttribute("tabindex", "0");
	await expect(elaborationContent).not.toHaveAttribute("inert", "");

	await toggleButton.click();

	await expect(toggleButton).toHaveAttribute("aria-expanded", "false");
	await expect(elaboration).toHaveAttribute("aria-hidden", "true");
	await expect(elaborationContent).toHaveAttribute("tabindex", "-1");
	await expect(elaborationContent).toHaveAttribute("inert", "");

	runtimeGuards.assertClean();
});

test("avoids nested scrolling inside expanded elaborations on mobile", async ({
	page,
	baseURL,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	const runtimeGuards = await installRuntimeGuards(page, baseURL);

	await page.goto("/", { waitUntil: "domcontentloaded" });

	const toggleButton = page.locator("#names-grid .toggle-btn").first();
	const elaborationContent = page
		.locator("#names-grid .elaboration-content")
		.first();

	await toggleButton.click();

	const mobileOverflow = await elaborationContent.evaluate((node) => {
		const styles = window.getComputedStyle(node);
		return {
			overflowY: styles.overflowY,
			maxHeight: styles.maxHeight,
		};
	});

	expect(mobileOverflow.overflowY).toBe("visible");
	expect(mobileOverflow.maxHeight).toBe("none");

	runtimeGuards.assertClean();
});

test("has no critical accessibility violations in the names explorer flow", async ({
	page,
	baseURL,
}) => {
	const runtimeGuards = await installRuntimeGuards(page, baseURL);

	await page.goto("/", { waitUntil: "domcontentloaded" });
	await expect(page.locator("#names-grid .name-card").first()).toBeVisible();

	const accessibilityScanResults = await new AxeBuilder({ page })
		.include("#names-section")
		.withTags(["wcag2a", "wcag2aa"])
		.analyze();

	expect(accessibilityScanResults.violations).toEqual([]);
	runtimeGuards.assertClean();
});
