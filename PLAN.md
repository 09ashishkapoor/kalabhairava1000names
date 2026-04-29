# Plan: remove Hindi mode and Hindi SEO content

## Context
- The site currently ships an English/Hindi language toggle on the homepage and bilingual content across the interactive reader and generated static `/names/` pages.
- You want Hindi mode removed because it is costly to maintain.
- SEO artifacts also need to be updated so the site no longer advertises bilingual/Hindi content.
- The `/names/` hub and `/names/<range>/` pages are the “knowledge hub pages” to update.
- I checked the canonical dataset shape: all 1000 entries have populated `english_name`, `english_one_line`, and `english_elaboration` fields, so the English meanings/elaborations are standalone and do not depend on the Hindi UI mode.

## Approach
- Remove the runtime language-switching UI/behavior from the homepage and leave the site English-only.
- Simplify the reader so it always renders English fields and no longer depends on Hindi translations for UI state or persisted locale storage.
- Narrow search/display behavior to English-only fields so Hindi content is no longer surfaced in the interactive reader.
- Update homepage metadata/schema/social tags and manifest copy so they describe the site as English-only.
- Update the generator so future `/names/` hub and range pages are emitted as English-only, then regenerate those pages and the sitemap.
- Update tests/docs that currently assume bilingual behavior.

## Files to modify
- `index.html`
- `app.js`
- `i18n.js`
- `translations.js`
- `generate_loading_artifacts.py`
- `manifest.webmanifest`
- `names/index.html`
- `names/*/index.html`
- `sitemap.xml`
- `README.md`
- `package.json`
- `tests/e2e/site-smoke.spec.js`
- `tests/test_repo_smoke.py`

## Reuse
- Existing reader rendering in `app.js` already chooses between `english_*` and `hindi_*` fields; that logic can be reduced to the English path instead of rewriting the reader.
- Existing search flow in `app.js` / `search-worker.js` already indexes canonical dataset fields; the searchable fields can be narrowed instead of rebuilding search.
- Existing static page generation in `generate_loading_artifacts.py` already owns `/names/` page output and `sitemap.xml`; it should be the single place to remove Hindi SEO/static copy and regenerate artifacts.
- Existing repo smoke tests in `tests/test_repo_smoke.py` already validate generated pages and sitemap coverage; they can be updated to assert the English-only output.

## Steps
- [ ] Remove homepage language toggle markup and Hindi-facing UI copy from `index.html`.
- [ ] Simplify `i18n.js` / `translations.js` to English-only behavior, including removing persisted Hindi locale handling.
- [ ] Update `app.js` so cards, stats, button labels, and search use English-only fields and no longer listen for language switching.
- [ ] Update homepage SEO/social/schema/PWA copy in `index.html` and `manifest.webmanifest` to remove Hindi/bilingual claims (`Hindi meanings`, `inLanguage: ["en","hi"]`, `og:locale:alternate`, etc.).
- [ ] Update `generate_loading_artifacts.py` to emit English-only `/names/` hub and range pages.
- [ ] Regenerate `names/` pages and `sitemap.xml` from the updated generator.
- [ ] Update automated tests/docs that currently reference Hindi or locale switching.

## Verification
- Load `/` and confirm there is no language toggle and the reader/search/cards render correctly in English.
- Search for several entries and confirm results still work using English names/meanings only.
- Load `/names/` and several range pages and confirm English-only explanatory copy/metadata.
- Check homepage HTML, manifest, and generated names pages for removed Hindi SEO phrases (`Hindi meanings`, `inLanguage ["en","hi"]`, `og:locale:alternate`, etc.).
- Run repo smoke tests and the Playwright smoke suite.