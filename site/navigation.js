/**
 * Vanilla JS Mobile Navigation for Kalabhairava Sahasranama
 * Pure JavaScript - no dependencies, no framework issues
 */

(function() {
  'use strict';
  
  // Wait for DOM to be ready
  function init() {
    // Create navigation buttons
    createNavigationButtons();
    
    // Set up scroll detection
    setupScrollDetection();
    
    console.log('✅ Navigation system initialized');
  }

  // Exposed toggle handler so the button can reference it immediately
  // even if `setupScrollDetection` hasn't finished wiring observers.
  function toggleScroll() {
    const namesSection = document.getElementById('names-section');
    if (!namesSection) return scrollToNames();

    const rect = namesSection.getBoundingClientRect();
    const shouldScrollDown = rect.top > window.innerHeight * 0.3;

    if (shouldScrollDown) {
      scrollToNames();
    } else {
      scrollToTop();
    }
  }
  
  function createNavigationButtons() {
    // Single toggle button that switches between DOWN and UP states to avoid overlap/confusion
    const toggleButton = document.createElement('button');
    toggleButton.id = 'nav-toggle-button';
    toggleButton.className = 'nav-button nav-down';
    toggleButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <polyline points="19 12 12 19 5 12"></polyline>
      </svg>
    `;
    toggleButton.setAttribute('aria-label', 'Go to names');
    toggleButton.setAttribute('title', 'Explore sacred names');
    // Attach click handler. toggleScroll is hoisted below so it's available
    toggleButton.onclick = toggleScroll;

    document.body.appendChild(toggleButton);
  }
  
  function setupScrollDetection() {
    // Use a single toggle button to avoid overlapping icons
    const toggleButton = document.getElementById('nav-toggle-button');

    function setButtonToUp() {
      if (!toggleButton) return;
      toggleButton.classList.remove('nav-down');
      toggleButton.classList.add('nav-up');
      toggleButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="19" x2="12" y2="5"></line>
          <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
      `;
      toggleButton.setAttribute('aria-label', 'Back to top');
      toggleButton.setAttribute('title', 'Back to landing page');
    }

    function setButtonToDown() {
      if (!toggleButton) return;
      toggleButton.classList.remove('nav-up');
      toggleButton.classList.add('nav-down');
      toggleButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
      `;
      toggleButton.setAttribute('aria-label', 'Go to names');
      toggleButton.setAttribute('title', 'Explore sacred names');
    }

    // toggleScroll is defined in outer scope (hoisted) so the button
    // can safely reference it even before setupScrollDetection completes.

    const namesSection = document.getElementById('names-section');
    if (!namesSection) {
      // If section not present yet, poll a few times without blocking layout
      let tries = 0;
      const t = setInterval(() => {
        const ns = document.getElementById('names-section');
        tries++;
        if (ns) {
          clearInterval(t);
          setupObserver(ns);
        } else if (tries > 10) {
          clearInterval(t);
        }
      }, 300);
      return;
    }

    function setupObserver(target) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const showUp = entry.intersectionRatio > 0.3 && entry.boundingClientRect.top < window.innerHeight;
          if (showUp) setButtonToUp(); else setButtonToDown();
        });
      }, { threshold: [0, 0.15, 0.3, 0.5] });

      observer.observe(target);
      // Initial evaluation
      const rect = target.getBoundingClientRect();
      const initiallyShowUp = rect.top < window.innerHeight * 0.7;
      if (initiallyShowUp) setButtonToUp(); else setButtonToDown();
    }

    setupObserver(namesSection);
  }
  
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
  
  function scrollToNames() {
    const namesSection = document.getElementById('names-section');
    if (namesSection) {
      namesSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

<script>
  (function(){
    if ('requestIdleCallback' in window) {
      requestIdleCallback(function(){
        var s = document.createElement('script');
        s.src = '/navigation.js?v=2';
        s.defer = true;
        document.body.appendChild(s);
      }, {timeout:2000});
    } else {
      var s = document.createElement('script');
      s.src = '/navigation.js?v=2';
      s.defer = true;
      document.body.appendChild(s);
    }
  })();
</script>
