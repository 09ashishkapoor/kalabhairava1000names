/**
 * Minimal i18n wrapper for the English-only site.
 */

(function() {
  'use strict';

  const currentLanguage = 'en';

  function init() {
    document.documentElement.setAttribute('lang', currentLanguage);
    translatePage();
    console.log('✅ i18n initialized, language:', currentLanguage);
  }

  function getCurrentLanguage() {
    return currentLanguage;
  }

  function setLanguage() {
    // English-only site: keep API surface stable but ignore switches.
  }

  function t(key) {
    if (!window.translations || !window.translations[currentLanguage]) {
      return key;
    }

    const keys = key.split('.');
    let value = window.translations[currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    return value;
  }

  function translatePage() {
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = t(key);

      if (translation && translation !== key) {
        const attrName = element.getAttribute('data-i18n-attr');

        if (attrName) {
          element.setAttribute(attrName, translation);
        } else {
          element.innerHTML = translation;
        }
      }
    });
  }

  function formatMessage(template, params) {
    let result = template;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  }

  function getStatsMessage(searchQuery, filteredCount, totalCount) {
    if (searchQuery) {
      return formatMessage(t('names.statsSearch'), {
        count: filteredCount,
        plural: filteredCount === 1 ? '' : 's',
        query: searchQuery,
        total: totalCount
      });
    }

    return formatMessage(t('names.statsDisplay'), {
      total: totalCount
    });
  }

  function getRevealButtonText(isExpanded) {
    return isExpanded ? t('names.hideButton') : t('names.revealButton');
  }

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
