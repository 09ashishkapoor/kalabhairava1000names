import test from "node:test";
import assert from "node:assert/strict";

import { getStaticNamesData, getPothiIndex } from "../src/lib/staticNames.js";
import {
	SET_SIZE,
	parseElaboration,
	toDevanagariNumber,
	toDevanagariRange,
	withDropCap,
} from "../src/lib/pothi.js";

const data = getStaticNamesData();

test("the book is 1,000 names in ten ranges", () => {
	assert.equal(data.totalCount, 1000);
	assert.equal(data.ranges.length, 10);
	for (const range of data.ranges) {
		assert.equal(range.entries.length, 100);
		assert.equal(range.entries[0].index, range.start);
		assert.equal(range.entries[range.entries.length - 1].index, range.end);
	}
});

test("sets of eleven are derived, not hard-coded", () => {
	assert.equal(SET_SIZE, 11);
	assert.equal(data.totalSets, Math.ceil(data.totalCount / SET_SIZE));
	assert.equal(data.totalSets, 91);
	assert.equal(data.sets.length, 91);
	assert.equal(data.sets[0].entries.length, 11);
	assert.equal(data.sets[90].entries.length, 10);
	assert.equal(data.sets[90].start, 991);
	assert.equal(data.sets[90].end, 1000);
});

test("every position has Devanagari, IAST, a one-line meaning and a page", () => {
	const index = getPothiIndex();
	assert.equal(index.length, 1000);
	for (const row of index) {
		assert.ok(row[0] >= 1 && row[0] <= 1000, "position");
		assert.ok(row[1] && /[\u0900-\u097F]/.test(row[1]), "Devanagari");
		assert.ok(row[2], "IAST");
		assert.ok(row[3], "common spelling");
		assert.ok(row[5], "meaning");
		assert.ok(row[6], "slug");
	}
});

test("the first name is भैरवाय / Bhairavāya", () => {
	const first = data.sets[0].entries[0];
	assert.equal(first.devanagari, "भैरवाय");
	assert.equal(first.iast, "Bhairavāya");
	assert.equal(first.spelling_common, "Bhairavaya");
	assert.equal(first.english_one_line, "Salutations To The one who is terrifying and destroys fear.");
});

test("elaboration parsing keeps the words and marks the section headings", () => {
	const blocks = parseElaboration(data.sets[0].entries[0].english_elaboration);
	assert.ok(blocks.length > 3);
	assert.equal(blocks[0].type, "p");
	assert.match(blocks[0].text, /^The name Bhairava/);
	const headings = blocks.filter((block) => block.type === "h3").map((block) => block.text);
	assert.ok(headings.includes("Terrifying and Formidable (The Fierce Aspect)"));
	assert.ok(headings.includes("Destroying Fear (The Benevolent Aspect)"));
	assert.ok(!blocks.some((block) => block.text === "-"), "trailing dash artifact removed");
	const words = blocks.map((block) => block.text).join(" ");
	assert.ok(words.includes('"frightful," "terrible," or "formidable."'));
});

test("the drop cap lands on the first paragraph only", () => {
	const blocks = withDropCap(parseElaboration(data.sets[0].entries[0].english_elaboration));
	assert.equal(blocks.filter((block) => block.drop).length, 1);
	assert.equal(blocks.find((block) => block.drop).type, "p");
});

test("Devanagari numerals for the range titles", () => {
	assert.equal(toDevanagariNumber(1), "१");
	assert.equal(toDevanagariNumber(100), "१००");
	assert.equal(toDevanagariNumber(901), "९०१");
	assert.equal(toDevanagariRange(1, 100), "१–१००");
	assert.equal(toDevanagariRange(901, 1000), "९०१–१०००");
});
