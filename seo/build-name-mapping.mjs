// Builds the per-name spelling mapping used by the SEO name pages.
//
// Inputs
//   - public/mahakali_sahasranama_meanings.json : current English data (site spelling, meaning)
//   - git blob 824a649:public/mahakali_sahasranama_meanings.json
//       The pre-English-only data set still contains one Devanagari name per entry.
//       It is cached into seo/data/legacy-devanagari-names.json so builds are offline.
//
// Outputs
//   - src/data/name-mapping.json : canonical mapping imported by Astro at build time
//   - seo/name-mapping.csv       : review table for humans
//
// The mapping is generated, never hand-maintained: rerun `node seo/build-name-mapping.mjs`.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import {
	devanagariToIast,
	iastToReadable,
	iastToReadableWithW,
	iastToSimple,
	slugify,
	titleCaseWords,
} from "./lib/transliterate.mjs";

const ROOT = process.cwd();
const CURRENT_DATA = join(ROOT, "sahasranama_meanings.json");
const LEGACY_CACHE = join(ROOT, "seo", "data", "legacy-devanagari-names.json");
const OVERRIDES_PATH = join(ROOT, "seo", "data", "name-overrides.json");
const MAPPING_OUT = join(ROOT, "src", "data", "name-mapping.json");
const CSV_OUT = join(ROOT, "seo", "name-mapping.csv");
const LEGACY_REF = "b9adb4e:sahasranama_meanings.json";

const STRIP_MARKS_RE = /[\u0300-\u036f]/gu;

function compactNormalize(value) {
	let text = String(value ?? "")
		.normalize("NFD")
		.replace(STRIP_MARKS_RE, "")
		.toLocaleLowerCase("en")
		.replace(/w/gu, "v");

	// Romanization drift that must not count as a mismatch in QA:
	// sh/s, ch/c, doubled h, and spacing/hyphens all collapse.
	let previous = "";
	while (previous !== text) {
		previous = text;
		text = text.replace(/chh?/gu, "c").replace(/shh?/gu, "s");
	}

	return text.replace(/[^a-z0-9]/gu, "");
}

function loadOverrides() {
	if (!existsSync(OVERRIDES_PATH)) {
		return {};
	}

	return JSON.parse(readFileSync(OVERRIDES_PATH, "utf8"));
}

function validateAgainstElaboration(englishElaboration, candidates) {
	const haystack = compactNormalize(englishElaboration);
	if (haystack === "") {
		return "missing";
	}

	for (const candidate of candidates) {
		const needle = compactNormalize(candidate);
		if (needle.length >= 3 && haystack.includes(needle)) {
			return "found";
		}
	}

	return "missing";
}

function cleanupDevanagari(raw) {
	let value = String(raw ?? "").trim();

	// Some legacy entries append a romanized gloss such as "मन्त्रिणी (MANTRIṆĪ)".
	while (/\s*\([^()]*\)\s*$/u.test(value)) {
		value = value.replace(/\s*\([^()]*\)\s*$/u, "").trim();
	}

	value = value
		.replace(/[।॥]/gu, " ")
		.replace(/\s+/gu, " ")
		.trim();

	const latinSeparated = value
		.replace(/\s*\([^()]*\)/gu, " ")
		.match(/[A-Za-z]/gu);
	const residualLatin = latinSeparated ? latinSeparated.join("") : "";

	const devanagariOnly = value
		.replace(/[A-Za-z]+/gu, " ")
		.replace(/\s+/gu, " ")
		.trim();

	return { devanagari: value, devanagariClean: devanagariOnly, residualLatin };
}

function loadLegacyNames() {
	if (existsSync(LEGACY_CACHE)) {
		return JSON.parse(readFileSync(LEGACY_CACHE, "utf8"));
	}

	const blob = execFileSync("git", ["show", LEGACY_REF], {
		cwd: ROOT,
		maxBuffer: 100 * 1024 * 1024,
	});
	const parsed = JSON.parse(blob.toString("utf8").replace(/^\uFEFF/u, ""));
	const names = parsed.map((entry) => ({
		index: Number(entry.index),
		hindi_name: String(entry.hindi_name ?? "").trim(),
	}));

	mkdirSync(dirname(LEGACY_CACHE), { recursive: true });
	writeFileSync(
		LEGACY_CACHE,
		`${JSON.stringify(names, null, 1)}\n`,
		"utf8",
	);
	return names;
}

