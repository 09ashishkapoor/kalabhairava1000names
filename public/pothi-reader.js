/* ==========================================================================
   The Pothi — reader behaviour
   The first set is in the HTML. This file only handles what happens after:
   set paging, the set index, the in-set search, and loading later sets from
   the existing runtime chunks. Devanagari and IAST come from the build-time
   index, because the runtime chunks are ASCII-only.
   ========================================================================== */
(function () {
  "use strict";

  var bootEl = document.getElementById("pothi-boot");
  var indexEl = document.getElementById("pothi-index");
  var tocEl = document.getElementById("toc");
  var mlistEl = document.getElementById("mlist");
  var pageEl = document.getElementById("page");
  if (!bootEl || !indexEl || !tocEl || !mlistEl || !pageEl) return;

  var boot;
  var index;
  try {
    boot = JSON.parse(bootEl.textContent);
    index = JSON.parse(indexEl.textContent);
  } catch (error) {
    return;
  }

  var TOTAL = Number(boot.total) || index.length;
  var TOTAL_SETS = Number(boot.totalSets) || Math.ceil(TOTAL / 11);
  var SET_SIZE = 11;
  var CHUNK_SIZE = Number(boot.chunkSize) || 200;
  var CHUNK_COUNT = Number(boot.chunkCount) || Math.ceil(TOTAL / CHUNK_SIZE);

  var qInput = document.getElementById("q");
  var mqInput = document.getElementById("mq");
  var findCount = document.getElementById("findCount");
  var listCount = document.getElementById("listCount");
  var mcount = document.getElementById("mcount");
  var mNone = document.getElementById("mNone");
  var footPage = document.getElementById("footPage");
  var headSet = document.getElementById("headSet");
  var headRange = document.getElementById("headRange");
  var setNo = document.getElementById("setNo");
  var statusEl = document.getElementById("readerStatus");
  var prevBtn = document.getElementById("prev");
  var nextBtn = document.getElementById("next");
  var fore = document.getElementById("fore") || document.querySelector(".fore");

  var setCache = new Map();
  setCache.set(0, boot.entries);

  var setIndex = 0;
  var current = 0;
  var searchMode = false;
  var loading = false;
  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(id) {
    return document.getElementById(id);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function norm(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function cleanLine(line) {
    return line.replace(/\r/g, "").replace(/^\s*>\s?/, "").trim();
  }

  function isHeading(line) {
    if (!line || line.length > 90) return false;
    if (/^[-–—•>#*]/.test(line)) return false;
    if (/[.!?;…]$/.test(line)) return false;
    if (/^[a-z]/.test(line)) return false;
    if (/^\d+[.)]\s/.test(line)) return false;
    if (line.endsWith(":")) return line.length <= 60;
    return line.split(/\s+/).length >= 2 || /[A-Za-zĀ-ž]{3,}/.test(line);
  }

  // Mirrors parseElaboration() in src/lib/pothi.js.
  function parseElaboration(value) {
    if (typeof value !== "string" || !value.trim()) return [];
    var blocks = value
      .replace(/\r\n/g, "\n")
      .split(/\n\s*\n+/)
      .map(function (block) {
        return block.trim();
      })
      .filter(Boolean);
    var out = [];
    for (var b = 0; b < blocks.length; b++) {
      var block = blocks[b];
      if (/^[-–—•]+$/.test(block)) continue;
      var lines = block
        .split("\n")
        .map(cleanLine)
        .filter(Boolean);
      if (!lines.length) continue;
      if (isHeading(lines[0])) {
        out.push({ type: "h3", text: lines[0] });
        if (lines.length > 1) {
          out.push({ type: "p", text: lines.slice(1).join(" ") });
        }
      } else {
        out.push({ type: "p", text: lines.join(" ") });
      }
    }
    return out;
  }

  function entrySearch(entry) {
    return norm(entry.d + " " + entry.i + " " + entry.c + " " + entry.src + " " + entry.m);
  }

  function chunkUrl(number) {
    return "/data_chunk_" + number + ".json";
  }

  function loadSet(target) {
    if (setCache.has(target)) return Promise.resolve(setCache.get(target));

    var start = target * SET_SIZE + 1;
    var end = Math.min(start + SET_SIZE - 1, TOTAL);
    var firstChunk = Math.ceil(start / CHUNK_SIZE);
    var lastChunk = Math.ceil(end / CHUNK_SIZE);
    var requests = [];

    for (var c = firstChunk; c <= lastChunk; c++) {
      if (c < 1 || c > CHUNK_COUNT) continue;
      requests.push(
        fetch(chunkUrl(c), { credentials: "same-origin" }).then(function (response) {
          if (!response.ok) throw new Error("HTTP " + response.status);
          return response.json();
        })
      );
    }

    return Promise.all(requests)
      .then(function (chunks) {
        var byNumber = new Map();
        chunks.forEach(function (list) {
          list.forEach(function (row) {
            byNumber.set(Number(row.index), row);
          });
        });

        var entries = [];
        for (var position = start; position <= end; position++) {
          var compact = index[position - 1];
          var row = byNumber.get(position);
          if (!compact || !row) throw new Error("Name " + position + " is missing");
          entries.push({
            n: position,
            d: compact[1],
            i: compact[2],
            c: compact[3],
            src: compact[4],
            m: row.english_one_line || compact[5],
            slug: compact[6],
            e: row.english_elaboration || "",
          });
        }

        setCache.set(target, entries);
        return entries;
      });
  }

  function buildFore() {
    if (!fore) return;
    var bars = fore.children;
    for (var i = 0; i < bars.length; i++) {
      bars[i].className = i === setIndex ? "now" : i < setIndex ? "done" : "";
    }
  }

  function updateAriaCurrent() {
    var buttons = document.querySelectorAll(
      "#toc button[data-i], #mlist button[data-i]"
    );
    for (var i = 0; i < buttons.length; i++) {
      if (Number(buttons[i].getAttribute("data-i")) === current) {
        buttons[i].setAttribute("aria-current", "true");
      } else {
        buttons[i].removeAttribute("aria-current");
      }
    }
    var resultButtons = document.querySelectorAll(
      "#toc button[data-pos], #mlist button[data-pos]"
    );
    var globalCurrent = setIndex * SET_SIZE + current;
    for (var j = 0; j < resultButtons.length; j++) {
      if (Number(resultButtons[j].getAttribute("data-pos")) === globalCurrent) {
        resultButtons[j].setAttribute("aria-current", "true");
      } else {
        resultButtons[j].removeAttribute("aria-current");
      }
    }
  }

  function updateTurn() {
    if (!prevBtn || !nextBtn) return;
    prevBtn.disabled = loading || setIndex <= 0;
    nextBtn.disabled = loading || setIndex >= TOTAL_SETS - 1;
  }

  function setStatus(message, onRetry) {
    if (!statusEl) return;
    statusEl.textContent = "";
    if (!message) return;
    statusEl.appendChild(document.createTextNode(message));
    if (onRetry) {
      var button = el("button", null, "Try again");
      button.type = "button";
      button.addEventListener("click", onRetry);
      statusEl.appendChild(button);
    }
  }

  function renderPage() {
    var entries = setCache.get(setIndex) || [];
    var entry = entries[current] || entries[0];
    if (!entry) return;

    pageEl.textContent = "";

    var eyebrow = el("div", "page-eyebrow");
    eyebrow.appendChild(el("span", null, "Name " + pad(entry.n) + " of " + TOTAL.toLocaleString("en-US")));
    eyebrow.appendChild(el("span", null, "अर्थ · meaning"));
    pageEl.appendChild(eyebrow);

    var heading = el("h2", "page-name", entry.d);
    heading.setAttribute("lang", "sa");
    pageEl.appendChild(heading);

    pageEl.appendChild(el("p", "page-iast", entry.i));
    pageEl.appendChild(el("p", "page-one", entry.m));
    pageEl.appendChild(el("div", "page-rule"));

    var elaboration = el("div", "page-elab");
    parseElaboration(entry.e).forEach(function (block) {
      elaboration.appendChild(el(block.type === "h3" ? "h3" : "p", null, block.text));
    });
    pageEl.appendChild(elaboration);

    var foot = el("div", "page-foot");
    var source = el("a", "u src", "Read the full note on the site");
    source.href = "/names/" + entry.slug + "/";
    foot.appendChild(source);
    foot.appendChild(el("span", "folio", pad(entry.n)));
    pageEl.appendChild(foot);

    if (footPage) footPage.textContent = String(current + 1);
    updateAriaCurrent();
  }

  function renderLists(entries) {
    tocEl.textContent = "";
    mlistEl.textContent = "";

    var fragmentToc = document.createDocumentFragment();
    var fragmentMobile = document.createDocumentFragment();

    entries.forEach(function (entry, i) {
      var search = entrySearch(entry);

      var li = document.createElement("li");
      li.setAttribute("data-search", search);
      var button = document.createElement("button");
      button.type = "button";
      button.setAttribute("data-i", String(i));
      button.appendChild(el("span", "n", pad(entry.n)));
      var names = el("span");
      var word = el("span", "w", entry.d);
      word.setAttribute("lang", "sa");
      names.appendChild(word);
      names.appendChild(el("span", "i", entry.i));
      button.appendChild(names);
      li.appendChild(button);
      fragmentToc.appendChild(li);

      var mli = document.createElement("li");
      mli.setAttribute("data-search", search);
      var mbutton = document.createElement("button");
      mbutton.type = "button";
      mbutton.setAttribute("data-i", String(i));
      mbutton.setAttribute(
        "aria-label",
        "Name " + entry.n + ": " + entry.c
      );
      mbutton.appendChild(el("span", "n", pad(entry.n)));
      var mnames = el("span");
      var mword = el("span", "w", entry.d);
      mword.setAttribute("lang", "sa");
      mnames.appendChild(mword);
      mnames.appendChild(el("span", "i", entry.i));
      mbutton.appendChild(mnames);
      mli.appendChild(mbutton);
      fragmentMobile.appendChild(mli);
    });

    var none = document.createElement("li");
    none.className = "none";
    none.id = "mNone";
    none.textContent = "No name in the book matches that search.";
    fragmentMobile.appendChild(none);

    tocEl.appendChild(fragmentToc);
    mlistEl.appendChild(fragmentMobile);

    mNone = none;

    if (listCount) listCount.textContent = entries.length + " names";
    if (mcount) mcount.textContent = entries.length + " names";
    if (findCount) findCount.textContent = "";
    if (qInput) qInput.value = "";
    if (mqInput) mqInput.value = "";
    searchMode = false;

    updateAriaCurrent();
  }

  function renderChrome() {
    if (headSet) headSet.textContent = pad(setIndex + 1);
    if (setNo) setNo.textContent = pad(setIndex + 1);
    if (headRange) {
      var entries = setCache.get(setIndex) || [];
      if (entries.length) {
        headRange.textContent = entries[0].n + "–" + entries[entries.length - 1].n;
      }
    }
    if (footPage) footPage.textContent = String(current + 1);
    updateTurn();
    buildFore();
  }

  function selectName(target, scroll) {
    var entries = setCache.get(setIndex) || [];
    if (target < 0 || target >= entries.length) return;
    current = target;
    renderPage();
    if (scroll && window.matchMedia("(max-width:1080px)").matches) {
      pageEl.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  }

  // The embedded index carries all 1,000 names with their one-line meanings,
  // so search does not need the network or the heavy elaboration chunks.
  function indexEntry(row) {
    return {
      n: Number(row[0]),
      d: row[1],
      i: row[2],
      c: row[3],
      src: row[4],
      m: row[5],
      slug: row[6],
      e: "",
    };
  }

  function indexSearchText(row) {
    return norm(row[1] + " " + row[2] + " " + row[3] + " " + row[4] + " " + row[5]);
  }

  function globalMatches(query) {
    var needle = norm(query.trim());
    var matches = [];
    if (!needle) return matches;
    for (var i = 0; i < index.length; i++) {
      if (indexSearchText(index[i]).indexOf(needle) !== -1) {
        matches.push({ position: i, entry: indexEntry(index[i]) });
      }
    }
    return matches;
  }

  function resultItem(entry, position, mobile) {
    var li = document.createElement("li");
    li.setAttribute("data-search", entrySearch(entry));
    var button = document.createElement("button");
    button.type = "button";
    button.setAttribute("data-pos", String(position));
    if (mobile) button.setAttribute("aria-label", "Name " + entry.n + ": " + entry.c);
    button.appendChild(el("span", "n", pad(entry.n)));
    var names = el("span");
    var word = el("span", "w", entry.d);
    word.setAttribute("lang", "sa");
    names.appendChild(word);
    names.appendChild(el("span", "i", entry.i));
    button.appendChild(names);
    li.appendChild(button);
    return li;
  }

  function renderResults(matches, query) {
    searchMode = true;
    tocEl.textContent = "";
    mlistEl.textContent = "";

    var fragmentToc = document.createDocumentFragment();
    var fragmentMobile = document.createDocumentFragment();
    matches.forEach(function (match) {
      fragmentToc.appendChild(resultItem(match.entry, match.position, false));
      fragmentMobile.appendChild(resultItem(match.entry, match.position, true));
    });

    var none = document.createElement("li");
    none.className = "none";
    none.id = "mNone";
    none.textContent = "No name in the book matches that search.";
    fragmentMobile.appendChild(none);
    tocEl.appendChild(fragmentToc);
    mlistEl.appendChild(fragmentMobile);
    mNone = none;
    mNone.classList.toggle("on", matches.length === 0);

    var count = query ? matches.length + "/" + TOTAL : matches.length + " names";
    if (findCount) findCount.textContent = count;
    if (mcount) mcount.textContent = count;
    if (listCount) {
      listCount.textContent = query
        ? matches.length + " of " + TOTAL.toLocaleString("en-US") + " names"
        : matches.length + " names";
    }
    updateAriaCurrent();
  }

  function applySearch(source) {
    var input = source === "mobile" ? mqInput : qInput;
    var other = source === "mobile" ? qInput : mqInput;
    if (!input) return;
    var query = input.value;
    if (other) other.value = query;
    if (!norm(query.trim())) {
      if (searchMode) renderLists(setCache.get(setIndex) || []);
      return;
    }
    renderResults(globalMatches(query), query);
  }

  function openPosition(position, scroll) {
    var targetSet = Math.floor(position / SET_SIZE);
    var local = position % SET_SIZE;
    if (qInput) qInput.value = "";
    if (mqInput) mqInput.value = "";
    var after =
      targetSet === setIndex
        ? Promise.resolve(renderLists(setCache.get(setIndex) || []))
        : goSet(targetSet);
    after.then(function () {
      selectName(local, scroll);
    });
  }

  function writeUrl() {
    try {
      var url = new URL(window.location.href);
      if (setIndex === 0) url.searchParams.delete("set");
      else url.searchParams.set("set", String(setIndex + 1));
      url.searchParams.delete("q");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    } catch (error) {}
  }

  function goSet(target, options) {
    options = options || {};
    if (loading || target < 0 || target >= TOTAL_SETS || target === setIndex) {
      return Promise.resolve(false);
    }

    if (setCache.has(target)) {
      setIndex = target;
      current = 0;
      renderLists(setCache.get(target));
      renderPage();
      renderChrome();
      setStatus("");
      if (options.updateUrl !== false) writeUrl();
      return Promise.resolve(true);
    }

    loading = true;
    updateTurn();
    pageEl.setAttribute("aria-busy", "true");
    setStatus("Loading set " + (target + 1) + "…");

    return loadSet(target)
      .then(function (entries) {
        setIndex = target;
        current = 0;
        renderLists(entries);
        renderPage();
        renderChrome();
        pageEl.setAttribute("aria-busy", "false");
        setStatus("");
        if (options.updateUrl !== false) writeUrl();
        return true;
      })
      .catch(function () {
        pageEl.setAttribute("aria-busy", "false");
        setStatus(
          "Could not load set " + (target + 1) + ". Check your connection and try again.",
          function () {
            goSet(target, options);
          }
        );
        return false;
      })
      .finally(function () {
        loading = false;
        updateTurn();
      });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      goSet(setIndex - 1);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      goSet(setIndex + 1);
    });
  }

  tocEl.addEventListener("click", function (event) {
    var button =
      event.target.closest && event.target.closest("button[data-i], button[data-pos]");
    if (!button) return;
    var position = button.getAttribute("data-pos");
    if (position !== null) {
      openPosition(Number(position), false);
      return;
    }
    selectName(Number(button.getAttribute("data-i")), false);
  });

  mlistEl.addEventListener("click", function (event) {
    var button =
      event.target.closest && event.target.closest("button[data-i], button[data-pos]");
    if (!button) return;
    var position = button.getAttribute("data-pos");
    if (position !== null) {
      openPosition(Number(position), true);
      return;
    }
    selectName(Number(button.getAttribute("data-i")), true);
  });

  if (qInput) qInput.addEventListener("input", function () { applySearch("desktop"); });
  if (mqInput) mqInput.addEventListener("input", function () { applySearch("mobile"); });

  renderChrome();

  // ?set=N restores the set; ?q= comes from the site's SearchAction.
  var params = new URLSearchParams(window.location.search);
  var requestedSet = parseInt(params.get("set"), 10);
  var requestedQuery = params.get("q");

  if (requestedQuery) {
    var needle = norm(requestedQuery.trim());
    var position = -1;
    if (needle) {
      for (var i = 0; i < index.length; i++) {
        var row = index[i];
        if (norm(row[1] + " " + row[2] + " " + row[3] + " " + row[4] + " " + row[5]).indexOf(needle) !== -1) {
          position = i;
          break;
        }
      }
    }
    if (position === -1) {
      setStatus("No name in the book matches “" + requestedQuery.trim() + "”.");
    } else {
      var targetSet = Math.floor(position / SET_SIZE);
      var local = position % SET_SIZE;
      var after = targetSet === 0 ? Promise.resolve(true) : goSet(targetSet, { updateUrl: false });
      after.then(function () {
        selectName(local, false);
        if (qInput) qInput.value = requestedQuery;
        if (mqInput) mqInput.value = requestedQuery;
        applySearch("desktop");
      });
    }
  } else if (requestedSet >= 2 && requestedSet <= TOTAL_SETS) {
    goSet(requestedSet - 1, { updateUrl: false });
  }
})();
