/**
 * Kalabhairava Sahasranama - mobile-first reader flow
 * Faster initial reading path with deferred full-search readiness.
 */

(function () {
  'use strict';

  const DATA_PATHS = {
    bootstrap: './data/bootstrap-names.json',
    manifest: './data/names-manifest.json',
  };

  const state = {
    data: [],
    filteredData: [],
    displayedData: [],
    currentPage: 0,
    pageSize: 11,
    searchQuery: '',
    expandedItems: new Set(),
    manifest: null,
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
    promotePreloadedStyles();

    initWorker();
    loadInitialData();
    initScrollAnimations();
  }

  function cacheDOMElements() {
    elements.searchInput = document.getElementById('search-input');
    elements.clearBtn = document.getElementById('clear-btn');
    elements.exploreBtn = document.getElementById('explore-btn');
    elements.learnBtn = document.getElementById('learn-btn');
    elements.namesGrid = document.getElementById('names-grid');
    elements.loadMoreBtn = document.getElementById('load-more-btn');
    elements.loadingState = document.getElementById('loading-state');
    elements.errorState = document.getElementById('error-state');
    elements.errorMessage = document.getElementById('error-message');
    elements.statsDisplay = document.getElementById('stats-display');
    elements.ebookBanner = document.querySelector('.ebook-banner');
    elements.ebookBannerClose = document.querySelector('.ebook-banner-close');
  }

  function setupEventListeners() {
    elements.searchInput.addEventListener('input', debounce(handleSearch, 300));

    elements.clearBtn.addEventListener('click', handleClear);
    elements.exploreBtn.addEventListener('click', scrollToNames);

    if (elements.learnBtn) {
      elements.learnBtn.addEventListener('click', scrollToAbout);
    }

    elements.loadMoreBtn.addEventListener('click', loadMoreNames);

    if (elements.ebookBannerClose) {
      elements.ebookBannerClose.addEventListener('click', closeEbookBanner);
    }

    restoreEbookBannerVisibility();
  }

  function initWorker() {
    if (!window.Worker) {
      return;
    }

    state.searchWorker = new Worker('./search-worker.js');
    state.searchWorker.onmessage = function (event) {
      const message = event.data;
      if (!message || message.type !== 'results') {
        return;
      }

      if (message.reqId !== state.activeSearchRequestId) {
        return;
      }

      const ids = new Set(message.results || []);
      state.filteredData = state.data.filter((item) => ids.has(item.index));
      state.currentPage = 0;
      renderNames();
      updateStats();
    };
  }

  function promotePreloadedStyles() {
    try {
      const links = Array.from(document.querySelectorAll('link[rel="preload"][as="style"]'));
      links.forEach(function (preload) {
        if (preload.rel === 'stylesheet') {
          return;
        }

        const sheet = document.createElement('link');
        sheet.rel = 'stylesheet';
        sheet.href = preload.href;
        if (preload.media) {
          sheet.media = preload.media;
        }
        document.head.appendChild(sheet);
      });
    } catch (error) {
      console.error('Error promoting preloaded styles', error);
    }
  }

  async function loadInitialData() {
    try {
      showInitialLoading();
      const bootstrapResponse = await fetch(DATA_PATHS.bootstrap);
      if (!bootstrapResponse.ok) {
        throw new Error('Failed to load sacred names');
      }

      const bootstrapData = await bootstrapResponse.json();

      state.data = bootstrapData;
      state.filteredData = bootstrapData.slice();
      state.totalNames = bootstrapData.length;
      state.nextChunkIndex = 0;

      renderNames();
      updateStats();
      hideInitialLoading();
      loadManifestInBackground();
    } catch (error) {
      hideInitialLoading();
      showError(error.message);
    }
  }

  async function loadManifestInBackground() {
    try {
      const response = await fetch(DATA_PATHS.manifest);
      if (!response.ok) {
        throw new Error('Failed to load more names');
      }

      const manifest = await response.json();
      state.manifest = manifest;
      state.totalNames = manifest.totalNames || state.totalNames;
      updateLoadMoreButton();
      updateStats();
    } catch (error) {
      console.warn('Manifest load deferred:', error.message);
    }
  }

  function showInitialLoading() {
    elements.loadingState.classList.remove('hidden');
    elements.errorState.classList.add('hidden');
  }

  function hideInitialLoading() {
    elements.loadingState.classList.add('hidden');
  }

  function renderNames() {
    const end = (state.currentPage + 1) * state.pageSize;
    state.displayedData = state.filteredData.slice(0, end);

    const fragment = document.createDocumentFragment();
    while (elements.namesGrid.firstChild) {
      elements.namesGrid.removeChild(elements.namesGrid.firstChild);
    }

    state.displayedData.forEach(function (entry, index) {
      fragment.appendChild(createNameCard(entry, index));
    });

    elements.namesGrid.appendChild(fragment);
    updateLoadMoreButton();
    animateCards();
  }

  function createNameCard(entry, index) {
    const card = document.createElement('div');
    card.className = 'name-card';
    card.style.setProperty('--i', String(index % state.pageSize));

    const isExpanded = state.expandedItems.has(entry.index);
    const name = entry.english_name;
    const oneLine = entry.english_one_line;
    const elaboration = entry.english_elaboration;

    const header = document.createElement('div');
    header.className = 'card-header';
    const indexBadge = document.createElement('span');
    indexBadge.className = 'card-index';
    indexBadge.textContent = '#' + entry.index;
    header.appendChild(indexBadge);

    const title = document.createElement('h3');
    title.className = 'card-name';
    title.textContent = name;

    const summary = document.createElement('p');
    summary.className = 'card-meaning';
    summary.textContent = oneLine;

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-btn';
    toggleBtn.setAttribute('data-index', String(entry.index));

    const label = document.createElement('span');
    label.textContent = window.i18n
      ? window.i18n.getRevealButtonText(isExpanded)
      : (isExpanded ? 'Hide Elaboration' : 'Reveal Elaboration');

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'chevron' + (isExpanded ? ' rotated' : ''));
    icon.setAttribute('width', '20');
    icon.setAttribute('height', '20');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2');
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', '6 9 12 15 18 9');
    icon.appendChild(polyline);
    toggleBtn.appendChild(label);
    toggleBtn.appendChild(icon);

    const elaborationWrap = document.createElement('div');
    elaborationWrap.className = 'elaboration' + (isExpanded ? ' expanded' : '');
    elaborationWrap.setAttribute('data-index', String(entry.index));
    const elaborationContent = document.createElement('div');
    elaborationContent.className = 'elaboration-content';
    elaborationContent.setAttribute('tabindex', '0');
    elaborationContent.setAttribute('role', 'region');
    elaborationContent.setAttribute('aria-label', name + ' elaboration');
    elaborationContent.appendChild(summary);
    const elaborationCopy = document.createElement('div');
    elaborationCopy.className = 'elaboration-copy';
    elaborationCopy.textContent = elaboration;
    elaborationContent.appendChild(elaborationCopy);
    elaborationWrap.appendChild(elaborationContent);

    toggleBtn.addEventListener('click', function () {
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

    const elaboration = document.querySelector('.elaboration[data-index="' + index + '"]');
    const toggleBtn = document.querySelector('.toggle-btn[data-index="' + index + '"]');
    if (!elaboration || !toggleBtn) {
      return;
    }

    const chevron = toggleBtn.querySelector('.chevron');
    const label = toggleBtn.querySelector('span');

    if (state.expandedItems.has(index)) {
      elaboration.classList.add('expanded');
      chevron.classList.add('rotated');
      label.textContent = window.i18n ? window.i18n.t('names.hideButton') : 'Hide Elaboration';
    } else {
      elaboration.classList.remove('expanded');
      chevron.classList.remove('rotated');
      label.textContent = window.i18n ? window.i18n.t('names.revealButton') : 'Reveal Elaboration';
    }
  }

  function animateCards() {
    const cards = elements.namesGrid.querySelectorAll('.name-card');
    let index = 0;

    function step() {
      const batch = 6;
      for (let count = 0; count < batch && index < cards.length; count += 1, index += 1) {
        cards[index].classList.add('visible');
      }
      if (index < cards.length) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  function hasRemainingChunks() {
    return Boolean(state.manifest) && state.nextChunkIndex < state.manifest.chunks.length;
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
        throw new Error('Failed to load more sacred names');
      }

      const chunkData = await response.json();
      state.data = state.data.concat(chunkData);
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
      elements.loadMoreBtn.classList.remove('hidden');
    } else {
      elements.loadMoreBtn.classList.add('hidden');
    }
  }

  function setLoadMoreLoading(isLoading) {
    elements.loadMoreBtn.disabled = isLoading;
    elements.loadMoreBtn.textContent = getText(
      isLoading ? 'names.loadingMoreButton' : 'names.loadMoreButton',
      isLoading ? 'Loading More Names...' : 'Load More Names'
    );
  }

  async function loadMoreNames() {
    const targetPage = state.currentPage + 1;

    try {
      await ensureDataForPage(targetPage);
      const requiredCount = (targetPage + 1) * state.pageSize;
      if (!state.searchQuery && state.data.length < requiredCount) {
        showTransientNotice(
          'names.loadingMoreDelayed',
          'More names are still loading. Please try again in a moment.'
        );
        return;
      }

      state.currentPage = targetPage;
      renderNames();
      const newCardSelector = '.name-card:nth-child(' + (state.displayedData.length - state.pageSize + 1) + ')';
      const newCard = elements.namesGrid.querySelector(newCardSelector);
      if (newCard) {
        setTimeout(function () {
          newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    } catch (error) {
      showTransientNotice(
        'names.loadingMoreDelayed',
        'More names are taking longer than expected. Please try again in a moment.'
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

    runSearch();
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
    elements.searchInput.setAttribute('aria-busy', 'true');

    try {
      const searchSourcePath = state.manifest && state.manifest.searchSourcePath
        ? state.manifest.searchSourcePath
        : './sahasranama_meanings.json';
      const response = await fetch(searchSourcePath);
      if (!response.ok) {
        throw new Error('Failed to prepare search');
      }

      const fullData = await response.json();
      state.data = fullData;
      state.filteredData = fullData.slice();
      state.totalNames = fullData.length;
      state.searchReady = true;

      if (state.searchWorker) {
        state.searchWorker.postMessage({ cmd: 'index', data: state.data });
      }

      if (state.searchQuery) {
        runSearch();
      } else {
        renderNames();
        updateStats();
      }
    } catch (error) {
      showTransientNotice(
        'names.searchUnavailable',
        'Search needs the remaining names and could not finish loading right now. Please continue reading or try again.'
      );
    } finally {
      state.searchLoading = false;
      elements.searchInput.removeAttribute('aria-busy');
    }
  }

  function runSearch() {
    if (state.searchWorker) {
      state.activeSearchRequestId = Date.now() + Math.random();
      state.searchWorker.postMessage({
        cmd: 'search',
        query: state.searchQuery,
        reqId: state.activeSearchRequestId,
      });
      return;
    }

    filterData();
    renderNames();
    updateStats();
  }

  function filterData() {
    if (!state.searchQuery) {
      state.filteredData = state.data.slice();
      return;
    }

    state.filteredData = state.data.filter(function (entry) {
      const searchFields = [
        entry.english_name,
        entry.english_one_line,
        entry.english_elaboration,
        String(entry.index),
      ];

      return searchFields.some(function (field) {
        return field && field.toLowerCase().includes(state.searchQuery);
      });
    });
  }

  function showSearchPendingNotice() {
    elements.statsDisplay.innerHTML = getText(
      'names.searchLoading',
      'Search is preparing the remaining names. Results will appear shortly.'
    );
  }

  function showTransientNotice(key, fallback) {
    elements.errorState.classList.add('hidden');
    elements.statsDisplay.innerHTML = getText(key, fallback);
  }

  function handleClear() {
    state.searchQuery = '';
    state.currentPage = 0;
    elements.searchInput.value = '';
    clearSearchResults();
    updateClearButton();
  }

  function updateClearButton() {
    elements.clearBtn.disabled = !state.searchQuery;
  }

  function updateStats() {
    const totalNames = state.totalNames || state.data.length;
    const filteredCount = state.filteredData.length;

    if (window.i18n) {
      elements.statsDisplay.innerHTML = window.i18n.getStatsMessage(
        state.searchQuery,
        filteredCount,
        totalNames
      );
      return;
    }

    if (state.searchQuery) {
      const plural = filteredCount === 1 ? '' : 's';
      elements.statsDisplay.innerHTML =
        '🔍 Found <strong>' + filteredCount + '</strong> name' + plural +
        ' matching "<strong>' + state.searchQuery + '</strong>" out of <strong>' +
        totalNames + '</strong> total names';
    } else {
      elements.statsDisplay.innerHTML =
        '📿 Displaying the sacred <strong>' + totalNames + '</strong> names of <strong>Śrī Kālabhairava</strong>';
    }
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

  function scrollToNames() {
    const namesSection = document.getElementById('names-section');
    if (namesSection) {
      namesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function scrollToAbout() {
    const aboutSection = document.getElementById('about-section');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function showError(message) {
    elements.errorState.classList.remove('hidden');
    elements.errorMessage.textContent = message;
    elements.namesGrid.innerHTML = '';
    elements.loadMoreBtn.classList.add('hidden');
  }

  function closeEbookBanner() {
    if (!elements.ebookBanner) {
      return;
    }

    elements.ebookBanner.classList.add('hidden');
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    document.cookie = 'ebookBannerClosed=true; path=/; expires=' + expiryDate.toUTCString();
  }

  function restoreEbookBannerVisibility() {
    const cookies = document.cookie.split(';').map(function (cookie) {
      return cookie.trim();
    });
    const isClosed = cookies.some(function (cookie) {
      return cookie.startsWith('ebookBannerClosed=true');
    });

    if (isClosed && elements.ebookBanner) {
      elements.ebookBanner.classList.add('hidden');
    }
  }

  function debounce(func, wait) {
    let timeout;
    return function debounced() {
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        func.apply(null, args);
      }, wait);
    };
  }

  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-scroll-animate]');
    if (!animatedElements.length) {
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    });

    animatedElements.forEach(function (element) {
      observer.observe(element);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
