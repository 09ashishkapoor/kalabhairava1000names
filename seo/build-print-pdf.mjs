// Builds the on-domain printable PDF edition of the 1000-name booklet.
// The printed list preserves the project's full 1,000-entry Sahasranama sequence.
//
// Why this exists: the official designed ebook (hosted by Khyapa Parampara) is
// ~53 MB, which is above the 25 MiB per-file limit for Cloudflare Pages
// assets. This printable edition is text-based, small, selectable/searchable,
// and regenerable from repo data.
//
// Requirements: Google Chrome or Microsoft Edge installed (used headless for
// HTML -> PDF), plus seo/assets/fonts/NotoSansDevanagari.ttf (OFL).
//
// Run: node seo/build-print-pdf.mjs
// Output: public/downloads/kalabhairava-sahasranama-names.pdf

import { execFileSync } from "node:child_process";
import {
	existsSync,
	readFileSync,
	writeFileSync,
	mkdtempSync,
	rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = process.cwd();
const MANIFEST_PATH = join(ROOT, "public", "data_manifest.json");
const MAPPING_PATH = join(ROOT, "src", "data", "name-mapping.json");
const FONT_PATH = join(ROOT, "seo", "assets", "fonts", "NotoSansDevanagari.ttf");
const COVER_IMAGE_PATH = join(ROOT, "seo", "assets", "kalabhairava-cover.jpg");
const OUTPUT_PATH = join(ROOT, "public", "downloads", "kalabhairava-sahasranama-names.pdf");

const SITE_URL = "https://bhairavakalikenamosthute.com";

function loadEntries() {
	const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
	const entries = manifest.files.flatMap((file) =>
		JSON.parse(readFileSync(join(ROOT, "public", file), "utf8")),
	);
	return entries.sort((a, b) => Number(a.index) - Number(b.index));
}

function escapeHtml(value) {
	return String(value ?? "")
		.replace(/&/gu, "&amp;")
		.replace(/</gu, "&lt;")
		.replace(/>/gu, "&gt;")
		.replace(/"/gu, "&quot;");
}

function findChrome() {
	const candidates = [
		process.env.CHROME_PATH,
		"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
		"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
		"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
		"C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
		"/usr/bin/google-chrome",
		"/usr/bin/chromium",
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	].filter(Boolean);

	for (const candidate of candidates) {
		if (existsSync(candidate)) {
			return candidate;
		}
	}

	throw new Error("Chrome/Edge not found. Set CHROME_PATH.");
}

function buildHtml(entries, mappingRows) {
	const fontBase64 = readFileSync(FONT_PATH).toString("base64");
	const coverImageBase64 = readFileSync(COVER_IMAGE_PATH).toString("base64");
	const generated = new Date().toISOString().slice(0, 10);

	const rows = mappingRows
		.map((row) => {
			const entry = entries[Number(row.number) - 1];
			const meaning = escapeHtml(entry.english_one_line);
			return `<tr><td class="num">${row.number}</td><td class="dev" lang="sa">${escapeHtml(
				row.devanagari,
			)}</td><td class="name"><strong>${escapeHtml(
				row.spelling_common,
			)}</strong><br><span class="iast">${escapeHtml(row.iast)}</span></td><td class="meaning">${meaning}</td></tr>`;
		})
		.join("\n");

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Kalabhairava Sahasranama — 1000 Names of Kalabhairava</title>
<style>
@font-face {
  font-family: "NotoDev";
  src: url(data:font/ttf;base64,${fontBase64}) format("truetype");
}
@page { size: A4; margin: 16mm 14mm 16mm; }
html, body { margin: 0; padding: 0; }
body { font-family: Georgia, "Times New Roman", serif; color: #1b1014; font-size: 10.5pt; line-height: 1.45; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.dev { font-family: "NotoDev", "Nirmala UI", sans-serif; }
.cover { page-break-after: always; padding-top: 4mm; text-align: center; }
.cover .blessing { margin: 0 0 6mm; color: #8b2635; font-size: 9.5pt; letter-spacing: 0.09em; text-transform: uppercase; }
.cover h1 { font-size: 25pt; margin: 0 0 3mm; color: #6d1a2a; }
.cover h2 { font-size: 13pt; font-weight: normal; margin: 0 0 7mm; color: #3b2026; }
.cover-art { width: 104mm; margin: 0 auto 6mm; padding: 2mm; border: 1.2mm solid #c9a962; border-radius: 3mm; background: #fffdf8; }
.cover-art img { display: block; width: 100%; height: auto; border-radius: 1.5mm; }
.cover .sanskrit { font-size: 17pt; margin: 0 0 7mm; color: #6d1a2a; }
.cover .meta { font-size: 9.5pt; color: #5a454b; line-height: 1.6; }
.cover .meta strong { color: #6d1a2a; }
.cover .foot { margin: 8mm 0 0; color: #6d1a2a; font-size: 10.5pt; font-style: italic; }
.intro { page-break-after: always; }
.intro h2 { color: #6d1a2a; font-size: 15pt; margin: 0 0 4mm; }
.intro p, .intro li { color: #2c1c21; margin: 0 0 3mm; }
table { width: 100%; border-collapse: collapse; }
thead { display: table-header-group; }
th { text-align: left; font-size: 9.5pt; color: #6d1a2a; border-bottom: 0.8pt solid #c4a15e; padding: 2mm 1.5mm; }
td { vertical-align: top; border-bottom: 0.4pt solid #e2d6c6; padding: 1.6mm 1.5mm; }
tr { page-break-inside: avoid; }
td.num { width: 9mm; color: #7a5a62; font-size: 9pt; }
td.dev { width: 36mm; }
td.name { width: 42mm; }
td.name .iast { color: #7a5a62; font-size: 8.5pt; font-style: italic; }
td.meaning { font-size: 9.5pt; }
.final { page-break-before: always; padding-top: 10mm; }
.final h2 { color: #6d1a2a; font-size: 14pt; }
.final p { color: #2c1c21; }
.final a { color: #6d1a2a; }
.footer-note { margin-top: 6mm; font-size: 8.5pt; color: #6b565c; }
</style>
</head>
<body>
<section class="cover">
  <p class="blessing">Om Shri Gurubhyo Namaha &middot; Jai Khyapa Parampara</p>
  <h1>Kalabhairava Sahasranama</h1>
  <h2>The 1000 Names of Kalabhairava with English Meanings</h2>
  <figure class="cover-art">
    <img src="data:image/jpeg;base64,${coverImageBase64}" alt="Statue of Kalabhairava with trident, sword, skull staff, and dog">
  </figure>
  <div class="dev sanskrit" lang="sa">कालभैरव सहस्रनाम</div>
  <div class="meta">
    <strong>Free printable edition</strong> for offline reading and devotional study<br>
    ${SITE_URL}<br>
    Generated ${generated} from the site's name data
  </div>
  <p class="foot">May every name bring you closer to the Lord.</p>
</section>
<section class="intro">
  <h2>How to use this edition</h2>
  <p>This printable edition follows the traditional <strong>1000 Names (Sahasranama)</strong> of Kalabhairava, listing the complete name sequence preserved by this project &mdash; 1,000 numbered entries &mdash; with Devanagari, a common English spelling, the IAST transliteration, and a short English meaning for each name.</p>
  <p>Each name also has its own page on the website, with alternate spellings and a longer explanatory note. Use the site for search and cross-references; use this file for offline reading, printing, and chanting support.</p>
  <p>Transliteration note: the "common spelling" column uses the romanization most readers type (for example <em>Bhairavaya</em>), while the IAST column gives the diacritic form (<em>Bhairavāya</em>). Sanskrit names take several valid English spellings; the website lists them on each name page.</p>
  <p>About the count: the Sahasranama is traditionally called the thousand names of the Lord. This edition preserves its source's full sequence of 1,000 numbered entries, including repeated names, and is titled 1000 Names for the traditional name of the text.</p>
  <p>This is a devotional reference compiled for study. It is not a critical edition and does not replace traditional instruction or lineage guidance.</p>
</section>
<table>
<thead>
<tr><th>#</th><th>Devanagari</th><th>Name</th><th>Meaning</th></tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
<section class="final">
  <h2>Sources and further reading</h2>
  <p>The names are presented in the order used by this project's Kalabhairava Sahasranama reference. Public source material and editorial notes are documented at <a href="${SITE_URL}/sources/">${SITE_URL}/sources/</a>.</p>
  <p>Browse the interactive reader at <a href="${SITE_URL}/">${SITE_URL}</a> or the static names hub at <a href="${SITE_URL}/names/">${SITE_URL}/names/</a>.</p>
  <p>Corrections are welcome through the open-source repository: <a href="https://github.com/09ashishkapoor/kalabhairava1000names">github.com/09ashishkapoor/kalabhairava1000names</a>.</p>
  <p class="footer-note">Cover image: Kalabhairava, from the project's devotional artwork (photo credit: Tryst With Kaali — Praveen Radhakrishnan). The Devanagari typeface used in this file is Noto Sans Devanagari (SIL Open Font License).</p>
</section>
</body>
</html>`;
}

function main() {
	const entries = loadEntries();
	const mapping = JSON.parse(readFileSync(MAPPING_PATH, "utf8"));

	if (entries.length !== 1000) {
		throw new Error(`Expected 1,000 entries, found ${entries.length}`);
	}
	if (mapping.rows.length !== 1000) {
		throw new Error(`Expected 1,000 mapping rows, found ${mapping.rows.length}`);
	}

	const chrome = findChrome();
	const workDir = mkdtempSync(join(tmpdir(), "kalabhairava-pdf-"));
	const htmlPath = join(workDir, "edition.html");
	writeFileSync(htmlPath, buildHtml(entries, mapping.rows), "utf8");

	execFileSync(
		chrome,
		[
			"--headless=new",
			"--disable-gpu",
			"--no-sandbox",
			"--no-pdf-header-footer",
			"--virtual-time-budget=30000",
			`--print-to-pdf=${OUTPUT_PATH}`,
			`file:///${htmlPath.replace(/\\/gu, "/")}`,
		],
		{ stdio: "pipe" },
	);

	rmSync(workDir, { recursive: true, force: true });

	const bytes = readFileSync(OUTPUT_PATH);
	if (bytes.subarray(0, 4).toString() !== "%PDF") {
		throw new Error("Generated file is not a PDF");
	}
	console.log(
		`wrote ${OUTPUT_PATH} (${(bytes.length / 1024 / 1024).toFixed(2)} MB) via ${chrome}`,
	);
}

main();
