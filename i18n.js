/**
 * Internationalization (i18n) System
 * Handles language switching and content translation
 */

(function() {
  'use strict';

  // State
  let currentLanguage = 'en'; // Default to English
  const STORAGE_KEY = 'selectedLanguage';

  // Initialize i18n system
  function init() {
    // Load saved language preference
    try {
      const savedLanguage = localStorage.getItem(STORAGE_KEY);
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'hi')) {
        currentLanguage = savedLanguage;
      }
    } catch (e) {
      // localStorage not available (e.g., incognito mode)
      console.warn('localStorage not available, using default language');
    }

    // Update HTML lang attribute
    updateHtmlLang();

    // Translate the page
    translatePage();

    console.log('✅ i18n system initialized, language:', currentLanguage);
  }

  // Get current language
  function getCurrentLanguage() {
    return currentLanguage;
  }

  // Set language and update page
  function setLanguage(lang) {
    if (lang !== 'en' && lang !== 'hi') {
      console.warn('Invalid language:', lang);
      return;
    }

    currentLanguage = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      // localStorage not available
      console.warn('localStorage not available, language preference not saved');
    }
    updateHtmlLang();
    translatePage();

    // Dispatch custom event for other parts of the app to listen to
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language: lang }
    }));
  }

  // Update HTML lang attribute
  function updateHtmlLang() {
    document.documentElement.setAttribute('lang', currentLanguage);
  }

  // Get translation for a key
  function t(key) {
    if (!window.translations) {
      console.warn('Translations not loaded');
      return key;
    }

    const keys = key.split('.');
    let value = window.translations[currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn('Translation key not found:', key);
        return key;
      }
    }

    return value;
  }

  // Translate all elements with data-i18n attribute
  function translatePage() {
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = t(key);

      if (translation && translation !== key) {
        // Check if element has data-i18n-attr to specify which attribute to translate
        const attrName = element.getAttribute('data-i18n-attr');

        if (attrName) {
          // Translate specific attribute (e.g., placeholder, title, aria-label)
          element.setAttribute(attrName, translation);
        } else {
          // Translate innerHTML (supports HTML tags in translations)
          element.innerHTML = translation;
        }
      }
    });
  }

  // Format dynamic content with placeholders
  function formatMessage(template, params) {
    let result = template;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  }

  // Get translated stats display message
  function getStatsMessage(searchQuery, filteredCount, totalCount) {
    if (searchQuery) {
      const template = t('names.statsSearch');
      const plural = currentLanguage === 'hi' 
        ? (filteredCount === 1 ? '' : '') 
        : (filteredCount === 1 ? '' : 's');
      
      return formatMessage(template, {
        count: filteredCount,
        plural: plural,
        query: searchQuery,
        total: totalCount
      });
    } else {
      const template = t('names.statsDisplay');
      return formatMessage(template, {
        total: totalCount
      });
    }
  }

  // Get translated button text
  function getRevealButtonText(isExpanded) {
    return isExpanded ? t('names.hideButton') : t('names.revealButton');
  }

  // Export public API
  window.i18n = {
    init,
    getCurrentLanguage,
    setLanguage,
    t,
    translatePage,
    formatMessage,
    getStatsMessage,
    getRevealButtonText
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // If translations aren't loaded yet, wait a bit
    if (!window.translations) {
      setTimeout(init, 100);
    } else {
      init();
    }
  }

})();
