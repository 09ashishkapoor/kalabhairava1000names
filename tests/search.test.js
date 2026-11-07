const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadSearchEntries() {
	const scriptPath = path.join(__dirname, "..", "public", "search.js");
	const source = fs
		.readFileSync(scriptPath, "utf8")
		.replace("export function searchEntries", "function searchEntries");
	const context = {};
	vm.runInNewContext(
		`${source}\nthis.searchEntries = searchEntries;`,
		context,
		{
			filename: "search.js",
		},
	);
	return context.searchEntries;
}

const searchEntries = loadSearchEntries();

function createEntry(index, overrides = {}) {
	return {
		index,
		english_name: "",
		english_one_line: "",
		english_elaboration: "",
		...overrides,
	};
}

function testEmptyQueryReturnsOriginalData() {
	const entries = [createEntry(1, { english_name: "Adya" })];
	assert.strictEqual(
		searchEntries(entries, ""),
		entries,
		"empty query should return original array",
	);
}

function testTitleMatchesRankAboveBodyMatches() {
	const titleMatch = createEntry(1, { english_name: "Om Kali" });
	const bodyMatch = createEntry(2, {
		english_name: "Another Name",
		english_one_line: "Contains Om in description",
	});

	const results = searchEntries([bodyMatch, titleMatch], "om");

	assert.deepStrictEqual(
		results.map((entry) => entry.index),
		[1, 2],
		"title match should rank before body match",
	);
}

function testFuzzyNameMatchKeepsEntrySearchable() {
	const fuzzyEntry = createEntry(1, { english_name: "Mahakali" });
	const exactEntry = createEntry(2, { english_name: "Durga" });

	const results = searchEntries([exactEntry, fuzzyEntry], "mhkl");

	assert.deepStrictEqual(
		results.map((entry) => entry.index),
		[1],
		"fuzzy title match should still return entry",
	);
}

testEmptyQueryReturnsOriginalData();
testTitleMatchesRankAboveBodyMatches();
testFuzzyNameMatchKeepsEntrySearchable();
console.log("search.js regression tests passed");
