# Plan: Implement iOS-Style Hindi Language Toggle

Create a complete Hindi translation system with a prominent iOS-style segmented control fixed in the top-right corner featuring a 2.5-second bright pulse animation on load. Remove the existing language dropdown from names section. Default to English, persist selection in localStorage. Mobile-first responsive design.

## Steps

1. **Create translation dictionary** — Build `translations.js` with all ~50-60 UI strings (landing subtitle/dedication/button, about section title/subtitle/cards/bullet points, ebook banner, search placeholder, clear/load more buttons, stats display, loading/error states, reveal/hide button text, footer credits/disclaimer) translated to Hindi.

2. **Add iOS-style toggle with bright pulse** — Create position-fixed segmented control in top-right of `index.html` with "EN | HI" labels, sliding background indicator, rounded pill design (mobile-first: top: 10px, right: 10px, min 44px touch targets, then larger on desktop), and CSS keyframe animation (1.1x scale + bright box-shadow glow, 2.5s duration, ease-out) that plays once on load.

3. **Remove existing language dropdown** — Delete the language selector dropdown from names explorer section (`index.html` lines 365-368) and remove associated event handlers and DOM references from `app.js` (line 67 and related code).

4. **Build i18n system** — Create `i18n.js` with translation lookup function, `translatePage()` to update all `data-i18n` elements, localStorage persistence (`selectedLanguage` key), update `<html lang>` attribute (en/hi), and initialize with saved preference on page load.

5. **Mark translatable content** — Add `data-i18n="section.key"` attributes throughout `index.html` to all static text elements (headings, paragraphs, buttons, input placeholders, spans, footer text), ensuring every user-facing string has a translation key.

6. **Integrate with app state** — Modify `app.js` to import i18n, connect toggle button click to language state (line 17), call `translatePage()` on language change, update dynamic text generation (stats lines 330-341, card buttons lines 215-216), and load saved preference from localStorage on initialization.

7. **Style toggle and animation** — Add CSS in `navigation.css` for iOS segmented control with mobile-first approach (position: fixed with appropriate spacing, z-index: 1000, pill shape, 0.3s ease-in-out transition for sliding background) plus pulse keyframe animation (scale: 1.1, bright box-shadow, 2.5s duration, ease-out).

## Notes

- Mobile-first responsive design
- Hindi translations will be reviewed by native speaker after implementation
- Animation timing follows best practices (2.5s duration, ease-out easing)
- Toggle stays fixed at top during scroll
- Shareable links remain in English (no URL parameters for language)
