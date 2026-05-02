/**
 * Kalabhairava Sahasranama - mobile-first reader flow
 * Faster initial reading path with deferred full-search readiness.
 * Startup contract literals: bootstrap: './data/bootstrap-names.json', manifest: './data/names-manifest.json'
 */

(() => {
	"use strict";

	const DATA_PATHS = {
		bootstrap: "./data/bootstrap-names.json",
		manifest: "./data/names-manifest.json",
	};

	const state = {
		data: [],
		searchIndexData: [],
		filteredData: [],
		displayedData: [],
		currentPage: 0,
		pageSize: 11,
		searchQuery: "",
		expandedItems: new Set(),
		manifest: null,
		manifestPromise: null,
		fullDataByIndex: new Map(),
		chunkCache: new Map(),
		totalNames: 0,
		nextChunkIndex: 0,
		searchReady: false,
		searchLoading: false,
		readingLoading: false,
		activeSearchRequestId: null,
	};

	const elements = {};

	function init() {
		cacheDOMElements();
		setupEventListeners();
		scheduleDesktopHeroUpgrade();

		initWorker();
		loadInitialData();
		initScrollAnimations();
	}

	function cacheDOMElements() {
		elements.searchInput = document.getElementById("search-input");
		elements.clearBtn = document.getElementById("clear-btn");
		elements.exploreBtn = document.getElementById("explore-btn");
		elements.learnBtn = document.getElementById("learn-btn");
		elements.namesGrid = document.getElementById("names-grid");
		elements.loadMoreBtn = document.getElementById("load-more-btn");
		elements.loadingState = document.getElementById("loading-state");
		elements.errorState = document.getElementById("error-state");
		elements.errorMessage = document.getElementById("error-message");
		elements.retryLoadBtn = document.getElementById("retry-load-btn");
		elements.statsDisplay = document.getElementById("stats-display");
		elements.ebookBanner = document.querySelector(".ebook-banner");
		elements.ebookBannerClose = document.querySelector(".ebook-banner-close");
	}

	function setupEventListeners() {
		elements.searchInput.addEventListener("input", debounce(handleSearch, 300));

		elements.clearBtn.addEventListener("click", handleClear);
		elements.exploreBtn.addEventListener("click", scrollToNames);

		if (elements.learnBtn) {
			elements.learnBtn.addEventListener("click", scrollToAbout);
		}

		elements.loadMoreBtn.addEventListener("click", loadMoreNames);

		if (elements.ebookBannerClose) {
			elements.ebookBannerClose.addEventListener("click", closeEbookBanner);
		}

		if (elements.retryLoadBtn) {
			elements.retryLoadBtn.addEventListener("click", retryInitialLoad);
		}

		restoreEbookBannerVisibility();
	}

	function initWorker() {
		if (!window.Worker) {
			return;
		}

		state.searchWorker = new Worker("./search-worker.js");
		state.searchWorker.onmessage = (event) => {
			const message = event.data;
			if (!message || message.type !== "results") {
				return;
			}

			if (message.reqId !== state.activeSearchRequestId) {
				return;
			}

			const ids = new Set(message.results || []);
			const searchSource = state.searchIndexData.length
				? state.searchIndexData
				: state.data;
			state.filteredData = searchSource.filter((item) => ids.has(item.index));
			state.currentPage = 0;
			void renderSearchResults().then(() => updateStats());
		};
	}

	function scheduleDesktopHeroUpgrade() {
		if (window.innerWidth < 768) {
			return;
		}

		const upgradeHeroImage = () => {
			const desktopHero = new Image();
			desktopHero.decoding = "async";
			desktopHero.src = "./kalabhairava-bg-desktop.webp";
			desktopHero.onload = () => {
				document.body.classList.add("hero-desktop");
			};
		};

		if (document.readyState === "complete") {
			upgradeHeroImage();
			return;
		}

		window.addEventListener("load", upgradeHeroImage, { once: true });
	}

	async function loadInitialData() {
		try {
			resetInitialLoadState();
			showInitialLoading();
			const bootstrapResponse = await fetch(DATA_PATHS.bootstrap);
			if (!bootstrapResponse.ok) {
				throw new Error("Failed to load sacred names");
			}

			const bootstrapData = await bootstrapResponse.json();

			state.data = bootstrapData;
			state.filteredData = bootstrapData.slice();
			state.totalNames = bootstrapData.length;
			state.nextChunkIndex = 0;
			registerFullRecords(bootstrapData);

			renderNames();
			updateStats();
			hideInitialLoading();
		} catch (error) {
			hideInitialLoading();
			showError(error.message);
		}
	}

	function resetInitialLoadState() {
		state.searchQuery = "";
		state.currentPage = 0;
		state.filteredData = [];
		state.displayedData = [];
		state.searchIndexData = [];
		state.manifest = null;
		state.manifestPromise = null;
		state.fullDataByIndex.clear();
		state.chunkCache.clear();
		state.searchReady = false;
		state.activeSearchRequestId = null;

		if (elements.searchInput) {
			elements.searchInput.value = "";
			elements.searchInput.removeAttribute("aria-busy");
		}

		if (elements.clearBtn) {
			elements.clearBtn.disabled = true;
		}

		if (elements.namesGrid) {
			elements.namesGrid.textContent = "";
		}
	}

	function showInitialLoading() {
		elements.loadingState.classList.remove("hidden");
		elements.errorState.classList.add("hidden");
	}

	function hideInitialLoading() {
		elements.loadingState.classList.add("hidden");
	}

	function retryInitialLoad() {
		loadInitialData();
	}

	function renderNames() {
		const end = (state.currentPage + 1) * state.pageSize;
		state.displayedData = state.filteredData.slice(0, end);

		const fragment = document.createDocumentFragment();
		while (elements.namesGrid.firstChild) {
			elements.namesGrid.removeChild(elements.namesGrid.firstChild);
		}

		state.displayedData.forEach((entry) => {
			fragment.appendChild(createNameCard(entry));
		});

		elements.namesGrid.appendChild(fragment);
		updateLoadMoreButton();
		animateCards();
	}

	function registerFullRecords(records) {
		records.forEach((record) => {
			if (record && record.index != null) {
				state.fullDataByIndex.set(record.index, record);
			}
		});
	}

	async function ensureManifest() {
		if (state.manifest) {
			return state.manifest;
		}

		if (!state.manifestPromise) {
			state.manifestPromise = fetch(DATA_PATHS.manifest)
				.then((response) => {
					if (!response.ok) {
						throw new Error("Failed to load more names");
					}

					return response.json();
				})
				.then((manifest) => {
					state.manifest = manifest;
					state.totalNames = manifest.totalNames || state.totalNames;
					return manifest;
				})
				.finally(() => {
					state.manifestPromise = null;
				});
		}

		return state.manifestPromise;
	}

	function getChunkMetaForIndex(index) {
		if (!state.manifest || !Array.isArray(state.manifest.chunks)) {
			return null;
		}

		return (
			state.manifest.chunks.find(
				(chunk) => index >= chunk.startIndex && index <= chunk.endIndex,
			) || null
		);
	}

	async function fetchChunkData(chunkMeta) {
		if (!chunkMeta || !chunkMeta.path) {
			return [];
		}

		if (state.chunkCache.has(chunkMeta.path)) {
			return state.chunkCache.get(chunkMeta.path);
		}

		const response = await fetch(chunkMeta.path);
		if (!response.ok) {
			throw new Error("Failed to load more sacred names");
		}

		const chunkData = await response.json();
		state.chunkCache.set(chunkMeta.path, chunkData);
		registerFullRecords(chunkData);
		return chunkData;
	}

	async function ensureEntriesHydrated(entries) {
		const missingChunks = new Map();

		for (const entry of entries) {
			if (!entry || state.fullDataByIndex.has(entry.index)) {
				continue;
			}

			const chunkMeta = getChunkMetaForIndex(entry.index);
			if (chunkMeta && !missingChunks.has(chunkMeta.path)) {
				missingChunks.set(chunkMeta.path, chunkMeta);
			}
		}

		if (!missingChunks.size) {
			return;
		}

		if (!state.manifest) {
			await ensureManifest();
		}

		await Promise.all(
			Array.from(missingChunks.values()).map((chunkMeta) =>
				fetchChunkData(chunkMeta).catch((error) => {
					console.warn("Chunk load deferred:", chunkMeta.path, error.message);
					return [];
				}),
			),
		);
	}

	async function renderSearchResults() {
		const end = (state.currentPage + 1) * state.pageSize;
		await ensureEntriesHydrated(state.filteredData.slice(0, end));
		renderNames();
	}

	function createNameCard(entry) {
		const card = document.createElement("div");
		card.className = "name-card ui-card-reading";

		const isExpanded = state.expandedItems.has(entry.index);
		const fullEntry = state.fullDataByIndex.get(entry.index) || entry;
		const name = fullEntry.english_name;
		const oneLine = fullEntry.english_one_line;
		const elaboration =
			fullEntry.english_elaboration ||
			entry.english_elaboration_excerpt ||
			entry.english_elaboration ||
			"";

		const header = document.createElement("div");
		header.className = "card-header";
		const indexBadge = document.createElement("span");
		indexBadge.className = "card-index ui-badge-index";
		indexBadge.textContent = "#" + entry.index;
		header.appendChild(indexBadge);

		const title = document.createElement("h3");
		title.className = "card-name";
		title.textContent = name;

		const summary = document.createElement("p");
		summary.className = "card-meaning";
		summary.textContent = oneLine;

		const toggleBtn = document.createElement("button");
		toggleBtn.className = "toggle-btn ui-btn ui-btn-reading-toggle";
		toggleBtn.type = "button";
		toggleBtn.id = "toggle-elaboration-" + entry.index;
		toggleBtn.setAttribute("data-index", String(entry.index));

		const elaborationId = "elaboration-" + entry.index;

		const label = document.createElement("span");
		label.className = "toggle-btn-label";
		label.textContent = window.i18n
			? window.i18n.getRevealButtonText(isExpanded)
			: isExpanded
				? "Hide Elaboration"
				: "Reveal Elaboration";

		const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		icon.setAttribute("class", "chevron" + (isExpanded ? " rotated" : ""));
		icon.setAttribute("width", "20");
		icon.setAttribute("height", "20");
		icon.setAttribute("viewBox", "0 0 24 24");
		icon.setAttribute("fill", "none");
		icon.setAttribute("stroke", "currentColor");
		icon.setAttribute("stroke-width", "2");
		const polyline = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"polyline",
		);
		polyline.setAttribute("points", "6 9 12 15 18 9");
		icon.appendChild(polyline);
		toggleBtn.appendChild(label);
		toggleBtn.appendChild(icon);

		const elaborationWrap = document.createElement("div");
		elaborationWrap.className = "elaboration" + (isExpanded ? " expanded" : "");
		elaborationWrap.id = elaborationId;
		elaborationWrap.setAttribute("data-index", String(entry.index));
		elaborationWrap.setAttribute("role", "region");
		elaborationWrap.setAttribute("aria-labelledby", toggleBtn.id);
		elaborationWrap.setAttribute("aria-hidden", String(!isExpanded));
		toggleBtn.setAttribute("aria-controls", elaborationId);
		toggleBtn.setAttribute("aria-expanded", String(isExpanded));

		const elaborationContent = document.createElement("div");
		elaborationContent.className = "elaboration-content ui-panel-reading";
		elaborationContent.setAttribute("tabindex", isExpanded ? "0" : "-1");
		if (!isExpanded) {
			elaborationContent.setAttribute("inert", "");
		}
		elaborationContent.appendChild(summary);
		const elaborationCopy = document.createElement("div");
		elaborationCopy.className = "elaboration-copy";
		elaborationCopy.textContent = elaboration;
		elaborationContent.appendChild(elaborationCopy);
		elaborationWrap.appendChild(elaborationContent);

		toggleBtn.addEventListener("click", () => {
			toggleElaboration(entry.index);
		});

		card.appendChild(header);
		card.appendChild(title);
		card.appendChild(toggleBtn);
		card.appendChild(elaborationWrap);
		return card;
	}

	function toggleElaboration(index) {
		if (state.expandedItems.has(index)) {
			state.expandedItems.delete(index);
		} else {
			state.expandedItems.add(index);
		}

		const elaboration = document.querySelector(
			'.elaboration[data-index="' + index + '"]',
		);
		const toggleBtn = document.querySelector(
			'.toggle-btn[data-index="' + index + '"]',
		);
		if (!elaboration || !toggleBtn) {
			return;
		}

		const chevron = toggleBtn.querySelector(".chevron");
		const label = toggleBtn.querySelector("span");
		const elaborationContent = elaboration.querySelector(
			".elaboration-content",
		);
		const isExpanded = state.expandedItems.has(index);

		toggleBtn.setAttribute("aria-expanded", String(isExpanded));
		elaboration.setAttribute("aria-hidden", String(!isExpanded));

		if (isExpanded) {
			elaboration.classList.add("expanded");
			chevron.classList.add("rotated");
			label.textContent = window.i18n
				? window.i18n.t("names.hideButton")
				: "Hide Elaboration";
			if (elaborationContent) {
				elaborationContent.setAttribute("tabindex", "0");
				elaborationContent.removeAttribute("inert");
			}
		} else {
			if (
				elaborationContent &&
				elaborationContent.contains(document.activeElement)
			) {
				toggleBtn.focus();
			}
			elaboration.classList.remove("expanded");
			chevron.classList.remove("rotated");
			label.textContent = window.i18n
				? window.i18n.t("names.revealButton")
				: "Reveal Elaboration";
			if (elaborationContent) {
				elaborationContent.setAttribute("tabindex", "-1");
				elaborationContent.setAttribute("inert", "");
			}
		}
	}

	function animateCards() {
		const cards = elements.namesGrid.querySelectorAll(".name-card");
		let index = 0;

		function step() {
			const batch = 6;
			for (
				let count = 0;
				count < batch && index < cards.length;
				count += 1, index += 1
			) {
				cards[index].classList.add("visible");
			}
			if (index < cards.length) {
				requestAnimationFrame(step);
			}
		}

		requestAnimationFrame(step);
	}

	function hasRemainingChunks() {
		return (
			Boolean(state.manifest) &&
			state.nextChunkIndex < state.manifest.chunks.length
		);
	}

	async function ensureDataForPage(targetPage) {
		if (state.searchQuery) {
			return;
		}

		const requiredCount = (targetPage + 1) * state.pageSize;
		while (state.data.length < requiredCount && hasRemainingChunks()) {
			await loadNextChunk();
		}
	}

	async function loadNextChunk() {
		if (state.readingLoading || !hasRemainingChunks()) {
			return;
		}

		state.readingLoading = true;
		setLoadMoreLoading(true);

		try {
			const chunkMeta = state.manifest.chunks[state.nextChunkIndex];
			const response = await fetch(chunkMeta.path);
			if (!response.ok) {
				throw new Error("Failed to load more sacred names");
			}

			const chunkData = await response.json();
			state.data = state.data.concat(chunkData);
			registerFullRecords(chunkData);
			if (!state.searchQuery) {
				state.filteredData = state.data.slice();
			}
			state.nextChunkIndex += 1;
		} finally {
			state.readingLoading = false;
			setLoadMoreLoading(false);
		}
	}

	function updateLoadMoreButton() {
		const hasMore = state.searchQuery
			? state.displayedData.length < state.filteredData.length
			: state.displayedData.length < state.totalNames;

		if (hasMore) {
			elements.loadMoreBtn.classList.remove("hidden");
		} else {
			elements.loadMoreBtn.classList.add("hidden");
		}
	}

	function setLoadMoreLoading(isLoading) {
		elements.loadMoreBtn.disabled = isLoading;
		elements.loadMoreBtn.textContent = getText(
			isLoading ? "names.loadingMoreButton" : "names.loadMoreButton",
			isLoading ? "Loading More Names..." : "Load More Names",
		);
	}

	async function loadMoreNames() {
		const targetPage = state.currentPage + 1;

		try {
			await ensureDataForPage(targetPage);
			const requiredCount = (targetPage + 1) * state.pageSize;
			if (!state.searchQuery && state.data.length < requiredCount) {
				showTransientNotice(
					"names.loadingMoreDelayed",
					"More names are still loading. Please try again in a moment.",
				);
				return;
			}

			state.currentPage = targetPage;
			if (state.searchQuery) {
				await renderSearchResults();
			} else {
				renderNames();
			}
			const newCardSelector =
				".name-card:nth-child(" +
				(state.displayedData.length - state.pageSize + 1) +
				")";
			const newCard = elements.namesGrid.querySelector(newCardSelector);
			if (newCard) {
				setTimeout(() => {
					newCard.scrollIntoView({
						behavior: getScrollBehavior(),
						block: "center",
					});
				}, 100);
			}
		} catch (error) {
			showTransientNotice(
				"names.loadingMoreDelayed",
				"More names are taking longer than expected. Please try again in a moment.",
			);
		}
	}

	function handleSearch(event) {
		state.searchQuery = event.target.value.toLowerCase().trim();
		state.currentPage = 0;
		updateClearButton();

		if (!state.searchQuery) {
			clearSearchResults();
			return;
		}

		if (!state.searchReady) {
			showSearchPendingNotice();
			prepareSearchIndex();
			return;
		}

		void runSearch();
	}

	function clearSearchResults() {
		state.filteredData = state.data.slice();
		renderNames();
		updateStats();
	}

	async function prepareSearchIndex() {
		if (state.searchReady || state.searchLoading) {
			return;
		}

		state.searchLoading = true;
		elements.searchInput.setAttribute("aria-busy", "true");

		try {
			const searchSourcePath =
				state.manifest && state.manifest.searchSourcePath
					? state.manifest.searchSourcePath
					: "./data/search-index.json";
			const response = await fetch(searchSourcePath);
			if (!response.ok) {
				throw new Error("Failed to prepare search");
			}

			const searchIndexData = await response.json();
			state.searchIndexData = searchIndexData;
			state.totalNames = searchIndexData.length || state.totalNames;
			state.searchReady = true;

			if (state.searchWorker) {
				state.searchWorker.postMessage({
					cmd: "index",
					data: state.searchIndexData,
				});
			}

			if (state.searchQuery) {
				await runSearch();
			} else {
				renderNames();
				updateStats();
			}
		} catch (error) {
			showTransientNotice(
				"names.searchUnavailable",
				"Search needs the remaining names and could not finish loading right now. Please continue reading or try again.",
			);
		} finally {
			state.searchLoading = false;
			elements.searchInput.removeAttribute("aria-busy");
		}
	}

	async function runSearch() {
		if (state.searchWorker) {
			state.activeSearchRequestId = Date.now() + Math.random();
			state.searchWorker.postMessage({
				cmd: "search",
				query: state.searchQuery,
				reqId: state.activeSearchRequestId,
			});
			return;
		}

		filterData();
		await renderSearchResults();
		updateStats();
	}

	function filterData() {
		if (!state.searchQuery) {
			state.filteredData = state.data.slice();
			return;
		}

		const searchSource = state.searchIndexData.length
			? state.searchIndexData
			: state.data;

		state.filteredData = searchSource.filter((entry) => {
			const searchFields = [
				entry.english_name,
				entry.english_one_line,
				entry.english_elaboration_excerpt || entry.english_elaboration,
				String(entry.index),
			];

			return searchFields.some(
				(field) => field && field.toLowerCase().includes(state.searchQuery),
			);
		});
	}

	function setStatsDisplayContent(parts) {
		elements.statsDisplay.textContent = "";
		parts.forEach((part) => {
			if (typeof part === "string") {
				elements.statsDisplay.appendChild(document.createTextNode(part));
				return;
			}

			const strong = document.createElement("strong");
			strong.textContent = String(part);
			elements.statsDisplay.appendChild(strong);
		});
	}

	function showSearchPendingNotice() {
		elements.statsDisplay.textContent = getText(
			"names.searchLoading",
			"Search is preparing the remaining names. Results will appear shortly.",
		);
	}

	function showTransientNotice(key, fallback) {
		elements.errorState.classList.add("hidden");
		elements.statsDisplay.textContent = getText(key, fallback);
	}

	function handleClear() {
		state.searchQuery = "";
		state.currentPage = 0;
		elements.searchInput.value = "";
		clearSearchResults();
		updateClearButton();
	}

	function updateClearButton() {
		elements.clearBtn.disabled = !state.searchQuery;
	}

	function updateStats() {
		const totalNames = state.totalNames || state.data.length;
		const filteredCount = state.filteredData.length;

		if (state.searchQuery) {
			const plural = filteredCount === 1 ? "" : "s";
			setStatsDisplayContent([
				"🔍 Found ",
				filteredCount,
				" name" + plural + ' matching "',
				state.searchQuery,
				'" out of ',
				totalNames,
				" total names",
			]);
			return;
		}

		setStatsDisplayContent([
			"📿 Displaying the sacred ",
			totalNames,
			" names of ",
			"Śrī Kālabhairava",
		]);
	}

	function getText(key, fallback) {
		if (window.i18n) {
			const translated = window.i18n.t(key);
			if (translated && translated !== key) {
				return translated;
			}
		}
		return fallback;
	}

	function prefersReducedMotion() {
		return (
			window.matchMedia &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches
		);
	}

	function getScrollBehavior() {
		return prefersReducedMotion() ? "auto" : "smooth";
	}

	function scrollToNames() {
		const namesSection = document.getElementById("names-section");
		if (namesSection) {
			namesSection.scrollIntoView({
				behavior: getScrollBehavior(),
				block: "start",
			});
		}
	}

	function scrollToAbout() {
		const aboutSection = document.getElementById("about-section");
		if (aboutSection) {
			aboutSection.scrollIntoView({
				behavior: getScrollBehavior(),
				block: "start",
			});
		}
	}

	function showError(message) {
		elements.errorState.classList.remove("hidden");
		elements.errorMessage.textContent = message;
		elements.namesGrid.textContent = "";
		elements.loadMoreBtn.classList.add("hidden");
	}

	function closeEbookBanner() {
		if (!elements.ebookBanner) {
			return;
		}

		elements.ebookBanner.classList.add("hidden");
		const expiryDate = new Date();
		expiryDate.setDate(expiryDate.getDate() + 30);
		document.cookie =
			"ebookBannerClosed=true; path=/; expires=" + expiryDate.toUTCString();
	}

	function restoreEbookBannerVisibility() {
		const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
		const isClosed = cookies.some((cookie) =>
			cookie.startsWith("ebookBannerClosed=true"),
		);

		if (isClosed && elements.ebookBanner) {
			elements.ebookBanner.classList.add("hidden");
		}
	}

	function debounce(func, wait) {
		let timeout;
		return function debounced() {
			const args = arguments;
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				func.apply(null, args);
			}, wait);
		};
	}

	function initScrollAnimations() {
		const animatedElements = document.querySelectorAll("[data-scroll-animate]");
		if (!animatedElements.length) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add("visible");
						observer.unobserve(entry.target);
					}
				});
			},
			{
				threshold: 0.1,
				rootMargin: "0px 0px -50px 0px",
			},
		);

		animatedElements.forEach((element) => {
			observer.observe(element);
		});
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