function uniqueStrings(values) {
	const seen = new Set();
	const output = [];
	for (const value of values) {
		const key = value.toLocaleLowerCase("en");
		if (!key || seen.has(key)) {
			continue;
		}
		seen.add(key);
		output.push(value);
	}
	return output;
}

function csvEscape(value) {
	const text = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
	if (/[",\n]/u.test(text)) {
		return `"${text.replace(/"/gu, '""')}"`;
	}
	return text;
}

function main() {
	const current = JSON.parse(readFileSync(CURRENT_DATA, "utf8"));
	const legacy = loadLegacyNames();
	const overrides = loadOverrides();

	if (current.length !== legacy.length) {
		throw new Error(
			`Data length mismatch: current=${current.length}, legacy=${legacy.length}`,
		);
	}

	const rows = current.map((entry, offset) => {
		const number = Number(entry.index);
		const legacyEntry = legacy[offset];

		if (Number(legacyEntry.index) !== number) {
			throw new Error(
				`Legacy index mismatch at offset ${offset}: expected ${number}, found ${legacyEntry.index}`,
			);
		}

		const cleaned = cleanupDevanagari(
			overrides[String(number)]?.devanagari ?? legacyEntry.hindi_name,
		);
		const iastRaw = devanagariToIast(cleaned.devanagariClean);
		const iast = titleCaseWords(iastRaw);
		const readableRaw = iastToReadable(iastRaw);
		const readableWRaw = iastToReadableWithW(iastRaw);
		const simpleRaw = iastToSimple(iastRaw);
		const spellingCommon =
			overrides[String(number)]?.spelling_common ?? titleCaseWords(readableRaw);
		const spellingWithW = titleCaseWords(readableWRaw);
		const spellingWithGy = titleCaseWords(readableRaw.replace(/jn/gu, "gy"));
		const spellingSimple = titleCaseWords(simpleRaw);
		const spellingSite = String(entry.english_name ?? "").trim();

		const variants = uniqueStrings([
			spellingSimple !== spellingCommon ? spellingSimple : "",
			spellingWithW !== spellingCommon ? spellingWithW : "",
			spellingWithGy !== spellingCommon ? spellingWithGy : "",
			spellingCommon.replace(/\s+/gu, "") !== spellingCommon
				? spellingCommon.replace(/\s+/gu, "")
				: "",
			iast,
			spellingSite,
		]).filter((variant) => variant.toLocaleLowerCase("en") !== spellingCommon.toLocaleLowerCase("en"));

		const match = validateAgainstElaboration(
			`${entry.english_one_line}\n${entry.english_elaboration}`,
			[spellingCommon, spellingWithW, spellingWithGy, spellingSimple, spellingSite],
		);

		const flags = [];
		if (cleaned.devanagariClean === "") {
			flags.push("empty-devanagari");
		}
		if (cleaned.residualLatin !== "") {
			flags.push("residual-latin");
		}
		if (match === "missing") {
			flags.push("no-text-match");
		}

		return {
			number,
			overridden: Object.hasOwn(overrides, String(number)),
			spelling_site: spellingSite,
			spelling_common: spellingCommon,
			spelling_simple: spellingSimple,
			iast,
			devanagari: cleaned.devanagariClean,
			variants,
			match,
			flags,
			meaning: String(entry.english_one_line ?? "").trim(),
			slug: slugify(spellingCommon),
		};
	});

	// Names repeat in the Sahasranama; identical Devanagari means one shared page.
	const groupOrder = [];
	const groups = new Map();
	for (const row of rows) {
		const key = row.devanagari === "" ? `__row-${row.number}` : row.devanagari;
		if (!groups.has(key)) {
			groups.set(key, {
				key,
				primaryNumber: row.number,
				numbers: [],
			});
			groupOrder.push(key);
		}
		groups.get(key).numbers.push(row.number);
	}

	// Assign URL slugs, disambiguating different spellings that collapse to one slug.
	const usedSlugs = new Map();
	const pageGroups = [];
	for (const key of groupOrder) {
		const group = groups.get(key);
		const primaryRow = rows[group.primaryNumber - 1];
		let slug = primaryRow.slug || `name-${group.primaryNumber}`;
		let suffix = 2;
		while (usedSlugs.has(slug)) {
			slug = `${primaryRow.slug || "name"}-${suffix}`;
			suffix += 1;
		}
		usedSlugs.set(slug, group.primaryNumber);

		const members = group.numbers.map((number) => rows[number - 1]);
		for (const row of members) {
			row.page_slug = slug;
		}

		pageGroups.push({
			slug,
			primaryNumber: group.primaryNumber,
			numbers: group.numbers,
			spelling_common: primaryRow.spelling_common,
			spelling_site: primaryRow.spelling_site,
			spelling_simple: primaryRow.spelling_simple,
			iast: primaryRow.iast,
			devanagari: primaryRow.devanagari,
			variants: primaryRow.variants,
			meaning: primaryRow.meaning,
		});
	}

	const output = {
		generatedFrom: {
			englishData: "sahasranama_meanings.json",
			devanagariSource:
				"legacy field hindi_name, commit 824a649 (cached in seo/data)",
			overrides: "seo/data/name-overrides.json",
		},
		totalNames: rows.length,
		uniquePages: pageGroups.length,
		rows,
		pageGroups,
	};

	mkdirSync(dirname(MAPPING_OUT), { recursive: true });
	writeFileSync(MAPPING_OUT, `${JSON.stringify(output, null, 1)}\n`, "utf8");

	const csvHeader = [
		"number",
		"page_slug",
		"overridden",
		"spelling_site",
		"spelling_common",
		"spelling_simple",
		"iast",
		"devanagari",
		"variants",
		"meaning",
		"match",
		"flags",
	];
	const csvLines = [csvHeader.join(",")];
	for (const row of rows) {
		csvLines.push(
			[
				row.number,
				row.page_slug,
				row.overridden ? "yes" : "",
				row.spelling_site,
				row.spelling_common,
				row.spelling_simple,
				row.iast,
				row.devanagari,
				row.variants,
				row.meaning,
				row.match,
				row.flags.join(" "),
			]
				.map(csvEscape)
				.join(","),
		);
	}
	writeFileSync(CSV_OUT, `${csvLines.join("\n")}\n`, "utf8");

	const stats = {
		rows: rows.length,
		uniquePages: pageGroups.length,
		duplicateGroups: pageGroups.filter((group) => group.numbers.length > 1).length,
		extraPositions: pageGroups.reduce(
			(total, group) => total + group.numbers.length - 1,
			0,
		),
		matchFound: rows.filter((row) => row.match === "found").length,
		matchMissing: rows.filter((row) => row.match === "missing").length,
		overridesApplied: rows.filter((row) => row.overridden).length,
		flagged: rows.filter((row) => row.flags.length > 0).length,
	};
	console.log(JSON.stringify(stats, null, 1));

	console.log("\nNo-text-match rows:");
	for (const row of rows.filter((row) => row.match === "missing")) {
		console.log(
			`  ${row.number}\t${row.spelling_site}\t${row.spelling_common}\t${row.iast}\t${row.devanagari}\t${row.meaning.slice(0, 60)}`,
		);
	}

	console.log("\nSample rows:");
	for (const row of [
		rows[0],
		rows[1],
		rows[2],
		rows[9],
		rows[98],
		rows[99],
		rows[213],
		rows[499],
		rows[899],
		rows[1071],
	]) {
		console.log(
			`  ${row.number}\t${row.spelling_site}\t->\t${row.spelling_common}\t|\t${row.iast}\t|\t${row.devanagari}\t|\t${row.variants.join(" ; ")}`,
		);
	}
}

main();
