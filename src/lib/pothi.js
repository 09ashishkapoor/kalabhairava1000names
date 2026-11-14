// Shared Pothi helpers. These run at build time for the server-rendered
// pages and are mirrored (small, deliberately) in public/pothi-reader.js for
// the sets the reader loads after the first one.

export const SET_SIZE = 11;

const DEVANAGARI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

/** 1 -> "१", 100 -> "१००", 901 -> "९०१". */
export function toDevanagariNumber(value) {
	return String(value).replace(/\d/g, (digit) => DEVANAGARI_DIGITS[Number(digit)]);
}

/** "1–100" (the URL/title label) -> "१–१००" (the displayed title). */
export function toDevanagariRange(start, end) {
	return `${toDevanagariNumber(start)}–${toDevanagariNumber(end)}`;
}

/** Two-digit folio, e.g. 1 -> "01", 901 -> "901". */
export function folio(value) {
	return String(value).padStart(2, "0");
}

function cleanLine(line) {
	return line
		.replace(/\r/g, "")
		.replace(/^\s*>\s?/, "")
		.trim();
}

function isHeading(line) {
	if (!line || line.length > 90) return false;
	if (/^[-–—•>#*]/.test(line)) return false;
	if (/[.!?;…]$/.test(line)) return false;
	if (/^[a-z]/.test(line)) return false;
	if (/^\d+[.)]\s/.test(line)) return false;

	// A short label ending in a colon is a section label ("The Etymology:").
	if (line.endsWith(":")) return line.length <= 60;

	// A single word can be a section title ("Synthesis"), but not a numeral.
	return line.split(/\s+/).length >= 2 || /[A-Za-zĀ-ž]{3,}/.test(line);
}

/**
 * Turn the chunk's `english_elaboration` text into display blocks without
 * changing a single word. The source uses a blank line between blocks, a
 * heading and its paragraph joined by one newline, and a trailing "-" artifact.
 *
 * Returns [{ type: "p" | "h3", text }].
 */
export function parseElaboration(value) {
	if (typeof value !== "string" || !value.trim()) return [];

	const blocks = value
		.replace(/\r\n/g, "\n")
		.split(/\n\s*\n+/)
		.map((block) => block.trim())
		.filter(Boolean);

	const out = [];

	for (const block of blocks) {
		// The data ends every elaboration with a bare "-" separator line.
		if (/^[-–—•]+$/.test(block)) continue;

		const lines = block
			.split("\n")
			.map(cleanLine)
			.filter(Boolean);

		if (lines.length === 0) continue;

		if (isHeading(lines[0])) {
			out.push({ type: "h3", text: lines[0] });
			if (lines.length > 1) {
				out.push({ type: "p", text: lines.slice(1).join(" ") });
			}
			continue;
		}

		out.push({ type: "p", text: lines.join(" ") });
	}

	return out;
}

/** First paragraph gets the drop cap; the rest keep the measured prose. */
export function withDropCap(blocks) {
	let used = false;
	return blocks.map((block) => {
		if (!used && block.type === "p") {
			used = true;
			return { ...block, drop: true };
		}
		return block;
	});
}
