function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[-–—]/g, '');
}

function tokenize(query) {
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean);
}

function wordMatchScore(text, token, weight) {
  if (!text) return 0;

  const words = text.match(/\b\w+\b/g) || [];

  for (const word of words) {
    if (word === token) return weight * 4;
    if (word.startsWith(token)) return weight * 2.5;
  }

  return 0;
}

function fuzzyMatch(text, token) {
  let textIndex = 0;
  let matches = 0;

  for (let i = 0; i < token.length; i++) {
    textIndex = text.indexOf(token[i], textIndex);
    if (textIndex === -1) return false;
    matches += 1;
    textIndex += 1;
  }

  return matches / token.length >= 0.7;
}

function scoreField(text, tokens, weight, isBody = false) {
  let score = 0;

  for (const token of tokens) {
    if (!text) continue;

    const index = text.indexOf(token);
    const wordScore = wordMatchScore(text, token, weight);
    if (wordScore > 0) {
      score += wordScore;
      continue;
    }

    if (index !== -1) {
      if (isBody) {
        const wordBoundary = new RegExp(`\\b${token}\\b`, 'i');

        if (token.length <= 2) {
          score += wordBoundary.test(text) ? weight * 1.0 : weight * 0.05;
        } else {
          const positionFactor = 1 - Math.min(index / text.length, 0.95);
          score += weight * (0.5 + positionFactor * positionFactor * 2);
        }

        break;
      }

      score += weight * 1.5;
      continue;
    }

    if (!isBody && weight === 100 && token.length >= 2 && fuzzyMatch(text, token)) {
      score += weight * 0.2;
    }
  }

  return score;
}

function hasWholeWord(text, token) {
  if (!text) return false;
  return new RegExp(`\\b${token}\\b`, 'i').test(text);
}

function hasWordPrefix(text, token) {
  if (!text) return false;
  return new RegExp(`\\b${token}`, 'i').test(text);
}

function getEntryFields(entry) {
  return {
    name: normalize(entry.english_name),
    oneLine: normalize(entry.english_one_line),
    elaboration: normalize(entry.english_elaboration)
  };
}

function collectMatchSignals(fields, token) {
  const titleHasWhole = hasWholeWord(fields.name, token);
  const titleHasPrefix = hasWordPrefix(fields.name, token);
  const titleHasContains = fields.name.includes(token);
  const bodyHasWhole = hasWholeWord(fields.oneLine, token) || hasWholeWord(fields.elaboration, token);
  const bodyHasPrefix = hasWordPrefix(fields.oneLine, token) || hasWordPrefix(fields.elaboration, token);
  const bodyHasContains = fields.oneLine.includes(token) || fields.elaboration.includes(token);

  return {
    strictMatch: titleHasWhole || titleHasPrefix || bodyHasWhole || bodyHasPrefix,
    fuzzyMatch: token.length >= 2 && fuzzyMatch(fields.name, token),
    bucket: titleHasWhole || titleHasPrefix || titleHasContains
      ? 0
      : bodyHasWhole
        ? 1
        : bodyHasContains
          ? 2
          : 99,
    score:
      scoreField(fields.name, [token], 100, false) +
      scoreField(fields.oneLine, [token], 40, false) +
      scoreField(fields.elaboration, [token], 10, true)
  };
}

export function searchEntries(data, query) {
  if (!query) return data;

  const tokens = tokenize(query);

  return data
    .map((entry) => {
      const fields = getEntryFields(entry);
      let score = 0;
      let bucket = 99;
      let hasStrictMatch = false;
      let hasFuzzyMatch = false;

      for (const token of tokens) {
        const signals = collectMatchSignals(fields, token);
        hasStrictMatch = hasStrictMatch || signals.strictMatch;
        hasFuzzyMatch = hasFuzzyMatch || signals.fuzzyMatch;
        bucket = Math.min(bucket, signals.bucket);
        score += signals.score;
      }

      if (!hasStrictMatch && !hasFuzzyMatch) {
        return null;
      }

      return { entry, score, bucket };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.bucket !== b.bucket) return a.bucket - b.bucket;
      return b.score - a.score;
    })
    .map((result) => result.entry);
}
