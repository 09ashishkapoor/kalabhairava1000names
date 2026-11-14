import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SET_SIZE } from "./pothi.js";

const SITE_URL = "https://bhairavakalikenamosthute.com";
const MANIFEST_PATH = join(process.cwd(), "public", "data_manifest.json");
const MAPPING_PATH = join(process.cwd(), "src", "data", "name-mapping.json");

let cachedStaticNamesData = null;
let cachedNameMapping = null;

function splitIntoParagraphs(value) {
	if (typeof value !== "string") {
		return [];
	}

	return value
		.split(/\r?\n\s*\r?\n+/)
		.map((paragraph) => paragraph.trim())
		.filter(Boolean);
}

function loadDataManifest() {
	const manifestText = readFileSync(MANIFEST_PATH, "utf8");
	const manifest = JSON.parse(manifestText);

	if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
		throw new Error("Invalid data_manifest.json: files[] is required.");
	}

	return manifest;
}

function loadChunkFile(fileName) {
	const chunkPath = join(process.cwd(), "public", fileName);
	const chunkText = readFileSync(chunkPath, "utf8");
	return JSON.parse(chunkText);
}

function loadNameMapping() {
	if (cachedNameMapping) {
		return cachedNameMapping;
	}

	cachedNameMapping = JSON.parse(readFileSync(MAPPING_PATH, "utf8"));
	return cachedNameMapping;
}

/**
 * Returns the generated name-spelling mapping (one row per Sahasranama
 * position, plus one pageGroup per unique name page).
 * Source: seo/build-name-mapping.mjs.
 */
export function getNameMapping() {
	return loadNameMapping();
}

export function getNamePageGroups() {
	return loadNameMapping().pageGroups;
}

function enrichEntry(entry) {
	return {
		...entry,
		index: Number(entry.index),
		english_elaboration_paragraphs: splitIntoParagraphs(
			entry.english_elaboration,
		),
	};
}

function buildRangeMetadata(entries, rangeNumber, totalRanges) {
	const first = entries[0];
	const last = entries[entries.length - 1];
	const start = first.index;
	const end = last.index;
	const slug = `${start}-${end}`;
	const path = `/names/${slug}/`;

	return {
		slug,
		path,
		canonical: `${SITE_URL}${path}`,
		start,
		end,
		count: entries.length,
		label: `${start}-${end}`,
		displayLabel: `${start}–${end}`,
		title: `Kalabhairava Names ${start}-${end} | 1000 Names of Kalabhairava`,
		description: `Read Kalabhairava Sahasranama names ${start}-${end}, from ${first.english_name} to ${last.english_name}, with English meanings and elaborations.`,
		heading: `Kalabhairava Names ${start}-${end}`,
		firstName: {
			index: first.index,
			english: first.english_name,
		},
		lastName: {
			index: last.index,
			english: last.english_name,
		},
		rangeNumber,
		totalRanges,
	};
}

export function getStaticNamesData() {
	if (cachedStaticNamesData) {
		return cachedStaticNamesData;
	}

	const manifest = loadDataManifest();
	const mapping = loadNameMapping();
	const mappingRowByNumber = new Map(
		mapping.rows.map((row) => [Number(row.number), row]),
	);
	const allEntries = manifest.files
		.flatMap((fileName) => loadChunkFile(fileName))
		.map((entry) => {
			const row = mappingRowByNumber.get(Number(entry.index)) ?? {};
			return {
				...enrichEntry(entry),
				page_slug: row.page_slug ?? null,
				devanagari: row.devanagari ?? "",
				iast: row.iast ?? "",
				spelling_common: row.spelling_common ?? entry.english_name,
				spelling_site: row.spelling_site ?? entry.english_name,
				variants: Array.isArray(row.variants) ? row.variants : [],
			};
		})
		.sort((a, b) => a.index - b.index);

	const rangeSize = 100;
	const ranges = [];

	for (let offset = 0; offset < allEntries.length; offset += rangeSize) {
		const entries = allEntries.slice(offset, offset + rangeSize);
		ranges.push({ entries });
	}

	const totalRanges = ranges.length;

	const rangesWithMetadata = ranges.map((range, index) => {
		const metadata = buildRangeMetadata(range.entries, index + 1, totalRanges);
		return {
			...metadata,
			entries: range.entries,
		};
	});

	// The reader is bound by the text, not by a hard-coded set count:
	// 1,000 positions in sets of eleven -> 91 sets, the last one short.
	const sets = [];
	for (let offset = 0; offset < allEntries.length; offset += SET_SIZE) {
		const entries = allEntries.slice(offset, offset + SET_SIZE);
		sets.push({
			index: sets.length,
			number: sets.length + 1,
			entries,
			start: entries[0].index,
			end: entries[entries.length - 1].index,
			label: `${entries[0].index}–${entries[entries.length - 1].index}`,
		});
	}

	const pothiIndex = allEntries.map((entry) => [
		entry.index,
		entry.devanagari,
		entry.iast,
		entry.spelling_common,
		entry.spelling_site,
		entry.english_one_line,
		entry.page_slug,
	]);

	cachedStaticNamesData = {
		siteUrl: SITE_URL,
		totalCount: allEntries.length,
		namePages: mapping.pageGroups,
		entries: allEntries,
		sets,
		totalSets: sets.length,
		pothiIndex,
		chunkSize: Number(manifest.chunk_size) || 200,
		chunkCount: manifest.files.length,
		hub: {
			path: "/names/",
			canonical: `${SITE_URL}/names/`,
			title: "Kalabhairava 1000 Names by Range | 1000 Names of Kalabhairava",
			description:
				"Browse all 1000 Kalabhairava names in crawlable static ranges with direct links to each English name and meaning.",
		},
		ranges: rangesWithMetadata,
	};

	return cachedStaticNamesData;
}

export function getStaticRangeBySlug(slug) {
	const { ranges } = getStaticNamesData();
	return ranges.find((range) => range.slug === slug) ?? null;
}

export function getRangeNavigation(slug) {
	const { ranges } = getStaticNamesData();
	const currentIndex = ranges.findIndex((range) => range.slug === slug);

	if (currentIndex === -1) {
		return { previous: null, next: null };
	}

	return {
		previous: ranges[currentIndex - 1] ?? null,
		next: ranges[currentIndex + 1] ?? null,
	};
}

export function getPothiSets() {
	return getStaticNamesData().sets;
}

export function getPothiIndex() {
	return getStaticNamesData().pothiIndex;
}

export { splitIntoParagraphs };
