// Generates public/sitemap.xml, including one URL per generated name page.
// Run manually or via `npm run build` (prebuild hook).
//
// Keep the legacy static entries byte-identical to the previous sitemap so the
// existing structure tests keep validating dates/priorities.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SITE_URL = "https://bhairavakalikenamosthute.com";
const MANIFEST_PATH = join(ROOT, "public", "data_manifest.json");
const MAPPING_PATH = join(ROOT, "src", "data", "name-mapping.json");
const SITEMAP_PATH = join(ROOT, "public", "sitemap.xml");

function staticEntries() {
	const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
	const total = Number(manifest.total);

	const entries = [
		{ loc: `${SITE_URL}/`, lastmod: "2026-04-21", changefreq: "weekly", priority: "1.0" },
		{ loc: `${SITE_URL}/names/`, lastmod: "2026-04-26", changefreq: "weekly", priority: "0.9" },
		{ loc: `${SITE_URL}/sources/`, lastmod: "2026-04-30", changefreq: "monthly", priority: "0.7" },
	];

	for (let start = 1; start <= total; start += 100) {
		const end = Math.min(start + 99, total);
		entries.push({
			loc: `${SITE_URL}/names/${start}-${end}/`,
			lastmod: "2026-04-26",
			changefreq: "weekly",
			priority: "0.8",
		});
	}

	// Added on the SEO branch; keep extending this list as landing pages ship.
	const landingPages = [
		"/108-names-of-kalabhairava/",
		"/1000-names-of-kalabhairava/",
		"/kalabhairava-sahasranama-pdf/",
		"/kalabhairava-sahasranama-lyrics/",
		"/kalabhairava-sahasranama-benefits/",
		"/about/",
		"/contact/",
		"/privacy/",
	];
	for (const path of landingPages) {
		entries.push({
			loc: `${SITE_URL}${path}`,
			lastmod: new Date().toISOString().slice(0, 10),
			changefreq: "monthly",
			priority: "0.9",
		});
	}

	return entries;
}

function nameEntries() {
	const mapping = JSON.parse(readFileSync(MAPPING_PATH, "utf8"));
	const lastmod = new Date().toISOString().slice(0, 10);

	return mapping.pageGroups.map((group) => ({
		loc: `${SITE_URL}/names/${group.slug}/`,
		lastmod,
		changefreq: "monthly",
		priority: "0.6",
	}));
}

function renderEntry(entry) {
	return [
		"  <url>",
		`    <loc>${entry.loc}</loc>`,
		`    <lastmod>${entry.lastmod}</lastmod>`,
		`    <changefreq>${entry.changefreq}</changefreq>`,
		`    <priority>${entry.priority}</priority>`,
		"  </url>",
	].join("\n");
}

function main() {
	const staticList = staticEntries();
	const nameList = nameEntries();
	const entries = [...staticList, ...nameList];
	const xml = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
		'        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
		entries.map(renderEntry).join("\n"),
		"</urlset>",
		"",
	].join("\n");

	writeFileSync(SITEMAP_PATH, xml, "utf8");
	console.log(
		`sitemap: ${entries.length} URLs (${nameList.length} name pages, ${staticList.length} static) -> public/sitemap.xml`,
	);
}

main();
