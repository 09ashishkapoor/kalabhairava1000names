# Kalabhairava 1000 Names

A free devotional reference for the **Kalabhairava Sahasranama**: 1,000 names
of Sri Kalabhairava with English one-line meanings, longer explanations,
Devanagari, IAST transliteration and a printable PDF.

Live site: <https://bhairavakalikenamosthute.com>

## Stack

- **Astro 6** static site (`output: "static"`), deployed on **Cloudflare Pages**.
- Plain CSS (`public/reference.css` + the homepage stylesheets), no UI framework.
- Small vanilla JS reader on the homepage; static HTML for all reference pages.
- Playwright browser tests + Node unit tests, run by GitHub Actions.
- Python scripts are only used for the printable PDF build (Chrome headless via
  the PDF generator); the live site itself is pure static HTML/CSS/JS.

## Project layout

```
src/
  layouts/ReferenceLayout.astro      header/footer/meta chrome for all non-home pages
  lib/staticNames.js                 data loading, ranges, mapping helpers
  pages/
    index.astro                      searchable reading UI (client-side JS)
    names/                           hub, 10 range pages, 925 per-name pages
    108-names-of-kalabhairava/       108-name practice list
    1000-names-of-kalabhairava/      count explainer (1,000 / 108 / 1,008)
    kalabhairava-sahasranama-pdf/    PDF landing + archive.org editions
    kalabhairava-sahasranama-lyrics/ chant order + opening names
    kalabhairava-sahasranama-benefits/
    about/ contact/ privacy/ sources/
  data/name-mapping.json             generated name mapping (1,000 rows → 925 pages)
public/
  reference.css                      sister-site design system
  data_manifest.json + data_chunk_*.json   reader payloads (1,000 entries)
  sw.js                              offline service worker
  version.json                       version + build date rendered into footers
  downloads/kalabhairava-sahasranama-names.pdf
  _headers, _redirects, robots.txt, sitemap.xml, llms.txt
seo/
  build-name-mapping.mjs             Devanagari → common spelling, overrides, QA
  build-data-chunks.mjs              manifest + reader chunks
  build-sitemap.mjs                  sitemap (prebuild step)
  build-print-pdf.mjs                Chrome-headless printable PDF (66 pages)
  extract-legacy-devanagari.mjs      one-off recovery from commit b9adb4e
  lib/transliterate.mjs              Devanagari → IAST → readable English
  data/name-overrides.json           reviewed spelling corrections
  name-mapping-report.md             QA statistics + known follow-ups
tests/                               Node unit/regression tests
playwright-tests/                    browser smoke/a11y/visual/performance tests
docs/KALABHAIRAVA-SEO-REBUILD-GUIDE.md   the rebuild guide used for this work
```

The legacy framework-free site files are kept at the repository root for
rollback until the first Astro deployment is confirmed. They are not used by
the Astro build and are not part of the deployed output.

## Commands

```bash
npm install
npm run dev            # Astro dev server
npm run build          # sitemap prebuild + static build into dist/
npm run preview        # preview dist/ on localhost
npm run validate       # unit tests + syntax check + build + Playwright browser suite
npm run test:unit
npm run test:browser
npm run test:browser:update   # refresh Playwright visual baselines
node seo/build-name-mapping.mjs   # regenerate name mapping from data/overrides
node seo/build-print-pdf.mjs      # regenerate the printable PDF
```

## Data pipeline

1. `sahasranama_meanings.json` (root) is the canonical dataset: 1,000 entries
   with `index`, `english_name`, `english_one_line`, `english_elaboration`.
2. Devanagari names come from the legacy commit `b9adb4e` (Hindi UI/prose is
   not restored — only the name spelling field). `seo/extract-legacy-devanagari.mjs`
   regenerates `seo/data/legacy-devanagari-names.json`.
3. `seo/build-name-mapping.mjs` produces `src/data/name-mapping.json` and
   `seo/name-mapping.csv`. Fix names there, never in generated pages.
4. `seo/build-data-chunks.mjs` produces the homepage reader payloads.

## Deployment

Cloudflare Pages (detailed checklist in [`DEPLOYMENT.md`](DEPLOYMENT.md)):

- Build command: `npm run build`
- Build output directory: `dist`
- Node version: 22 (`HUSKY=0` so the version-bump hook is skipped in CI)

Owner-specific external steps (search console, archive links, cache rules) are
tracked in [`seo/owner-actions.md`](seo/owner-actions.md).

## Licensing / reuse

Free for personal devotional reading and study. Please link to the canonical
pages rather than redistributing modified copies. See `/sources/` on the site for
source and citation notes.
