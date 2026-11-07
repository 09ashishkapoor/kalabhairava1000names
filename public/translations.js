/**
 * English-only UI copy helpers for Ādya Mahākālī Sahasranāma Website
 */

const translations = {
  english: {
    seo: {
      title: 'Adya Mahakali 1000 Names - Complete Sahasranama with Meanings in English',
      description: 'Complete Adya Mahakali 1000 Names (Sahasranama) with detailed meanings in English. Explore all 1000+ sacred names of Maa Adya Mahakali with translations, elaborations, and spiritual insights for devotion and chanting.'
    },
    navigation: {
      backToTop: 'Back to top',
      backToTopTitle: 'Back to landing page',
      goToNames: 'Go to names',
      goToNamesTitle: 'Explore sacred names'
    }
  }
};

function getTranslation(_lang, key) {
  const keys = key.split('.');
  let value = translations.english;

  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key;
    }
  }

  return value || key;
}

function t(key) {
  return getTranslation('english', key);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { translations, getTranslation, t };
}
