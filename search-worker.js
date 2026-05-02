// search-worker.js
// Lightweight worker: builds a lowercase index and responds to search requests.
self._data = [];
self._index = [];

// Normalize diacritics so plain ASCII queries match Sanskrit transliteration.
// e.g. "kala" matches "Kāla", "bhairava" matches "Bhairavā"
function normalize(str) {
	return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

self.onmessage = (ev) => {
	const msg = ev.data;
	if (!msg) return;

	if (msg.cmd === "index") {
		self._data = msg.data || [];
		self._index = self._data.map((item) => ({
			index: item.index,
			english_name: normalize((item.english_name || "").toLowerCase()),
			english_one_line: normalize((item.english_one_line || "").toLowerCase()),
			english_elaboration: normalize(
				(
					item.english_elaboration_excerpt ||
					item.english_elaboration ||
					""
				).toLowerCase(),
			),
		}));
		return;
	}

	if (msg.cmd === "search") {
		const rawQ = (msg.query || "").trim();
		const reqId = msg.reqId;

		if (!rawQ) {
			const all = self._data.map((d) => d.index);
			postMessage({ type: "results", reqId, results: all });
			return;
		}

		// #5 Exact numeric index match
		const numericQ = /^\d+$/.test(rawQ) ? parseInt(rawQ, 10) : null;

		// #3 Multi-word AND: normalize and split query into tokens
		const tokens = normalize(rawQ.toLowerCase()).split(/\s+/).filter(Boolean);

		// Field priority scores for ranking (#2)
		// Higher score = more relevant
		const SCORE = { name: 3, one_line: 2, elaboration: 1 };

		const scored = [];
		const idx = self._index || [];

		for (let i = 0; i < idx.length; i++) {
			const row = idx[i];

			// #5 Exact numeric match
			if (numericQ !== null) {
				if (row.index === numericQ)
					scored.push({ index: row.index, score: 10 });
				continue;
			}

			// #3 All tokens must match at least one English field (AND logic)
			let totalScore = 0;
			let allTokensMatch = true;

			for (const token of tokens) {
				let tokenScore = 0;
				if (row.english_name.includes(token))
					tokenScore = Math.max(tokenScore, SCORE.name);
				if (row.english_one_line.includes(token))
					tokenScore = Math.max(tokenScore, SCORE.one_line);
				if (row.english_elaboration.includes(token))
					tokenScore = Math.max(tokenScore, SCORE.elaboration);

				if (tokenScore === 0) {
					allTokensMatch = false;
					break;
				}
				totalScore += tokenScore;
			}

			if (allTokensMatch && totalScore > 0) {
				scored.push({ index: row.index, score: totalScore });
			}
		}

		// #2 Sort by score descending (highest relevance first)
		scored.sort((a, b) => b.score - a.score);

		postMessage({
			type: "results",
			reqId,
			results: scored.map((r) => r.index),
		});
	}
};
