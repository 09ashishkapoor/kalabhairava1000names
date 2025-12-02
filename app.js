/**
 * Kālabhairava Sahasranāma - Pure Vanilla JS Application
 * Mobile-first, lightweight, fast
 */

(function() {
  'use strict';
  
  // State
  const state = {
    data: [],
    filteredData: [],
    displayedData: [],
    currentPage: 0,
    pageSize: 30,
    searchQuery: '',
    language: 'english',
    expandedItems: new Set(),
    theme: localStorage.getItem('theme') || 'dark'
  };
  
  // DOM Elements
  const elements = {};
  
  // Initialize
  function init() {
    cacheDOMElements();
    setupEventListeners();
    applyTheme(state.theme);
    promotePreloadedStyles();
    scheduleBgLoad();
    loadData();
    initScrollAnimations();
    console.log('✅ App initialized');
  }

  // Promote <link rel="preload" as="style"> elements to actual stylesheets
  // This avoids inline onload handlers (which your CSP blocks) and ensures
  // preloaded CSS is applied. Runs early during init().
  function promotePreloadedStyles() {
    try {
      const links = Array.from(document.querySelectorAll('link[rel="preload"][as="style"]'));
      links.forEach(preload => {
        // If the stylesheet is already applied, skip
        if (preload.rel === 'stylesheet') return;

        // Create a new stylesheet link and append it — safer across browsers
        const href = preload.href;
        const sheet = document.createElement('link');
        sheet.rel = 'stylesheet';
        sheet.href = href;
        // Preserve media attribute if present on preload
        if (preload.media) sheet.media = preload.media;
        document.head.appendChild(sheet);
      });
    } catch (e) {
      // silent fail — styles will eventually load via noscript fallback if needed
      console.error('Error promoting preloaded styles', e);
    }
  }
  
  function cacheDOMElements() {
    elements.searchInput = document.getElementById('search-input');
    elements.languageSelect = document.getElementById('language-select');
    elements.clearBtn = document.getElementById('clear-btn');
    elements.themeToggle = document.getElementById('theme-toggle');
    elements.exploreBtn = document.getElementById('explore-btn');
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
    // Search
    elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Language
    elements.languageSelect.addEventListener('change', handleLanguageChange);
    
    // Clear
    elements.clearBtn.addEventListener('click', handleClear);
    
    // Theme
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Explore button
    elements.exploreBtn.addEventListener('click', scrollToNames);
    
    // Load more
    elements.loadMoreBtn.addEventListener('click', loadMoreNames);
    
    // Ebook banner close
    if (elements.ebookBannerClose) {
      elements.ebookBannerClose.addEventListener('click', closeEbookBanner);
    }
    
    // Restore ebook banner visibility if needed
    restoreEbookBannerVisibility();
  }
  
  // Load Data
  async function loadData() {
    try {
      elements.loadingState.classList.remove('hidden');
      elements.errorState.classList.add('hidden');
      
      const response = await fetch('/sahasranama_meanings.json');
      if (!response.ok) throw new Error('Failed to load sacred names');
      
      state.data = await response.json();
      state.filteredData = [...state.data];
      
      // Initialize search worker for indexing
      if (window.Worker) {
        if (!state.searchWorker) {
          state.searchWorker = new Worker('/search-worker.js');
          state.searchWorker.onmessage = function(e) {
            const msg = e.data;
            if (!msg) return;
            if (msg.type === 'results') {
              // msg.results is an array of matching entry.index values
              // Map indexes to entries and update filteredData
              const ids = new Set(msg.results);
              state.filteredData = state.data.filter(it => ids.has(it.index));
              state.currentPage = 0;
              renderNames();
              updateStats();
            }
          };
        }
        state.searchWorker.postMessage({ cmd: 'index', data: state.data });
      }
      
      renderNames();
      updateStats();
      
      elements.loadingState.classList.add('hidden');
    } catch (error) {
      showError(error.message);
      elements.loadingState.classList.add('hidden');
    }
  }
  
  // Render Names
  function renderNames() {
    const start = 0;
    const end = (state.currentPage + 1) * state.pageSize;
    state.displayedData = state.filteredData.slice(start, end);
    // Build all cards in a fragment to avoid repeated reflows
    const frag = document.createDocumentFragment();
    // clear grid
    while (elements.namesGrid.firstChild) elements.namesGrid.removeChild(elements.namesGrid.firstChild);
    state.displayedData.forEach((entry, index) => {
      const card = createNameCard(entry, index);
      frag.appendChild(card);
    });
    elements.namesGrid.appendChild(frag);
    
    // Show/hide load more button
    if (state.displayedData.length < state.filteredData.length) {
      elements.loadMoreBtn.classList.remove('hidden');
    } else {
      elements.loadMoreBtn.classList.add('hidden');
    }
    
    // Animate cards (staggered) with a single RAF loop to reduce timers
    animateCards();
  }
  
  function createNameCard(entry, index) {
    const card = document.createElement('div');
    card.className = 'name-card';
    // expose index for CSS stagger if needed
    card.style.setProperty('--i', String(index % state.pageSize));

    const isExpanded = state.expandedItems.has(entry.index);
    const name = state.language === 'english' ? entry.english_name : entry.hindi_name;
    const oneLine = state.language === 'english' ? entry.english_one_line : entry.hindi_one_line;
    const elaboration = state.language === 'english' ? entry.english_elaboration : entry.hindi_elaboration;

    const header = document.createElement('div');
    header.className = 'card-header';
    const idxSpan = document.createElement('span');
    idxSpan.className = 'card-index';
    idxSpan.textContent = `#${entry.index}`;
    header.appendChild(idxSpan);

    const h3 = document.createElement('h3');
    h3.className = 'card-name';
    h3.textContent = name;

    const p = document.createElement('p');
    p.className = 'card-meaning';
    p.textContent = oneLine;

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-btn';
    toggleBtn.setAttribute('data-index', String(entry.index));
    const span = document.createElement('span');
    span.textContent = isExpanded ? 'Hide Elaboration' : 'Reveal Elaboration';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', `chevron ${isExpanded ? 'rotated' : ''}`);
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    poly.setAttribute('points', '6 9 12 15 18 9');
    svg.appendChild(poly);
    toggleBtn.appendChild(span);
    toggleBtn.appendChild(svg);

    const elaborationDiv = document.createElement('div');
    elaborationDiv.className = `elaboration ${isExpanded ? 'expanded' : ''}`;
    elaborationDiv.setAttribute('data-index', String(entry.index));
    const elaborationContent = document.createElement('div');
    elaborationContent.className = 'elaboration-content';
    elaborationContent.textContent = elaboration;
    elaborationDiv.appendChild(elaborationContent);

    toggleBtn.addEventListener('click', () => toggleElaboration(entry.index));

    card.appendChild(header);
    card.appendChild(h3);
    card.appendChild(p);
    card.appendChild(toggleBtn);
    card.appendChild(elaborationDiv);

    return card;
  }
  
  function toggleElaboration(index) {
    if (state.expandedItems.has(index)) {
      state.expandedItems.delete(index);
    } else {
      state.expandedItems.add(index);
    }
    
    // Find the card and update it
    const elaboration = document.querySelector(`.elaboration[data-index="${index}"]`);
    const toggleBtn = document.querySelector(`.toggle-btn[data-index="${index}"]`);
    const chevron = toggleBtn.querySelector('.chevron');
    const span = toggleBtn.querySelector('span');
    
    if (state.expandedItems.has(index)) {
      elaboration.classList.add('expanded');
      chevron.classList.add('rotated');
      span.textContent = 'Hide Elaboration';
    } else {
      elaboration.classList.remove('expanded');
      chevron.classList.remove('rotated');
      span.textContent = 'Reveal Elaboration';
    }
  }
  
  function animateCards() {
    const cards = elements.namesGrid.querySelectorAll('.name-card');
    // Add visible class in batches via RAF to avoid many timers
    let i = 0;
    function step() {
      const batch = 6; // number of cards to reveal per frame
      for (let j = 0; j < batch && i < cards.length; j++, i++) {
        cards[i].classList.add('visible');
      }
      if (i < cards.length) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  
  // Search & Filter
  function handleSearch(e) {
    state.searchQuery = e.target.value.toLowerCase().trim();
    state.currentPage = 0;
    if (state.searchWorker) {
      const reqId = Date.now() + Math.random();
      state.searchWorker.postMessage({ cmd: 'search', query: state.searchQuery, language: state.language, reqId });
    } else {
      // fallback
      filterData();
      renderNames();
      updateStats();
    }
    updateClearButton();
  }
  
  function filterData() {
    if (!state.searchQuery) {
      state.filteredData = [...state.data];
      return;
    }
    
    state.filteredData = state.data.filter(entry => {
      const searchFields = [
        entry.english_name,
        entry.english_one_line,
        entry.english_elaboration,
        entry.hindi_name,
        entry.hindi_one_line,
        entry.hindi_elaboration,
        entry.index.toString()
      ];
      
      return searchFields.some(field => 
        field && field.toLowerCase().includes(state.searchQuery)
      );
    });
  }
  
  function handleLanguageChange(e) {
    state.language = e.target.value;
    renderNames();
  }
  
  function handleClear() {
    state.searchQuery = '';
    state.currentPage = 0;
    elements.searchInput.value = '';
    state.filteredData = [...state.data];
    renderNames();
    updateStats();
    updateClearButton();
  }
  
  function updateClearButton() {
    elements.clearBtn.disabled = !state.searchQuery;
  }
  
  function loadMoreNames() {
    state.currentPage++;
    renderNames();
    
    // Smooth scroll to new content
    setTimeout(() => {
      const newCard = elements.namesGrid.querySelector(`.name-card:nth-child(${state.displayedData.length - state.pageSize + 1})`);
      if (newCard) {
        newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
  
  function updateStats() {
    const totalNames = state.data.length;
    const filteredCount = state.filteredData.length;
    
    if (state.searchQuery) {
      elements.statsDisplay.innerHTML = `
        🔍 Found <strong>${filteredCount}</strong> name${filteredCount !== 1 ? 's' : ''} 
        matching "<strong>${state.searchQuery}</strong>" 
        out of <strong>${totalNames}</strong> total names
      `;
    } else {
      elements.statsDisplay.innerHTML = `
        📿 Displaying the sacred <strong>${totalNames}</strong> names of <strong>Śrī Kālabhairava</strong>
      `;
    }
  }
  
  // Theme
  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme);
    localStorage.setItem('theme', state.theme);
  }
  
  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    const sunIcon = elements.themeToggle.querySelector('.sun-icon');
    const moonIcon = elements.themeToggle.querySelector('.moon-icon');
    
    if (theme === 'dark') {
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    } else {
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    }
  }
  
  // Navigation
  function scrollToNames() {
    const namesSection = document.getElementById('names-section');
    if (namesSection) {
      namesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  
  // Error handling
  function showError(message) {
    elements.errorState.classList.remove('hidden');
    elements.errorMessage.textContent = message;
    elements.namesGrid.innerHTML = '';
  }
  
  // Ebook banner management
  function closeEbookBanner() {
    if (elements.ebookBanner) {
      elements.ebookBanner.classList.add('hidden');
      // Save preference for 30 days
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      document.cookie = `ebookBannerClosed=true; path=/; expires=${expiryDate.toUTCString()}`;
    }
  }
  
  function restoreEbookBannerVisibility() {
    const cookies = document.cookie.split(';').map(c => c.trim());
    const isClosed = cookies.some(c => c.startsWith('ebookBannerClosed=true'));
    
    if (isClosed && elements.ebookBanner) {
      elements.ebookBanner.classList.add('hidden');
    }
  }
  
  // Utility: Debounce
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

  // Lazy-load the large background image after idle/load to avoid render-blocking
  function scheduleBgLoad() {
    const loadBg = () => {
      try {
        const img = new Image();
        img.src = '/MaaAdyaKali_5.webp';
        img.onload = () => document.body.classList.add('bg-loaded');
      } catch (e) {
        // fail silently
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadBg, { timeout: 2000 });
    } else if (document.readyState === 'complete') {
      setTimeout(loadBg, 1000);
    } else {
      window.addEventListener('load', loadBg, { once: true });
      setTimeout(loadBg, 3000);
    }
  }
  
  // Scroll-triggered animations
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-scroll-animate]');
    
    if (!animatedElements.length) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(el => observer.observe(el));
  }
  
  // Start the app
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();

// chunked creation pseudo
const CHUNK = 50;
let i = 0;
function createChunk() {
  const end = Math.min(i+CHUNK, displayed.length);
  for (; i < end; i++) frag.appendChild(createNameCard(displayed[i], i));
  if (i < displayed.length) {
    requestIdleCallback(createChunk, {timeout:200});
  } else {
    namesGrid.appendChild(frag);
  }
}
// Removed stray chunked creation helper — renderNames() handles rendering
// and incremental animations. If you need chunked rendering for very large
// datasets, we can implement a proper chunked renderer that uses the
// `state` variables and encapsulated fragments defined above.
