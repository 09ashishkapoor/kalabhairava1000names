// search-worker.js
// Lightweight worker: builds a lowercase index and responds to search requests.
self._data = [];
self._index = [];

self.onmessage = function (ev) {
  const msg = ev.data;
  if (!msg) return;

  if (msg.cmd === 'index') {
    self._data = msg.data || [];
    self._index = self._data.map(item => ({
      index: item.index,
      english_name: (item.english_name || '').toLowerCase(),
      english_one_line: (item.english_one_line || '').toLowerCase(),
      english_elaboration: (item.english_elaboration || '').toLowerCase(),
      hindi_name: (item.hindi_name || '').toLowerCase(),
      hindi_one_line: (item.hindi_one_line || '').toLowerCase(),
      hindi_elaboration: (item.hindi_elaboration || '').toLowerCase()
    }));
    return;
  }

  if (msg.cmd === 'search') {
    const q = (msg.query || '').toLowerCase().trim();
    const lang = msg.language || 'english';
    const reqId = msg.reqId;

    if (!q) {
      // return all ids for empty query
      const all = self._data.map(d => d.index);
      postMessage({ type: 'results', reqId, results: all });
      return;
    }

    const results = [];
    const idx = self._index || [];
    for (let i = 0; i < idx.length; i++) {
      const row = idx[i];
      let match = false;
      if (lang === 'english') {
        if (row.english_name.includes(q) || row.english_one_line.includes(q) || row.english_elaboration.includes(q)) match = true;
      } else {
        if (row.hindi_name.includes(q) || row.hindi_one_line.includes(q) || row.hindi_elaboration.includes(q)) match = true;
      }
      if (!match) {
        if (String(row.index).includes(q)) match = true;
      }
      if (match) results.push(row.index);
    }

    postMessage({ type: 'results', reqId, results });
  }
};
