// Devanagari -> IAST -> ASCII spelling converters used to build the
// per-name SEO mapping. Deliberately dependency-free so the mapping and the
// generated pages can be rebuilt offline from repo data.

const INDEPENDENT_VOWELS = {
	"अ": "a",
	"आ": "ā",
	"इ": "i",
	"ई": "ī",
	"उ": "u",
	"ऊ": "ū",
	"ऋ": "ṛ",
	"ॠ": "ṝ",
	"ऌ": "ḷ",
	"ॡ": "ḹ",
	"ए": "e",
	"ऐ": "ai",
	"ओ": "o",
	"औ": "au",
	"ऍ": "æ",
	"ऑ": "o",
	"ॲ": "æ",
};

const VOWEL_SIGNS = {
	"ा": "ā",
	"ि": "i",
	"ी": "ī",
	"ु": "u",
	"ू": "ū",
	"ृ": "ṛ",
	"ॄ": "ṝ",
	"ॢ": "ḷ",
	"ॣ": "ḹ",
	"े": "e",
	"ै": "ai",
	"ो": "o",
	"ौ": "au",
	"ॉ": "o",
	"ॅ": "æ",
};

const CONSONANTS = {
	"क": "k",
	"ख": "kh",
	"ग": "g",
	"घ": "gh",
	"ङ": "ṅ",
	"च": "c",
	"छ": "ch",
	"ज": "j",
	"झ": "jh",
	"ञ": "ñ",
	"ट": "ṭ",
	"ठ": "ṭh",
	"ड": "ḍ",
	"ढ": "ḍh",
	"ण": "ṇ",
	"त": "t",
	"थ": "th",
	"द": "d",
	"ध": "dh",
	"न": "n",
	"प": "p",
	"फ": "ph",
	"ब": "b",
	"भ": "bh",
	"म": "m",
	"य": "y",
	"र": "r",
	"ल": "l",
	"व": "v",
	"श": "ś",
	"ष": "ṣ",
	"स": "s",
	"ह": "h",
	"ळ": "ḷ",
	"ॐ": "oṃ",
};

// Consonants that only exist as a base + nukta combination.
const NUKTA_CONSONANTS = {
	"क\u093C": "q",
	"ख\u093C": "ḵẖ",
	"ग\u093C": "ġ",
	"ज\u093C": "z",
	"ड\u093C": "ṛ",
	"ढ\u093C": "ṛh",
	"फ\u093C": "f",
	"य\u093C": "ẏ",
};

const DEVANAGARI_DIGITS = "०१२३४५६७८९";

const KEPT_PUNCTUATION = new Set([
	" ",
	"-",
	"–",
	"—",
	",",
	".",
	";",
	":",
	"'",
	'"',
	"(",
	")",
	"[",
	"]",
	"/",
	"’",
	"‘",
]);

export function devanagariToIast(input) {
	if (typeof input !== "string") {
		return "";
	}

	const chars = Array.from(input.normalize("NFC"));
	let output = "";
	let index = 0;

	while (index < chars.length) {
		const char = chars[index];

		// Invisible joiners are typographic noise for our purposes.
		if (char === "\u200C" || char === "\u200D" || char === "\uFEFF") {
			index += 1;
			continue;
		}

		if (char === "\u093C") {
			// Stray nukta; the consonant branch consumes valid pairs.
			index += 1;
			continue;
		}

		if (Object.hasOwn(INDEPENDENT_VOWELS, char)) {
			output += INDEPENDENT_VOWELS[char];
			index += 1;
			continue;
		}

		if (Object.hasOwn(CONSONANTS, char)) {
			let consonantKey = char;
			let step = 1;

			if (chars[index + 1] === "\u093C") {
				const withNukta = char + "\u093C";
				if (Object.hasOwn(NUKTA_CONSONANTS, withNukta)) {
					output += NUKTA_CONSONANTS[withNukta] + "a";
					index += 2;
					continue;
				}
			}

			output += CONSONANTS[consonantKey] + "a";
			index += step;

			const next = chars[index];
			if (next === "\u094D") {
				// Virama drops the inherent "a".
				output = output.slice(0, -1);
				index += 1;
				continue;
			}
			if (Object.hasOwn(VOWEL_SIGNS, next)) {
				output = output.slice(0, -1) + VOWEL_SIGNS[next];
				index += 1;
			}
			continue;
		}

		if (char === "\u0902") {
			output += "ṃ";
			index += 1;
			continue;
		}
		if (char === "\u0901") {
			output += "m\u0310";
			index += 1;
			continue;
		}
		if (char === "\u0903") {
			output += "ḥ";
			index += 1;
			continue;
		}
		if (char === "\u093D") {
			output += "'";
			index += 1;
			continue;
		}
		if (char === "\u0964" || char === "\u0965") {
			output += ".";
			index += 1;
			continue;
		}
		if (DEVANAGARI_DIGITS.includes(char)) {
			output += String(DEVANAGARI_DIGITS.indexOf(char));
			index += 1;
			continue;
		}
		if (KEPT_PUNCTUATION.has(char) || /^[\s]$/u.test(char)) {
			output += char;
			index += 1;
			continue;
		}

		// Vedic accents and any other marks are dropped.
		index += 1;
	}

	return output.replace(/\s+/gu, " ").trim();
}

