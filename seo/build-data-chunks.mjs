// Generates the homepage reader data artifacts (manifest + 200-entry chunks) from
// the canonical Kalabhairava dataset.
//
// Run: node seo/build-data-chunks.mjs
// Input:  sahasranama_meanings.json
// Output: public/data_manifest.json, public/data_chunk_1..5.json

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SOURCE_PATH = join(ROOT, "sahasranama_meanings.json");
const MANIFEST_PATH = join(ROOT, "public", "data_manifest.json");

const CHUNK_SIZE = 200;

function main() {
	const data = JSON.parse(readFileSync(SOURCE_PATH, "utf8"));
	if (!Array.isArray(data) || data.length !== 1000) {
		throw new Error(`Expected 1,000 entries, found ${Array.isArray(data) ? data.length : "non-array"}`);
	}
	for (const entry of data) {
		for (const field of ["index", "english_name", "english_one_line", "english_elaboration"]) {
			if (entry[field] === undefined || entry[field] === "") {
				throw new Error(`Entry ${entry.index} is missing ${field}`);
			}
		}
	}

	const fileNames = [];
	let chunkIndex = 0;
	for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
		chunkIndex += 1;
		const fileName = `data_chunk_${chunkIndex}.json`;
		fileNames.push(fileName);
		writeFileSync(
			join(ROOT, "public", fileName),
			`${JSON.stringify(data.slice(offset, offset + CHUNK_SIZE))}\n`,
			"utf8",
		);
	}

	const manifest = {
		total: data.length,
		chunks: chunkIndex,
		chunk_size: CHUNK_SIZE,
		files: fileNames,
	};
	writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
	console.log(`wrote manifest + ${fileNames.length} chunks (${data.length} entries)`);
}

main();
