/**
 * Vanilla JS mobile navigation
 */

(function() {
  'use strict';

  const NAVIGATION_BUTTONS = [
    {
      id: 'nav-up-button',
      className: 'nav-button nav-up hidden',
      labelKey: 'navigation.backToTop',
      titleKey: 'navigation.backToTopTitle',
      onClick: scrollToTop,
      icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="19" x2="12" y2="5"></line>
          <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
      `
    },
    {
      id: 'nav-down-button',
      className: 'nav-button nav-down',
      labelKey: 'navigation.goToNames',
      titleKey: 'navigation.goToNamesTitle',
      onClick: scrollToNames,
      icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
      `
    }
  ];

  function init() {
    createNavigationButtons();
    setupScrollDetection();
  }

  function updateNavigationText() {
    NAVIGATION_BUTTONS.forEach(({ id, labelKey, titleKey }) => {
      applyNavigationText(document.getElementById(id), labelKey, titleKey);
    });
  }

  window.updateNavigationText = updateNavigationText;

  function createNavigationButtons() {
    NAVIGATION_BUTTONS.forEach((config) => {
      document.body.appendChild(createNavigationButton(config));
    });
  }

  function applyNavigationText(button, labelKey, titleKey) {
    if (!button || typeof getTranslation !== 'function') return;
    button.setAttribute('aria-label', getTranslation('english', labelKey));
    button.setAttribute('title', getTranslation('english', titleKey));
  }

  function createNavigationButton({ id, className, icon, labelKey, titleKey, onClick }) {
    const button = document.createElement('button');
    button.id = id;
    button.className = className;
    button.innerHTML = icon;
    button.onclick = onClick;
    applyNavigationText(button, labelKey, titleKey);
    return button;
  }

  function setupScrollDetection() {
    let ticking = false;
    let namesSection = document.getElementById('names-section');
    const upButton = document.getElementById('nav-up-button');
    const downButton = document.getElementById('nav-down-button');

    if (!upButton || !downButton) return;

    let namesSectionTop = null;
    let lastState = null;

    function computeNamesTop() {
      namesSection = document.getElementById('names-section');
      if (!namesSection) return null;
      let el = namesSection;
      let top = 0;
      while (el) {
        top += el.offsetTop;
        el = el.offsetParent;
      }
      namesSectionTop = top;
      return namesSectionTop;
    }

    let resizeTimer = null;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        computeNamesTop();
        requestUpdate();
      }, 120);
    }

    function updateNavigation() {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;

      if (namesSectionTop === null) {
        if (computeNamesTop() === null) {
          setTimeout(requestUpdate, 500);
          ticking = false;
          return;
        }
      }

      const threshold = namesSectionTop - (windowHeight * 0.3);
      const inNamesSection = scrollPosition > threshold;

      if (inNamesSection !== lastState) {
        if (inNamesSection) {
          upButton.classList.remove('hidden');
          downButton.classList.add('hidden');
        } else {
          upButton.classList.add('hidden');
          downButton.classList.remove('hidden');
        }
        lastState = inNamesSection;
      }

      ticking = false;
    }

    function requestUpdate() {
      if (!ticking) {
        window.requestAnimationFrame(updateNavigation);
        ticking = true;
      }
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    computeNamesTop();
    requestUpdate();
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
