(() => {
	const assetVersion =
		typeof window !== "undefined" &&
		typeof window.__ASSET_VERSION__ === "string"
			? window.__ASSET_VERSION__.trim()
			: "";
	const initialNamesPayload =
		typeof window !== "undefined" && window.__INITIAL_NAMES_PAYLOAD__
			? window.__INITIAL_NAMES_PAYLOAD__
			: null;
	const initialEntries = Array.isArray(initialNamesPayload?.entries)
		? initialNamesPayload.entries
		: [];

	let searchEntriesFn = null;
	let searchModulePromise = null;
	let fullDataLoadPromise = null;

	function getAssetUrl(path) {
		if (!assetVersion) return path;
		const separator = path.includes("?") ? "&" : "?";
		return `${path}${separator}v=${encodeURIComponent(assetVersion)}`;
	}

	const NETWORK_TIMEOUT_MS = 8000;
	const NETWORK_RETRY_DELAY_MS = 500;
	const NETWORK_RETRY_ATTEMPTS = 1;

	const COPY = {
		statsDefault:
			"📿 Showing all <strong>1072</strong> names of <strong>Maa Adya Mahakali</strong>",
		statsSearching:
			'🔍 Found <strong>{count}</strong> names matching "{query}"',
		pageStatus:
			"Showing <strong>{start}</strong>-<strong>{end}</strong> of <strong>{total}</strong>",
		showSearchButton: "Open Search",
		hideSearchButton: "Close Search",
		loadingNames: "Loading names...",
		loadingNextNames: "Loading next names…",
		preparingSearch: "Preparing search…",
		retryingLoad:
			"Connection is slow. Still trying to load the names… ({attempt}/{total})",
		retryingSearch:
			"Connection is slow. Still preparing search… ({attempt}/{total})",
		retryingPageLoad:
			"Connection is slow. Still loading the next names… ({attempt}/{total})",
		revealButton: "Read More",
		hideButton: "Hide Details",
		emptySearchTitle: "No names matched your search",
		emptySearchBody:
			"Try a shorter keyword, check the spelling, or clear the search to return to the full reading.",
		emptySearchAction: "Clear search",
		retryLoad: "Try loading again",
		offlineError: "You appear to be offline. Reconnect and try again.",
		timeoutError:
			"The connection is taking longer than expected. Please try again.",
		loadError: "Could not load the names right now. Please try again.",
		searchError: "Search could not finish loading. Please try again.",
		pageLoadError: "Could not load the next set of names. Please try again.",
		retrySearch: "Retry search",
		retryPageLoad: "Retry loading names",
	};

	const state = {
		data: [...initialEntries],
		filteredData: [...initialEntries],
		displayedData: initialEntries.slice(0, 11),
		currentPage: 0,
		pageSize: 11,
		searchQuery: (() => {
			const urlParams = new URLSearchParams(window.location.search);
			return (urlParams.get("q") || "").toLowerCase().trim();
		})(),
		expandedItems: new Set(),
		searchPanelOpen: false,
		loadedChunks: new Set(),
		totalChunks: Number(initialNamesPayload?.totalChunks || 0),
		chunkSize: Number(initialNamesPayload?.chunkSize || 0),
		totalEntries: Number(
			initialNamesPayload?.totalEntries || initialEntries.length || 0,
		),
		dataLoaded: initialEntries.length > 0,
		fullDataReady: false,
		fullDataRequested: false,
		usePrerenderedPageOne: initialEntries.length > 0,
		lastFailedAction: null,
	};

	const elements = {};

	function init() {
		document.documentElement.lang = "en";
		cacheDOMElements();
		setupEventListeners();

		if (state.data.length > 0) {
			elements.loadingState.classList.add("hidden");
			renderNames();
			updateStats();

			if (state.searchQuery) {
				setSearchPanelOpen(true, false);
				void handleSearchDebounced();
			}
			return;
		}

		if ("requestIdleCallback" in window) {
			requestIdleCallback(() => void loadData(), { timeout: 2000 });
		} else {
			setTimeout(() => void loadData(), 0);
		}
	}

	function cacheDOMElements() {
		elements.searchInput = document.getElementById("search-input");
		elements.clearBtn = document.getElementById("clear-btn");
		elements.exploreBtn = document.getElementById("explore-btn");
		elements.learnBtn = document.getElementById("learn-btn");
		elements.searchToggleBtn = document.getElementById("search-toggle-btn");
		elements.searchPanel = document.getElementById("search-panel");
		elements.namesGrid = document.getElementById("names-grid");
		elements.prevPageBtn = document.getElementById("prev-page-btn");
		elements.nextPageBtn = document.getElementById("next-page-btn");
		elements.readingProgress = document.getElementById("reading-progress");
		elements.loadingState = document.getElementById("loading-state");
		elements.loadingMessage = document.getElementById("loading-message");
		elements.errorState = document.getElementById("error-state");
		elements.errorMessage = document.getElementById("error-message");
		elements.retryBtn = document.getElementById("retry-btn");
		elements.statsDisplay = document.getElementById("stats-display");
	}

	function setupEventListeners() {
		const debouncedFilter = debounce(() => void handleSearchDebounced(), 100);

		if (elements.searchInput) {
			elements.searchInput.addEventListener("input", (e) => {
				state.searchQuery = e.target.value.toLowerCase().trim();
				updateClearButton();
				debouncedFilter();
			});
		}

		if (elements.clearBtn) {
			elements.clearBtn.addEventListener("click", handleClear);
		}

		if (elements.retryBtn) {
			elements.retryBtn.addEventListener("click", handleRetry);
		}

		if (elements.exploreBtn) {
			elements.exploreBtn.addEventListener("click", scrollToNames);
		}

		if (elements.learnBtn) {
			elements.learnBtn.addEventListener("click", scrollToAbout);
		}

		if (elements.searchToggleBtn) {
			elements.searchToggleBtn.addEventListener("click", toggleSearchPanel);
		}

		if (elements.prevPageBtn) {
			elements.prevPageBtn.addEventListener("click", goToPreviousPage);
		}

		if (elements.nextPageBtn) {
			elements.nextPageBtn.addEventListener("click", goToNextPage);
		}

		window.addEventListener(
			"resize",
			debounce(syncSearchPanelForViewport, 100),
			{ passive: true },
		);
		syncSearchPanelForViewport();

		if (elements.searchInput && state.searchQuery) {
			elements.searchInput.value = state.searchQuery;
		}
	}

	function getTotalAvailableCount() {
		if (state.searchQuery) return state.filteredData.length;
		return state.fullDataReady
			? state.filteredData.length
			: state.totalEntries || state.filteredData.length;
	}

	function mergeEntries(existingEntries, incomingEntries) {
		const byIndex = new Map();
		[...existingEntries, ...incomingEntries].forEach((entry) => {
			if (entry && typeof entry.index === "number") {
				byIndex.set(entry.index, entry);
			}
		});

		return Array.from(byIndex.values()).sort((a, b) => a.index - b.index);
	}

	async function ensureSearchModule(options = {}) {
		if (searchEntriesFn) return searchEntriesFn;
		if (!searchModulePromise) {
			searchModulePromise = importModuleWithRetry(
				getAssetUrl("/search.js"),
				options,
			)
				.then((mod) => {
					searchEntriesFn = mod.searchEntries;
					return searchEntriesFn;
				})
				.catch((error) => {
					searchModulePromise = null;
					throw error;
				});
		}
		return searchModulePromise;
	}

	function delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	function createTimeoutError() {
		const error = new Error("Request timed out");
		error.name = "AbortError";
		error.code = "REQUEST_TIMEOUT";
		return error;
	}

	function withTimeout(promiseFactory, timeoutMs) {
		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(
				() => reject(createTimeoutError()),
				timeoutMs,
			);
			Promise.resolve()
				.then(promiseFactory)
				.then(resolve)
				.catch(reject)
				.finally(() => clearTimeout(timeoutId));
		});
	}

	function isTimeoutError(error) {
		return error?.name === "AbortError" || error?.code === "REQUEST_TIMEOUT";
	}

	function isRetryableNetworkError(error) {
		return isTimeoutError(error) || error instanceof TypeError;
	}

	function getRetryProgressMessage(type, attempt, totalAttempts) {
		const template =
			type === "search"
				? COPY.retryingSearch
				: type === "next-page"
					? COPY.retryingPageLoad
					: COPY.retryingLoad;
		return template
			.replace("{attempt}", attempt)
			.replace("{total}", totalAttempts);
	}

	function announceRetryProgress(type, attempt, totalAttempts) {
		const message = getRetryProgressMessage(type, attempt, totalAttempts);
		if (type === "search") {
			setStatsMessage(message);
			return;
		}
		if (type === "next-page") {
			setProgressMessage(message);
			return;
		}
		setLoadingMessage(message);
	}

	async function importModuleWithRetry(url, options = {}) {
		const retries = options.retries ?? NETWORK_RETRY_ATTEMPTS;
		const timeoutMs = options.timeoutMs ?? NETWORK_TIMEOUT_MS;
		const retryDelayMs = options.retryDelayMs ?? NETWORK_RETRY_DELAY_MS;
		const retryType = options.retryType || "initial-load";
		const totalAttempts = retries + 1;

		for (let attempt = 0; attempt <= retries; attempt += 1) {
			try {
				return await withTimeout(() => import(url), timeoutMs);
			} catch (error) {
				const canRetry =
					attempt < retries && !isOffline() && isRetryableNetworkError(error);
				if (!canRetry) throw error;
				announceRetryProgress(retryType, attempt + 2, totalAttempts);
				await delay(retryDelayMs * (attempt + 1));
			}
		}
	}

	async function fetchJsonWithRetry(url, options = {}) {
		const retries = options.retries ?? NETWORK_RETRY_ATTEMPTS;
		const timeoutMs = options.timeoutMs ?? NETWORK_TIMEOUT_MS;
		const retryDelayMs = options.retryDelayMs ?? NETWORK_RETRY_DELAY_MS;
		const retryType = options.retryType || "initial-load";
		const totalAttempts = retries + 1;

		for (let attempt = 0; attempt <= retries; attempt += 1) {
			const abortController =
				typeof AbortController !== "undefined" ? new AbortController() : null;
			const timeoutId = abortController
				? setTimeout(() => abortController.abort(), timeoutMs)
				: null;

			try {
				const response = await fetch(url, {
					signal: abortController?.signal,
				});
				if (!response.ok) throw new Error(`Request failed: ${response.status}`);
				return await response.json();
			} catch (error) {
				const canRetry =
					attempt < retries && !isOffline() && isRetryableNetworkError(error);
				if (!canRetry) throw error;
				announceRetryProgress(retryType, attempt + 2, totalAttempts);
				await delay(retryDelayMs * (attempt + 1));
			} finally {
				if (timeoutId) clearTimeout(timeoutId);
			}
		}
	}

	async function ensureManifestMetadata(options = {}) {
		if (state.totalChunks && state.chunkSize) return;

		const manifest = await fetchJsonWithRetry(
			getAssetUrl("/data_manifest.json"),
			{
				retryType: options.retryType,
			},
		);
		state.totalEntries = manifest.total || state.totalEntries;
		state.totalChunks = manifest.chunks || state.totalChunks;
		state.chunkSize = manifest.chunk_size || state.chunkSize;
	}

	async function ensureChunkLoaded(chunkNum, options = {}) {
		if (state.loadedChunks.has(chunkNum)) return;

		await ensureManifestMetadata(options);
		const chunkData = await fetchJsonWithRetry(
			getAssetUrl(`/data_chunk_${chunkNum}.json`),
			{ retryType: options.retryType },
		);
		state.data = mergeEntries(state.data, chunkData);
		if (!state.searchQuery) {
			state.filteredData = [...state.data];
		}
		state.loadedChunks.add(chunkNum);
	}

	async function ensureAllDataLoaded(options = {}) {
		if (state.fullDataReady) return;
		if (!fullDataLoadPromise) {
			state.fullDataRequested = true;
			fullDataLoadPromise = (async () => {
				try {
					await ensureManifestMetadata(options);
					const chunkNumbers = Array.from(
						{ length: state.totalChunks },
						(_, idx) => idx + 1,
					);
					await Promise.all(
						chunkNumbers.map((chunkNum) =>
							ensureChunkLoaded(chunkNum, options),
						),
					);
					state.filteredData = [...state.data];
					state.dataLoaded = true;
					state.fullDataReady = true;
				} catch (error) {
					fullDataLoadPromise = null;
					state.fullDataRequested = false;
					throw error;
				}
			})();
		}

		await fullDataLoadPromise;
	}

	async function ensurePageData(pageIndex, options = {}) {
		const startIndex = pageIndex * state.pageSize;
		if (state.data.length > startIndex) return;

		const safeChunkSize = state.chunkSize || 200;
		const requiredChunk = Math.floor(startIndex / safeChunkSize) + 1;
		await ensureChunkLoaded(requiredChunk, options);
		state.dataLoaded = true;
	}

	function setProgressMessage(message) {
		if (elements.readingProgress) {
			elements.readingProgress.textContent = message;
		}
	}

	function setStatsMessage(message) {
		if (elements.statsDisplay) {
			elements.statsDisplay.textContent = message;
		}
	}

	function setLoadingMessage(message) {
		if (elements.loadingMessage) {
			elements.loadingMessage.textContent = message;
		}
	}

	function isOffline() {
		return typeof navigator !== "undefined" && navigator.onLine === false;
	}

	function getReadableErrorMessage(type, error = null) {
		if (isOffline()) {
			return COPY.offlineError;
		}

		if (isTimeoutError(error)) {
			return COPY.timeoutError;
		}

		switch (type) {
			case "search":
				return COPY.searchError;
			case "next-page":
				return COPY.pageLoadError;
			default:
				return COPY.loadError;
		}
	}

	function clearError() {
		state.lastFailedAction = null;
		elements.errorState?.classList.add("hidden");
	}

	async function prepareSearchExperience() {
		setStatsMessage(COPY.preparingSearch);
		await Promise.all([
			ensureSearchModule({ retryType: "search" }),
			ensureAllDataLoaded({ retryType: "search" }),
		]);
	}

	function adoptPrerenderedFirstPage() {
		state.displayedData = state.filteredData.slice(0, state.pageSize);
		const toggleButtons = elements.namesGrid.querySelectorAll(
			'.toggle-btn[data-prerendered="true"]',
		);
		toggleButtons.forEach((button) => {
			if (button.dataset.bound === "true") return;
			const index = Number(button.dataset.index);
			button.addEventListener("click", () => toggleElaboration(index));
			button.dataset.bound = "true";
		});
	}

	function isDesktopViewport() {
		return window.innerWidth >= 768;
	}

	function syncSearchPanelForViewport() {
		if (!elements.searchPanel) return;

		if (isDesktopViewport()) {
			setSearchPanelOpen(true, false);
		} else if (state.searchQuery) {
			setSearchPanelOpen(true, false);
		} else {
			setSearchPanelOpen(state.searchPanelOpen, false);
		}
	}

	function setSearchPanelOpen(isOpen, shouldFocusInput = false) {
		if (!elements.searchPanel || !elements.searchToggleBtn) return;

		state.searchPanelOpen = isDesktopViewport() ? true : isOpen;
		elements.searchPanel.classList.toggle(
			"mobile-collapsed",
			!state.searchPanelOpen,
		);
		elements.searchPanel.classList.toggle("is-open", state.searchPanelOpen);
		elements.searchToggleBtn.setAttribute(
			"aria-expanded",
			String(state.searchPanelOpen),
		);
		updateSearchToggleButton();

		if (shouldFocusInput && state.searchPanelOpen && elements.searchInput) {
			elements.searchInput.focus();
		}
	}

	function getSearchPanelToggleLabel() {
		return state.searchPanelOpen
			? COPY.hideSearchButton
			: COPY.showSearchButton;
	}

	function updateSearchToggleButton() {
		if (elements.searchToggleBtn) {
			elements.searchToggleBtn.textContent = getSearchPanelToggleLabel();
		}
	}

	function toggleSearchPanel() {
		if (isDesktopViewport()) return;

		const willOpen = !state.searchPanelOpen;
		setSearchPanelOpen(willOpen, willOpen);
		if (willOpen && !state.fullDataRequested) {
			void prepareSearchExperience()
				.then(() => updateStats())
				.catch((error) => {
					console.error("Error preparing search:", error);
					showError(getReadableErrorMessage("search", error), "search");
				});
		}
	}

	function updatePagination() {
		if (!elements.prevPageBtn || !elements.nextPageBtn) return;

		const hasPreviousPage = state.currentPage > 0;
		const hasNextPage =
			(state.currentPage + 1) * state.pageSize < getTotalAvailableCount();

		elements.prevPageBtn.classList.toggle("hidden", !hasPreviousPage);
		elements.nextPageBtn.classList.toggle("hidden", !hasNextPage);
		elements.prevPageBtn.disabled = !hasPreviousPage;
		elements.nextPageBtn.disabled = !hasNextPage;

		updateReadingProgress();
	}

	function updateReadingProgress() {
		if (!elements.readingProgress) return;

		const total = getTotalAvailableCount();
		if (!total || !state.displayedData.length) {
			elements.readingProgress.innerHTML = "";
			return;
		}

		const start = state.currentPage * state.pageSize + 1;
		const end = Math.min(start + state.displayedData.length - 1, total);
		elements.readingProgress.innerHTML = COPY.pageStatus
			.replace("{start}", start)
			.replace("{end}", end)
			.replace("{total}", total);
	}

	function scrollToResultsTop() {
		if (elements.namesGrid) {
			elements.namesGrid.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	}

	function goToPreviousPage() {
		if (state.currentPage === 0) return;
		state.currentPage -= 1;
		renderNames();
		scrollToResultsTop();
	}

	async function goToNextPage() {
		if ((state.currentPage + 1) * state.pageSize >= getTotalAvailableCount())
			return;

		const nextPage = state.currentPage + 1;
		const nextStartIndex = nextPage * state.pageSize;

		if (
			!state.searchQuery &&
			!state.fullDataReady &&
			state.data.length <= nextStartIndex
		) {
			setProgressMessage(COPY.loadingNextNames);
			elements.nextPageBtn.disabled = true;
			try {
				await ensurePageData(nextPage, { retryType: "next-page" });
			} catch (error) {
				console.error("Error loading next page:", error);
				showError(getReadableErrorMessage("next-page", error), "next-page");
				updateReadingProgress();
				elements.nextPageBtn.disabled = false;
				return;
			}
		}

		clearError();

		state.usePrerenderedPageOne = false;
		state.currentPage = nextPage;
		renderNames();
		scrollToResultsTop();
	}

	async function loadData() {
		try {
			elements.loadingState.classList.remove("hidden");
			setLoadingMessage(COPY.loadingNames);
			clearError();

			await ensureChunkLoaded(1, { retryType: "initial-load" });
			state.dataLoaded = true;
			state.totalEntries = Math.max(state.totalEntries, state.data.length);
			state.filteredData = [...state.data];
			renderNames();
			updateStats();
			setLoadingMessage(COPY.loadingNames);
			elements.loadingState.classList.add("hidden");
		} catch (error) {
			setLoadingMessage(COPY.loadingNames);
			showError(getReadableErrorMessage("initial-load", error), "initial-load");
			elements.loadingState.classList.add("hidden");
		}
	}

	function renderNames() {
		try {
			if (
				state.usePrerenderedPageOne &&
				state.currentPage === 0 &&
				!state.searchQuery &&
				elements.namesGrid?.dataset.prerendered === "true"
			) {
				adoptPrerenderedFirstPage();
				updatePagination();
				return;
			}

			const start = state.currentPage * state.pageSize;
			const end = start + state.pageSize;
			state.displayedData = state.filteredData.slice(start, end);
			state.usePrerenderedPageOne = false;
			if (elements.namesGrid?.dataset) {
				elements.namesGrid.dataset.prerendered = "false";
			}

			elements.namesGrid.innerHTML = "";
			if (!state.displayedData.length) {
				renderEmptyState();
				updatePagination();
				return;
			}

			renderInChunks(state.displayedData, 0);
			updatePagination();
		} catch (error) {
			console.error("Error rendering names:", error);
			throw error;
		}
	}

	function renderEmptyState() {
		const escapedQuery = escapeHtml(state.searchQuery);
		elements.namesGrid.innerHTML = `
      <div class="empty-state" role="status">
        <h3 class="empty-state-title">${COPY.emptySearchTitle}</h3>
        <p class="empty-state-body">${COPY.emptySearchBody}</p>
        ${escapedQuery ? `<p class="empty-state-query">Search: <strong>${escapedQuery}</strong></p>` : ""}
        <button id="empty-state-clear-btn" class="btn-secondary empty-state-action" type="button">${COPY.emptySearchAction}</button>
      </div>
    `;

		const clearButton = document.getElementById("empty-state-clear-btn");
		if (clearButton) {
			clearButton.addEventListener("click", handleClear);
		}
	}

	function renderInChunks(data, startIndex, chunkSize = 8) {
		const endIndex = Math.min(startIndex + chunkSize, data.length);
		const fragment = document.createDocumentFragment();

		for (let i = startIndex; i < endIndex; i++) {
			fragment.appendChild(createNameCard(data[i], i));
		}

		elements.namesGrid.appendChild(fragment);

		if (endIndex < data.length) {
			if ("requestIdleCallback" in window) {
				requestIdleCallback(() => renderInChunks(data, endIndex, chunkSize), {
					timeout: 1000,
				});
			} else {
				setTimeout(() => renderInChunks(data, endIndex, chunkSize), 16);
			}
		} else if ("requestIdleCallback" in window) {
			requestIdleCallback(animateCards);
		} else {
			setTimeout(animateCards, 100);
		}
	}

	function escapeHtml(value) {
		return String(value)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function highlight(text, query) {
		if (!text) return "";
		const safeText = escapeHtml(text);
		if (!query) return safeText;

		const tokens = query
			.toLowerCase()
			.split(/\s+/)
			.filter(Boolean)
			.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

		let result = safeText;

		for (const token of tokens) {
			let regex = new RegExp(`\\b(${token})\\b`, "gi");
			if (regex.test(result)) {
				result = result.replace(regex, "<mark>$1</mark>");
				continue;
			}

			regex = new RegExp(`\\b(${token})`, "gi");
			if (regex.test(result)) {
				result = result.replace(regex, "<mark>$1</mark>");
				continue;
			}

			if (token.length >= 3) {
				regex = new RegExp(`(${token})`, "gi");
				result = result.replace(regex, "<mark>$1</mark>");
			}
		}

		return result;
	}

	function highlightFuzzy(text, query) {
		if (!text) return "";
		if (!query) return escapeHtml(text);

		const lowerText = text.toLowerCase();
		const lowerQuery = query.toLowerCase();
		let t = 0;
		let q = 0;
		const matchIndexes = new Set();

		while (t < lowerText.length && q < lowerQuery.length) {
			if (lowerText[t] === lowerQuery[q]) {
				matchIndexes.add(t);
				q += 1;
			}
			t += 1;
		}

		if (q !== lowerQuery.length) {
			return highlight(text, query);
		}

		let result = "";
		for (let i = 0; i < text.length; i++) {
			const safeChar = escapeHtml(text[i]);
			result += matchIndexes.has(i) ? `<mark>${safeChar}</mark>` : safeChar;
		}
		return result;
	}

	function getToggleButtonLabelMarkup(isExpanded) {
		return isExpanded ? COPY.hideButton : COPY.revealButton;
	}

	function createNameCard(entry, index) {
		const card = document.createElement("div");
		card.className = "name-card";
		card.style.animationDelay = `${(index % state.pageSize) * 0.05}s`;

		const isExpanded = state.expandedItems.has(entry.index);
		const name = highlightFuzzy(entry.english_name || "", state.searchQuery);
		const oneLine = highlight(entry.english_one_line || "", state.searchQuery);
		const elaboration = highlight(
			entry.english_elaboration || "",
			state.searchQuery,
		);
		const detailMarkup = [
			oneLine ? `<p class="card-meaning">${oneLine}</p>` : "",
			elaboration ? `<div class="elaboration-copy">${elaboration}</div>` : "",
		]
			.filter(Boolean)
			.join("");

		card.innerHTML = `
      <div class="card-header">
        <span class="card-index">#${entry.index}</span>
      </div>

      <p class="card-name">${name}</p>

      <button
        class="toggle-btn"
        data-index="${entry.index}"
        type="button"
        aria-expanded="${isExpanded ? "true" : "false"}"
        aria-controls="elaboration-${entry.index}"
      >
        <span class="toggle-btn-label">${getToggleButtonLabelMarkup(isExpanded)}</span>
        <svg class="chevron ${isExpanded ? "rotated" : ""}" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <div class="elaboration ${isExpanded ? "expanded" : ""}" data-index="${entry.index}" id="elaboration-${entry.index}" aria-hidden="${isExpanded ? "false" : "true"}">
        <div class="elaboration-content" tabindex="${isExpanded ? "0" : "-1"}">${detailMarkup}</div>
      </div>
    `;

		card
			.querySelector(".toggle-btn")
			.addEventListener("click", () => toggleElaboration(entry.index));
		return card;
	}

	function toggleElaboration(index) {
		if (state.expandedItems.has(index)) {
			state.expandedItems.delete(index);
		} else {
			state.expandedItems.add(index);
		}

		const elaboration = document.querySelector(
			`.elaboration[data-index="${index}"]`,
		);
		const toggleBtn = document.querySelector(
			`.toggle-btn[data-index="${index}"]`,
		);
		const chevron = toggleBtn.querySelector(".chevron");
		const label = toggleBtn.querySelector(".toggle-btn-label");
		const elaborationContent = elaboration?.querySelector(
			".elaboration-content",
		);
		const isExpanded = state.expandedItems.has(index);

		if (isExpanded) {
			elaboration.classList.add("expanded");
			elaboration.setAttribute("aria-hidden", "false");
			chevron.classList.add("rotated");
			toggleBtn.setAttribute("aria-expanded", "true");
			elaborationContent?.setAttribute("tabindex", "0");
		} else {
			elaboration.classList.remove("expanded");
			elaboration.setAttribute("aria-hidden", "true");
			chevron.classList.remove("rotated");
			toggleBtn.setAttribute("aria-expanded", "false");
			elaborationContent?.setAttribute("tabindex", "-1");
		}

		if (label) {
			label.textContent = getToggleButtonLabelMarkup(isExpanded);
		}
	}

	function animateCards() {
		const cards = elements.namesGrid.querySelectorAll(".name-card");
		cards.forEach((card, index) => {
			setTimeout(() => card.classList.add("visible"), index * 30);
		});
	}

	async function handleSearchDebounced() {
		state.currentPage = 0;
		if (state.searchQuery) {
			setSearchPanelOpen(true, false);
			try {
				await prepareSearchExperience();
			} catch (error) {
				console.error("Error loading deferred search experience:", error);
				showError(getReadableErrorMessage("search", error), "search");
				updateStats();
				return;
			}
		}

		await filterData();
		clearError();
		renderNames();
		updateStats();
	}

	async function filterData() {
		if (!state.searchQuery) {
			state.filteredData = [...state.data];
			return;
		}

		const searchEntries = await ensureSearchModule();
		state.filteredData = searchEntries(state.data, state.searchQuery);
	}

	function handleClear() {
		state.searchQuery = "";
		state.currentPage = 0;
		elements.searchInput.value = "";
		state.filteredData = [...state.data];
		clearError();
		renderNames();
		updateStats();
		updateClearButton();
	}

	function updateClearButton() {
		elements.clearBtn.disabled = !state.searchQuery;
	}

	function updateStats() {
		const filteredCount = state.filteredData.length;
		if (state.searchQuery) {
			elements.statsDisplay.innerHTML = COPY.statsSearching
				.replace("{count}", filteredCount)
				.replace("{query}", escapeHtml(state.searchQuery));
			return;
		}
		elements.statsDisplay.innerHTML = COPY.statsDefault;
	}

	function handleRetry() {
		const failedAction = state.lastFailedAction;
		clearError();

		if (failedAction === "search") {
			void handleSearchDebounced();
			return;
		}

		if (failedAction === "next-page") {
			void goToNextPage();
			return;
		}

		if (failedAction === "initial-load" || !state.data.length) {
			void loadData();
			return;
		}

		renderNames();
		updateStats();
	}

	function scrollToNames() {
		const namesSection = document.getElementById("names-section");
		if (namesSection) {
			namesSection.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	}

	function scrollToAbout() {
		const aboutSection = document.getElementById("about-section");
		if (aboutSection) {
			aboutSection.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	}

	function showError(message, failedAction = "general") {
		state.lastFailedAction = failedAction;
		elements.errorState.classList.remove("hidden");
		elements.errorMessage.textContent = message;

		if (elements.retryBtn) {
			elements.retryBtn.textContent =
				failedAction === "search"
					? COPY.retrySearch
					: failedAction === "next-page"
						? COPY.retryPageLoad
						: COPY.retryLoad;
		}

		if (!state.displayedData.length) {
			elements.namesGrid.innerHTML = "";
		}
	}

	function debounce(func, wait) {
		let timeout;
		return function executedFunction(...args) {
			const later = () => {
				clearTimeout(timeout);
				func(...args);
			};
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