const IAST_TO_READABLE = {
	"ā": "a",
	"ī": "i",
	"ū": "u",
	"ṝ": "ri",
	"ṛ": "ri",
	"ḹ": "l",
	"ḷ": "l",
	"ṃ": "m",
	"ḥ": "h",
	"ṅ": "n",
	"ñ": "n",
	"ṭ": "t",
	"ḍ": "d",
	"ṇ": "n",
	"ś": "sh",
	"ṣ": "sh",
};

const IAST_TO_SIMPLE = {
	"ā": "a",
	"ī": "i",
	"ū": "u",
	"ṝ": "r",
	"ṛ": "r",
	"ḹ": "l",
	"ḷ": "l",
	"ṃ": "m",
	"ḥ": "h",
	"ṅ": "n",
	"ñ": "n",
	"ṭ": "t",
	"ḍ": "d",
	"ṇ": "n",
	"ś": "s",
	"ṣ": "s",
};

const IAST_CHAR_RE = /[āīūṝṛḹḷṃḥṅñṭḍṇśṣ]/gu;

export function stripAvagraha(input) {
	return input.replace(/['\u2019]/gu, "");
}

function applyIastMap(input, map, readable) {
	const chars = Array.from(input.replace(/\u0310/gu, "")); // drop candrabindu mark
	let output = "";

	for (let index = 0; index < chars.length; index += 1) {
		const char = chars[index];

		if (readable && char === "c") {
			// IAST "c" (च) is normally written "ch" in English; "ch" (छ) becomes "chh".
			if (chars[index + 1] === "h") {
				output += "chh";
				index += 1;
			} else {
				output += "ch";
			}
			continue;
		}

		if (readable && char === "ṃ") {
			// Anusvara assimilation, matching common English Sanskrit spelling:
			// "Narasimha", "samsara", "vamsha", "sankalpa", "taranga", "kunjeshvara".
			let lookahead = index + 1;
			while (
				lookahead < chars.length &&
				!chars[lookahead].match(/\p{L}/u) &&
				chars[lookahead] !== " "
			) {
				lookahead += 1;
			}
			const next = chars[lookahead] ?? " ";
			// Follows the site's own convention and common English usage:
			// m before labials/h/स, n before श/ष and the stop classes.
			const keepsM = next === " " || /[pbhmsyrlv]/u.test(next);
			output += keepsM ? "m" : "n";
			continue;
		}

		output += map[char] ?? char;
	}

	return output.replace(/['\u2019]/gu, "");
}

export function iastToReadable(input) {
	return applyIastMap(input, IAST_TO_READABLE, true);
}

export function iastToReadableWithW(input) {
	return applyIastMap(input, IAST_TO_READABLE, true).replace(/shv/gu, "shw");
}

export function iastToSimple(input) {
	return applyIastMap(input, IAST_TO_SIMPLE, false);
}

export function titleCaseWords(input) {
	return input
		.split(/\s+/u)
		.filter(Boolean)
		.map((word) =>
			word
				.split("-")
				.map((part) => {
					const match = part.match(/^([^\p{L}]*)(\p{L})(.*)$/u);
					if (!match) {
						return part;
					}
					return `${match[1]}${match[2].toLocaleUpperCase("en")}${match[3]}`;
				})
				.join("-"),
		)
		.join(" ");
}

export function slugify(input) {
	const ascii = input
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/gu, "")
		.toLocaleLowerCase("en")
		.replace(/['’]/gu, "")
		.replace(/[^a-z0-9]+/gu, "-")
		.replace(/^-+|-+$/gu, "");
	return ascii;
}

export { IAST_CHAR_RE };
