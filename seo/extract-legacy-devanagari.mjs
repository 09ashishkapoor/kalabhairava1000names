// Extracts the Devanagari name spelling for all 1,000 Kalabhairava entries from
// the pre-English-only dataset that still carried `hindi_name`.
//
// The Hindi UI/prose was removed from the site deliberately; only the name
// spelling field is reused, as an input for name pages (not restored as Hindi
// content).
//
// Run: node seo/extract-legacy-devanagari.mjs
// Output: seo/data/legacy-devanagari-names.json

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const LEGACY_REF = "b9adb4e:sahasranama_meanings.json";
const OUTPUT_PATH = join(ROOT, "seo", "data", "legacy-devanagari-names.json");

const dev = /[\u0900-\u097F]/u;

function main() {
	const blob = execFileSync("git", ["show", LEGACY_REF], {
		cwd: ROOT,
		maxBuffer: 100 * 1024 * 1024,
	});
	const legacy = JSON.parse(
		blob.toString("utf8").replace(/^\uFEFF/u, ""),
	);

	if (legacy.length !== 1000) {
		throw new Error(`Expected 1,000 legacy entries, found ${legacy.length}`);
	}

	const names = legacy.map((entry) => ({
		index: Number(entry.index),
		hindi_name: String(entry.hindi_name ?? "").trim(),
	}));

	const missing = names.filter((entry) => entry.hindi_name === "");
	if (missing.length > 0) {
		throw new Error(`${missing.length} legacy entries have no hindi_name`);
	}
	const withoutDevanagari = names.filter((entry) => !dev.test(entry.hindi_name));
	if (withoutDevanagari.length > 0) {
		throw new Error(
			`${withoutDevanagari.length} legacy names have no Devanagari characters: ${withoutDevanagari
				.slice(0, 5)
				.map((entry) => entry.index)
				.join(", ")}`,
		);
	}

	mkdirSync(join(ROOT, "seo", "data"), { recursive: true });
	writeFileSync(
		OUTPUT_PATH,
		`${JSON.stringify(names, null, 1)}\n`,
		"utf8",
	);
	console.log(`wrote ${names.length} Devanagari names -> seo/data/legacy-devanagari-names.json`);
	if (!existsSync(OUTPUT_PATH)) {
		throw new Error("output file was not written");
	}
}

main();
