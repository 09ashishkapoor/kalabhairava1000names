# Kalabhairava 1000 Names

A free devotional reference for the **Kalabhairava Sahasranama**: 1,000 names
of Sri Kalabhairava with English one-line meanings, longer explanations,
Devanagari, IAST transliteration and a printable PDF.

Live site: <https://bhairavakalikenamosthute.com> — deployed on Cloudflare Pages on 2026-11-07.

## Stack

- **Astro 6** static site (`output: "static"`), deployed on **Cloudflare Pages**.
- The Pothi system, plain CSS: `public/pothi-system.css` + `public/pothi-reader.css` +
  `public/theme-kalabhairava.css`. No UI framework.
- The reader is server-rendered: the first set of eleven names, their Devanagari,
  IAST, meaning and elaboration are in the HTML. Later sets load from
  `data_chunk_*.json`; the Devanagari and IAST forms come from the build mapping,
  because the runtime chunks carry only the English name and prose.
- Night reading on every page: pre-paint script in `<head>`, `pothi-theme.js`, and
  the control in the running head. Print always uses the day tokens.
- Playwright browser tests + Node unit tests, run by GitHub Actions.
- Python scripts are only used for the printable PDF build (Chrome headless via
  the PDF generator); the live site itself is pure static HTML/CSS/JS.

## Project layout

```
src/
  layouts/PothiLayout.astro          Pothi shell: head, running head, night control, colophon
  lib/staticNames.js                 data loading, 10 ranges, 91 sets, mapping join
  lib/pothi.js                       elaboration parsing, Devanagari numerals
  pages/
    index.astro                      the reader (server-rendered first set + set paging/search)
    names/                           hub, 10 range pages, 925 per-name pages
    108-names-of-kalabhairava/       108-name practice list
    1000-names-of-kalabhairava/      count explainer (1,000 / 108 / 1,008)
    kalabhairava-sahasranama-pdf/    PDF landing + archive.org editions
    kalabhairava-sahasranama-lyrics/ chant order + opening names
    kalabhairava-sahasranama-benefits/
    about/ contact/ privacy/ sources/
    404.astro                        real 404 page (dist/404.html)
  data/name-mapping.json             generated mapping (1,000 rows → 925 pages, Devanagari + IAST)
public/
  pothi-system.css                   core components
  pothi-reader.css                   reader components
  theme-kalabhairava.css             day + night tokens (the only brand file)
  pothi-theme.js                     night control
  pothi-reader.js                    set paging + in-set search
  data_manifest.json + data_chunk_*.json   reader payloads (1,000 entries)
  sw.js                              self-destruct shim for the old offline worker
  version.json                       version + build date rendered into footers
  downloads/kalabhairava-sahasranama-names.pdf
  _headers, _redirects, robots.txt, sitemap.xml, llms.txt
design-reference/port-pack-kalabhairava/   approved pack + target demo (not shipped)
docs/design-system.md                the Pothi contract
docs/night-reading.md                night palette and control behaviour
seo/
  build-name-mapping.mjs             Devanagari → common spelling, overrides, QA
  build-data-chunks.mjs              manifest + reader chunks
  build-sitemap.mjs                  sitemap (prebuild step, 946 URLs)
  build-print-pdf.mjs                Chrome-headless printable PDF (66 pages)
  extract-legacy-devanagari.mjs      one-off recovery from commit b9adb4e
  lib/transliterate.mjs              Devanagari → IAST → readable English
  data/name-overrides.json           reviewed spelling corrections
  name-mapping-report.md             QA statistics + known follow-ups
tests/                               Node unit tests for the data/parser contract
playwright-tests/                    browser smoke/a11y/visual/performance tests
docs/KALABHAIRAVA-SEO-REBUILD-GUIDE.md   the rebuild guide used for this work
```

The site has 1,000 names in 91 sets of eleven (the last set holds ten), ten
ranges of one hundred, 925 unique name pages, and 946 sitemap URLs (925 name
pages + 10 ranges + the hub, reader and sources pages + 8 existing guide/trust
pages). The legacy framework-free files remain at the repository root for
rollback until the Astro deployment is confirmed and are not part of `dist/`.


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
   `seo/name-mapping.csv`. Fix names there, never in generated pages. The
   mapping is the only source of Devanagari and IAST for the reader.
4. `seo/build-data-chunks.mjs` produces the homepage reader payloads. The
   runtime chunks carry the English meaning and elaboration; the reader joins
   them with the mapping at build time for the first set and on demand for
   later sets (`src/pages/index.astro` and `public/pothi-reader.js`).
5. `seo/build-sitemap.mjs` runs before every build and writes the 946-URL
   `public/sitemap.xml` (925 name pages + 10 ranges + 11 static/guide pages).


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
