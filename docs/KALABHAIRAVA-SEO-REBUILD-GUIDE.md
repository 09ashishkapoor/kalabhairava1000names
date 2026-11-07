# Kalabhairava 1000 Names — SEO rebuild implementation guide

**Target:** `https://github.com/09ashishkapoor/kalabhairava1000names` (live at `https://bhairavakalikenamosthute.com`)
**Reference implementation (copy from here):** `C:\Users\kalbhairav\Documents\1000namesofmaadya` — branch `main`, commit `e9b58a3` (the 1000namesofmakali.com site)
**Written:** 2026-11-07

This guide documents every SEO/quality improvement made to the Adya Mahakali site and how to reproduce
them on the Kalabhairava site. The two repos are different stacks, so the **recommended path is a rebuild**
(reusing the Astro codebase), not a copy-patch of the old site. The owner has agreed that a redesign is
acceptable if it makes the codebase simpler to maintain.

---

## 1. Recommendation (read this first)

**Do:** rebuild `kalabhairava1000names` as an Astro site by copying the working `1000namesofmaadya`
template and replacing the content/data/brand. This gives both sister sites one maintainable architecture,
one static-page generator pipeline, one design system, and one validation stack.

**Do not:** try to add per-name pages, landing pages, schema, sitemap generation and the PDF pipeline on
top of the current `generate_loading_artifacts.py` + hand-written HTML setup. It would work, but it leaves
two completely different codebases to maintain and does not deliver the “simple and easy to maintain”
goal.

**Fallback (only if the Astro deploy is blocked):** extend the Python generator. See §12 for the minimum
fallback path. Treat it as a temporary bridge.

### Why a rebuild is realistic

- The reference repo is small and already produces this exact feature set.
- The Kalabhairava dataset has **the same four fields** as the Makali dataset
  (`index`, `english_name`, `english_one_line`, `english_elaboration`), so the data layer ports directly.
- The reference content pages are generic (“names of Maa Kali”) and need find/replace + rewritten copy,
  but the page templates, mapping pipeline, sitemap builder, PDF builder and tests are reusable.
- The old URLs (`/`, `/names/`, `/names/1-100/` …) can be preserved, so the rebuild does not have to
  sacrifice existing indexing.

### Effort estimate

One focused agent session for the scaffold + data + per-name pages, a second for landing pages/copy/PDF +
deploy + measurement. Use Agent Teams if available: Lead (integration/deploy), data/mapping teammate,
pages/landing teammate, copy/PDF teammate. The reference repo is the source of truth for all scripts.

---

## 2. Current state of both sites (audit summary)

| Item | Makali reference (done) | Kalabhairava (current) |
|---|---|---|
| Stack | Astro static, Node scripts | Framework-free static HTML/JS + Python generator |
| Domain | 1000namesofmakali.com | **bhairavakalikenamosthute.com** |
| Live URLs in sitemap | **1,061** | **12** (home, names hub, 10 ranges) |
| Individual name pages | **1,039** | none |
| Landing pages | 108, 1008, PDF, lyrics, benefits | none |
| Trust pages | about, contact, privacy, sources | only inline disclaimer; `info.html` redirect |
| Homepage reader | Astro + vanilla JS | hand-written `index.html` + `app.js` + workbox SW |
| Version footer | build-rendered V1.53 / Nov 7, 2026 | client-fetch, live shows **v1.43 / 2026-05-04** (stale) |
| SVG/image alt text | images with alt on key pages | — |
| PDF | on-domain printable 68-page PDF + landing page | none |
| Validation | Node unit + Playwright (smoke/a11y/visual/perf) + lychee CI | pytest + Playwright + visual | 
| Dataset | 1,072 positions / 1,039 unique | **1,000 positions / 925 unique** (75 repeats) |
| Devanagari names | recovered from legacy git data | **recoverable from git history** (see §5) |

The Kalabhairava site already has decent baseline SEO (canonical, robots, JSON-LD on ranges, sitemap,
noindex data files). The missing pieces are exactly the ones the Makali plan added: long-tail pages,
head-term landing pages, internal linking, E-E-A-T pages, on-domain PDF, refreshed sitemap, and reliable
version/cache behaviour.

---

## 3. Target URL architecture

Keep existing URLs (they are already indexed) and add:

```
/                                    (interactive reader — rebuild from reference homepage)
/names/                              (names hub)
/names/1-100/ … /names/901-1000/     (existing 10 range pages — same URLs, regenerated)
/names/<slug>/                       (NEW: 925 unique name pages, e.g. /names/bhairavaya/)
/108-names-of-kalabhairava/          (NEW head-term page)
/1000-names-of-kalabhairava/         (NEW: count explainer — 1000 vs 108 vs 1008)
/kalabhairava-sahasranama-pdf/       (NEW: PDF downloads; replaces “no PDF” state)
/kalabhairava-sahasranama-lyrics/    (NEW)
/kalabhairava-sahasranama-benefits/  (NEW)
/about/  /contact/  /privacy/        (NEW trust pages)
/sources/                            (NEW editorial/source page)
/pdf/                                (301 → /kalabhairava-sahasranama-pdf/)
/info.html                           (301 → /about/)
```

Open Graph / canonical / robots rules: copy the reference implementation exactly.
`SITE_URL` must become `https://bhairavakalikenamosthute.com` everywhere; check the reference repo for
hardcoded `1000namesofmakali.com` and `1000 Names of Maa Kali` strings.

---

## 4. Reference implementation — files to copy and adapt

Copy the reference repo into the new workspace as the starting point (do not copy `node_modules`, `.git`,
`dist`). Then replace data/content. Use the reference as a **template**, not as a second live site.

### 4.1 Copy as-is (or trivial edits)

| Reference path | Purpose |
|---|---|
| `package.json`, `package-lock.json` | Astro + Playwright deps; rename package, keep scripts (`prebuild`, `build`, `validate`, `test:*`) |
| `astro.config.mjs` | static output |
| `src/layouts/ReferenceLayout.astro` | sister-site chrome for all non-landing pages (header/footer/skip link/font links) |
| `public/reference.css` | full sister-site design system for static pages |
| `src/lib/staticNames.js` | range/hub data helpers + mapping loader; **change file names/SITE_URL** |
| `seo/lib/transliterate.mjs` | Devanagari → IAST → readable English; reuse unchanged |
| `seo/build-name-mapping.mjs` | mapping generator; **change count/ref/output paths** |
| `seo/build-sitemap.mjs` | sitemap generator; **change URLs/counts** |
| `seo/build-print-pdf.mjs` | printable PDF generator; **change title/cover image/count** |
| `public/sw.js` | fixed service worker (no version.json caching, query-aware cache keys) |
| `tests/ux-structure.test.js` (adapted), `playwright-tests/*` | validation stack |
| `.github/workflows/validation.yml` | CI: npm validate + lychee link check |
| `seo/owner-actions.md` | external steps checklist; adapt for the new site |
| `seo/name-mapping-report.md` | QA methodology for the mapping |

### 4.2 Copy and rewrite content (same markup, new copy)

- `src/pages/index.astro` — interactive homepage reader (keep structure; change title, brand, meta,
  hero copy, images, and data file names).
- `public/app.js`, `public/search.js`, `public/navigation.js`, `public/translations.js`,
  `public/styles.css` / `styles.min.css`, `public/navigation.min.css` — homepage reader shell.
  Prefer the reference versions (they are already wired to the chunked-data model) over the legacy
  Kalabhairava `app.js`; check feature parity (search, 11-per-page reading, elaboration reveal, PWA).
- `src/pages/names/index.astro`, `src/pages/names/[range].astro` — copy; update copy words
  (“Maa Kali” → “Kalabhairava”), labels, `SITE_URL`.
- `src/pages/names/[name].astro` — copy; update copy and schema language.
- `src/pages/108-names-of-kali/`, `1008-names-of-kali/`, `kali-sahasranama-pdf/`,
  `kali-sahasranama-lyrics/`, `kali-sahasranama-benefits/` — **do not copy wholesale**; use as templates
  and rewrite for Kalabhairava (see §8).
- `src/pages/about/`, `contact/`, `privacy/`, `sources/` — copy; update author/tradition details.
- `README.md`, `docs/validation-baseline.md`, `.gitignore` — adapt.

### 4.3 Do not copy

- Makali content: names, meanings, Devanagari mapping, PDF, images, `public/downloads/*.pdf`,
  `src/data/name-mapping.json`, `seo/data/legacy-devanagari-names.json`, `seo/data/name-overrides.json`,
  `seo/name-mapping.csv`, `search-quality` results, any `MaaAdyaKali_5.webp` usage as the Kalabhairava
  hero/PDF image.
- The old Kalabhairava site's `names/` generated directory and `data/name-chunks/` — these are outputs of
  the retired pipeline; the Astro build will generate replacements. Keep the source
  `sahasranama_meanings.json` as the dataset.

---

## 5. Data migration and the name mapping (the critical path)

### 5.1 Current dataset

`kalabhairava1000names/sahasranama_meanings.json`:
- 1,000 entries: `index`, `english_name`, `english_one_line`, `english_elaboration`.
- 925 unique `english_name` values; **75 positions repeat a name** (some 3×). Repeated names share one
  page and list every occurrence, exactly like the reference mapping does.
- Names are transliterated dative forms in ALL CAPS, e.g. `BHAIRAVAAYA`, `BHUUTANAATHAAYA`, `KAPAYE`,
  `BHAKTAANAAM SVARNADAAYAKAAYA`.
- 909/1000 elaborations contain proper IAST diacritics (useful for QA), 166 contain Devanagari fragments.

### 5.2 Recover the 1,000 Devanagari names from git history

The Hindi fields were removed in a later commit, but the previous dataset still has them. Verified in this
audit: commit **`b9adb4e`** contains `hindi_name`, `hindi_one_line`, `hindi_elaboration` for all 1,000 rows.
(Old `english_name` values are mixed-case, e.g. `Bhairavaaya`; match by `index`, not by name.)

In the new workspace, extract just the names into a cache file:

```bash
# from the repo root
git show b9adb4e:sahasranama_meanings.json > /tmp/kalabhairava-legacy.json
node -e "
  const fs = require('fs');
  const legacy = JSON.parse(fs.readFileSync('/tmp/kalabhairava-legacy.json','utf8'));
  const out = legacy.map(e => ({ index: Number(e.index), hindi_name: String(e.hindi_name||'').trim() }));
  fs.mkdirSync('seo/data', { recursive: true });
  fs.writeFileSync('seo/data/legacy-devanagari-names.json', JSON.stringify(out, null, 1) + '\n');
  console.log('extracted', out.length, 'Devanagari names');
"
```

Do **not** restore `hindi_one_line` / `hindi_elaboration` — English-only site, consistent with the
owner's decision for the sister project. Only the name spelling field is used.

If the git history is ever unavailable, fallback order: (1) the owner's Hindi/Kalabhairava ebook on
archive.org, (2) IAST mentions inside the English elaborations, (3) ship English-only name pages first
and add Devanagari later.

### 5.3 Generate the mapping

Adapt `seo/build-name-mapping.mjs` from the reference:

1. **Constants**: point `CURRENT_DATA` at `sahasranama_meanings.json`; `LEGACY_CACHE` at
   `seo/data/legacy-devanagari-names.json`; `MAPPING_OUT` at `src/data/name-mapping.json`; `CSV_OUT` at
   `seo/name-mapping.csv`.
2. Remove the commit-extraction fallback (`LEGACY_REF`) or point it at `b9adb4e:sahasranama_meanings.json`.
3. Change the expected count from 1,072 to **1,000**.
4. Regenerate and check the summary report:
   - rows 1,000 → unique page groups **~925** (expect ~64 duplicate groups / 75 extra positions, some
     names appearing 3×).
   - text-match QA should find ~900+/1000 entries in the elaborations (the reference pipeline collapses
     diacritic/spelling drift).
5. Add `seo/data/name-overrides.json` for any legacy Devanagari rows that are wrong (the reference site
   needed 21 corrections; expect a similar small set here). Review the lowest-similarity rows plus the
   no-text-match list from the generator output — that is how the reference corrections were found.
6. **Dative-name variants:** each entry is a dative form (“Bhairavāya”). In the mapping, variants should
   include the stem form where it is a real Sanskrit word, e.g.:
   - common: `Bhairavaya`
   - also spelled: `BHAIRAVAAYA`, `Bhairavāya`
   - stem variant for search: `Bhairava`
   Do this programmatically (strip final `-āya/-āyaḥ` → base) and only keep the result when it differs.
   This matters because Indian readers search “Bhairava”, not “Bhairavaya”.
7. Sanity-check names 1, 500, 1000 in the CSV against the elaboration text and the legacy Devanagari.
8. Commit `src/data/name-mapping.json`, `seo/name-mapping.csv`, `seo/name-mapping-report.md`,
   `seo/data/legacy-devanagari-names.json`, `seo/data/name-overrides.json`.

Expected output: **925 unique name pages**, URLs like `/names/bhairavaya/`, deduplicated repeated names
sharing a page that lists positions (e.g. `BHOKTRE` at two positions).

### 5.4 Data artifacts for the homepage reader

The reference homepage loads `public/data_manifest.json` + `public/data_chunk_*.json` + first chunk.
Write a one-off `seo/build-data-chunks.mjs` (or adapt the reference `scripts/update-english-data-from-text.js`)
that reads `sahasranama_meanings.json` and emits:

- `public/data_manifest.json`: `{ total: 1000, chunks: 5, chunk_size: 200, files: ["data_chunk_1.json", …] }`
- `public/data_chunk_1..5.json`: 200 entries each (last one 200 exactly; 5×200 = 1000)
- keep `sahasranama_meanings.json` in the repo root as the canonical source (or move to `public/` and
  point all scripts at it; keep one canonical copy only).

Update the reference code constants accordingly:
- `src/lib/staticNames.js` — `MANIFEST_PATH`, `MAPPING_PATH`, `SITE_URL`.
- `src/pages/index.astro` — chunk file path, manifest, title/meta, hero copy, site name.
- `seo/build-name-mapping.mjs` — `CURRENT_DATA`.
- `seo/build-sitemap.mjs` — `SITE_URL`, static page lists, total count.
- `seo/build-print-pdf.mjs` — `MANIFEST_PATH`, `MAPPING_PATH`, cover title, cover image, count checks.

---

## 6. Rebuild phases (recommended order)

### Phase 0 — Setup and baseline (30–60 min)

1. New local workspace: clone the Kalabhairava repo, create branch `seo/rebuild`, tag the current state:
   ```bash
   git clone https://github.com/09ashishkapoor/kalabhairava1000names.git
   cd kalabhairava1000names
   git tag pre-seo-rebuild
   git checkout -b seo/rebuild
   ```
2. Copy the SEO baseline tooling from the reference workspace:
   `search-quality/` (3 scripts) → `search-quality/`; edit their constants:
   - `SITE = 'bhairavakalikenamosthute.com'`
   - archive.org identifiers for the Kalabhairava items
     (`Kalabhairava-sahasranama-kaliputraashish`, `Kalabhairava-sahasranama-in-Hindi-kaliputraashish`)
   - GitHub owner already matches.
3. Record the pre-rebuild baseline (already measured here):
   - live sitemap: **12 URLs**
   - live `version.txt`: `v1.43`, `last-updated.txt`: `2026-05-04`
   - run `node search-quality/longtail.mjs` and save the output (site should be absent for most queries).
4. Copy the reference repo files per §4 into the new workspace (overlay, do not merge blindly).

### Phase 1 — Astro scaffold + data (half session)

1. Bring over `package.json` (Astro 6, scripts), `astro.config.mjs`, `src/layouts`, `src/lib`,
   `public/reference.css`, `public/sw.js`, validation configs and workflows.
2. Convert the dataset into chunks/manifest (§5.4) and point code at the new files.
3. Run `npm install` (Node 22) and confirm `npm run build` succeeds with placeholder pages.
4. First smoke test: `npm run dev`, load `/names/1-100/` — the range page must render the Kalabhairava names.

### Phase 2 — Mapping + name pages (core SEO)

1. Run the adapted `seo/build-name-mapping.mjs`; review the stats and flagged rows (§5.3).
2. Copy `src/pages/names/[name].astro` and adapt words/schema for Kalabhairava.
3. Run `npm run build`; verify:
   - 925 name page directories in `dist/names/`
   - one page per unique name; repeated names show all positions
   - devanagari/IAST/also-spelled render correctly
   - canonical, `DefinedTerm`/`Article`/`BreadcrumbList` schema present
4. Adapt `src/pages/names/[range].astro` so every entry links to its name page; keep the existing range
   URLs and anchor `#name-<index>`.
5. Rebuild the names hub: link ranges, add the new name count, keep the sister-site chrome.

### Phase 3 — Landing and trust pages (half session)

1. Rewrite the five reference landing pages for Kalabhairava (§8).
2. Add `/about/`, `/contact/`, `/privacy/`, `/sources/` using the reference pages as templates; the
   existing inline disclaimer/contact info can move here.
3. Set up `public/_redirects`:
   ```
   /pdf/ /kalabhairava-sahasranama-pdf/ 301
   /info.html /about/ 301
   ```
4. Add cross-links from the homepage, hub, range pages, and name pages (reference implementations show
   exactly where).

### Phase 4 — Printable PDF (half session)

1. Adapt `seo/build-print-pdf.mjs`:
   - data source: new manifest/mapping
   - title: “Kalabhairava Sahasranama — 1000 Names of Kalabhairava”
   - Devanagari cover line: **`कालभैरव सहस्रनाम`** (the owner’s sister-site convention is to omit “ॐ श्री”;
     keep the English blessing line as on the reference if desired)
   - cover image: an appropriate **Kalabhairava** deity image supplied by the owner. Do **not** ship the
     Kali image (`MaaAdyaKali_5.webp`) on the Kalabhairava booklet. `kalabhairava-bg-desktop.webp` is a
     background asset — verify it is a suitable deity image before using it, otherwise ask the owner.
   - output: `public/downloads/kalabhairava-sahasranama-names.pdf`
2. Add the PDF landing page with both downloads (on-domain printable + official ebook/archive.org links
   where applicable) and `Book`/`FAQPage` schema, mirroring the reference.
3. Confirm the PDF is under Cloudflare Pages’ 25 MiB per-file limit (the reference book is ~2.6 MB; this
   one should be smaller).

### Phase 5 — Version, cache and service worker (must not skip)

The current Kalabhairava live site is already showing the same stale-footer bug found on the sister site:
live `version.txt` is `v1.43` and `last-updated.txt` is `2026-05-04`, loaded by client-side fetch with a
hardcoded fallback.

Port the reference fix:
1. Footer version/date **rendered at build time** from a `version.json`
   (`{ "version": "1.x", "buildDate": "YYYY-MM-DD" }`) — no client fetch.
   - reference: `src/pages/index.astro` frontmatter + `src/layouts/ReferenceLayout.astro` footer.
2. Keep the Husky/commit bump mechanism from the reference (or an equivalent script) so version bumps per
   commit; “Last updated” can be the build date.
3. Replace the old Workbox service worker with the reference `public/sw.js`:
   - bump cache name
   - do not precache or intercept `version.json`
   - include query strings in static cache keys
   - navigation network-first
4. Update `public/_headers`: cache `version.json` with `max-age=300`, never immutable; keep HTML
   `max-age=0, must-revalidate`.
5. After deploy, verify in a fresh browser profile and a returning-visitor profile (SW active) that the
   footer shows the new version/date, and that `/version.json` is not served from a cache while the SW
   controls the page.

### Phase 6 — Sitemap, robots, SEO files

1. Adapt `seo/build-sitemap.mjs`: `SITE_URL`, add the 925 name pages, 10 ranges, hub, homepage and the
   landing/trust pages. Expected **~945+ URLs** (925 names + 10 ranges + hub + home + 5 landing pages +
   about/contact/privacy/sources + possibly `/info` redirect not in sitemap).
2. Wire `prebuild` so `npm run build` regenerates `public/sitemap.xml`.
3. Update `robots.txt` sitemap line (same domain) and add `public/llms.txt` (reference format).
4. Check for stale old files: remove generated `names/*/index.html`, `data/name-chunks/*` from the old
   pipeline after the Astro build is proven; keep the old repo tag for rollback.

### Phase 7 — Deploy and measure

1. Push the branch; open a PR; verify Cloudflare **preview deployment** first.
2. Change the Cloudflare Pages project for `bhairavakalikenamosthute.com`:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Node version: 22 (Astro 6 requirement; reference CI uses 22.12)
   - Env `HUSKY=0` (skip Husky during CI install)
   - The old build command `python inject_version.py` must be removed/replaced.
3. Verify on the preview URL: sitemap URL count, a name page, `/pdf/` redirect, PDF download, version
   footer, mobile nav, JSON-LD.
4. Merge to `main` and verify production. Keep the `pre-seo-rebuild` tag and old build config notes for
   rollback.
5. Search Console: add/verify the property if not already present → submit
   `https://bhairavakalikenamosthute.com/sitemap.xml`; Bing import; URL-Inspect a name page.
6. Run `node search-quality/longtail.mjs` again after ~1 week (and after GSC data exists) to measure
   visibility vs the baseline.

---

## 7. Internal linking rules (copy from reference)

- Homepage footer: link all 10 ranges + the 5 landing pages + about/contact/privacy.
- Names hub: link every range, plus the 108/PDF/lyrics/benefits pages.
- Each range page: prev/next range + 108/1000-count/PDF links; every entry links to its name page.
- Each name page: prev/next name, parent range, names hub, PDF, 108 guide, homepage reader, sources,
  about/contact/privacy.
- Every static page: breadcrumbs + `BreadcrumbList` schema.
- Canonicals: self-referencing on every page; `/pdf/` and `/info.html` are 301s, not canonicals.

---

## 8. Landing page specs (adapt titles/copy to Kalabhairava)

Use the reference pages as structural templates; replace the Kali copy. Keyword pools to verify with
Google autocomplete before writing (do not assume volumes): `kalabhairava 1000 names`,
`kaal bhairav 1000 names`, `kalabhairava sahasranama`, `bhairava sahasranama with meaning`,
`108 names of kalabhairava`, `kalabhairava sahasranama pdf`, `kalabhairava names in hindi`,
`bhairav baba names`, `kala bhairava mantra`, `काल भैरव के नाम`, `कालभैरव सहस्रनाम`.

| URL | Page purpose | Reference template | Key notes |
|---|---|---|---|
| `/108-names-of-kalabhairava/` | 108-name compact set with meanings; FAQ + ItemList schema | `108-names-of-kali/index.astro` | Use names 1–108 of the 1000 in order; say clearly it is the opening 108 of the full Sahasranama. Adds “108 names of kalabhairava” queries. |
| `/1000-names-of-kalabhairava/` | count explainer: 1000 vs 108 vs 1008 vs 1000-name tradition | `1008-names-of-kali/index.astro` | This site is exactly 1000, so adapt the “why counts differ” copy honestly. FAQ: “How many names does Kalabhairava have?”, “Is there a 1008-name Kalabhairava list?”, “What is Kalabhairava Sahasranama?” |
| `/kalabhairava-sahasranama-pdf/` | PDF downloads + Book/FAQ schema | `kali-sahasranama-pdf/index.astro` | On-domain printable PDF; also link the archive.org Kalabhairava editions. |
| `/kalabhairava-sahasranama-lyrics/` | chant text/order + opening names | `kali-sahasranama-lyrics/index.astro` | “lyrics” is what people search; explain it is the sequential recitation of names. |
| `/kalabhairava-sahasranama-benefits/` | traditional benefits framing, balanced + caveat | `kali-sahasranama-benefits/index.astro` | Use the same devotional-not-medical framing. |

Homepage title/meta suggestions (inform, don’t overclaim):
- Title: `1000 Names of Kalabhairava (Kalabhairava Sahasranama) with Meanings`
- Meta: `Read all 1000 names of Kalabhairava with English meanings, Devanagari, and transliteration — a searchable Kalabhairava Sahasranama reference with a free printable PDF.`

Schema requirements (copy types from reference):
- Name pages: `DefinedTerm` + `Article` + `BreadcrumbList`.
- Hub/ranges: `CollectionPage` + `BreadcrumbList` + `ItemList`.
- Landing pages: `WebPage` + `FAQPage`; PDF page also `Book`.
- About: `ProfilePage` + `Person` (id `https://bhairavakalikenamosthute.com/#publisher`); Contact: `ContactPage`.
- Keep author/publisher ids consistent across pages (reference does this).

---

## 9. Design system

The owner approved the sister-site redesign. Use the reference static-page design exactly:
`ReferenceLayout.astro` + `public/reference.css` (jaikhyapaparampara.com temple palette, Crimson Text +
Philosopher, sticky header/mobile menu, gold-outline buttons and cards, footer with blessing).

- Applies to every page **except** the interactive homepage reader, which keeps its reading-app shell
  (copy the reference homepage and swap brand/assets).
- Replace Makali-specific images with Kalabhairava assets (`kalabhairava-bg-desktop.webp`,
  `kalabhairava-bg-mobile.webp` are already in the repo; verify their rôle before using as hero/PDF art).
- Keep the same nav labels pattern: Names, 108 Names, 1000 Names, Free PDFs, Lyrics, Benefits, About;
  footer includes sister-site links (1000namesofmakali.com and jaikhyapaparampara.com).
- The old `SISTER_VISUAL_CONVERSION.md` in the Kalabhairava repo is superseded by this guide.

---

## 10. Version/cache bug — details for the agent

Reference implementation (copy the pattern):
- `src/pages/index.astro` — reads `public/version.json` in frontmatter, renders
  `V{siteVersion}` and the build-date string directly; the client-side fetch/fallback script was removed.
- `src/layouts/ReferenceLayout.astro` — reads the same file and renders a small `site-footer-version`
  line on every static page.
- `public/sw.js` — cache version bumped; `version.json` not in precache; fetch handler returns early for
  `/version.json`; static cache keys include `url.search`.
- `tests/ux-structure.test.js` — regression checks for the build-rendered footer and the SW exclusion.

Known bug in the current site to avoid: `index.html` fetches `./version.txt` and `./last-updated.txt`
client-side with hardcoded fallbacks (`March 15, 2026`), and the Workbox SW caches data but browsers may
serve stale text files; live values are already months behind. Do not reproduce this pattern.

---

## 11. Validation and acceptance criteria

Run the reference stack (adapted selectors/budgets/snapshots to the new site):

```bash
npm run test:unit      # Node regression suites (adapted)
npm run check:syntax
npm run build          # must build ~945+ pages, regenerate sitemap
npm run test:browser   # Playwright smoke, a11y, visual, performance
npm run validate       # all of the above
```

Plus a custom link check (the reference used a small Node script to scan `dist/**/*.html` and confirm every
internal `href/src` resolves) and a JSON-LD parse check on every page type. CI: GitHub Actions validation +
lychee link check, as in the reference repo.

**Acceptance criteria**
- [ ] `/names/` + 10 range URLs unchanged and working.
- [ ] 925 unique name pages at `/names/<slug>/`, each with title/meta/canonical, Devanagari, IAST,
  variants, meaning + elaboration, prev/next, range/hub links, schema.
- [ ] Repeated names (e.g. `BHOKTRE`) list all positions on one page.
- [ ] Homepage title/meta updated; reader works on desktop + mobile; search and pagination intact.
- [ ] Landing pages + about/contact/privacy/sources live; internal links one click from any page.
- [ ] `/pdf/` → 301 `/kalabhairava-sahasranama-pdf/`; `/info.html` → 301 `/about/`.
- [ ] On-domain printable PDF with Kalabhairava cover image; size < 25 MB; download works.
- [ ] Sitemap ~945+ URLs, regenerated by `npm run build`, submitted to GSC.
- [ ] Version/date footer correct on live and after reload with service worker active; `/version.json`
  not cached by SW.
- [ ] `npm run validate` green; PR passes CI; live links/JSON-LD verified.
- [ ] Baseline re-measured with `search-quality` scripts (after ~1 week).

---

## 12. Fallback path (if Astro deploy is blocked)

Only if the owner cannot change Cloudflare build settings in time. Extend the legacy generator instead:

1. Add a Node script `seo/build-name-mapping.mjs` (copy from reference, same §5 data recovery).
2. Extend `generate_loading_artifacts.py`:
   - new `build_name_pages(mapping)` that writes `names/<slug>/index.html` per unique name (use
     `page_shell` + the range page's entry markup; carry `DefinedTerm`/`Article`/`BreadcrumbList` JSON-LD).
   - update range pages to link entries to name pages.
   - extend `generate_sitemap()` to include name + landing URLs.
   - add landing/trust pages as static HTML (or a second tiny generator).
3. Keep the Workbox SW; add `version.txt`/`last-updated.txt` to a network-first route and render the
   footer at build/generate time (replace the client fetch).
4. Keep `python inject_version.py` build command and pytest/Playwright checks.
5. Accept the higher maintenance cost and the risk of two divergent codebases; plan the Astro rebuild next.

---

## 13. Owner actions (outside the repo)

Adapted from `seo/owner-actions.md`:
1. **Google Search Console:** property for `bhairavakalikenamosthute.com` (Domain property via Cloudflare
   DNS verification) → submit `https://bhairavakalikenamosthute.com/sitemap.xml` after the new deploy.
2. **Bing Webmaster Tools** → import from GSC.
3. **Cloudflare Pages:** new build command/output/Node settings; purge cache after deploy; optional Cache
   Rule for static HTML (1 day edge / 4 h browser), as on the sister site.
4. **PDF hosting:** printable PDF on `cloudflare Pages` (check <25 MiB). The official Kalabhairava ebook
   is on archive.org; if an official designed ebook should live on-domain and exceeds 25 MiB, use R2.
5. **Backlinks/entity:** update GitHub README, both archive.org Kalabhairava item descriptions, Instagram
   bio, jaikhyapaparampara.com links, YouTube descriptions; genuine Reddit/Quora participation.
6. **Confirm content choices:** 108-name set source (names 1–108), Kalabhairava deity image for the PDF
   cover, whether the domain `bhairavakalikenamosthute.com` remains canonical, and whether the old
   `/info.html` redirect should live.
7. **Hindi:** the site is English-only. The legacy Hindi name field is used _only_ for Devanagari name
   spelling, not for Hindi prose (same decision as the sister site). Do not restore the removed Hindi UI.

---

## 14. Risks and pitfalls

| Risk | Mitigation |
|---|---|
| Legacy Devanagari names are mixed quality (Hindi-flavoured spellings) | QA via elaboration text matching; add `name-overrides.json`; expect ~20 corrections like the sister site |
| Dative-case names have low search volume as whole words | Include stem variants (“Bhairava”) in “also spelled”; landing pages target the common head terms |
| Repeated names (75 positions) inflate page count if not deduped | Group identical Devanagari spellings; one page lists all positions; expected ~925 pages |
| Data/paths hardcoded to Maa Kali in the copied template | Search the new repo for `Maa Kali`, `1000namesofmakali.com`, `1,072`, `1072`, `mahakali_sahasranama_meanings.json`, `MaaAdyaKali_5.webp` and replace every hit |
| Deploying the Astro build over the legacy project breaks old URLs | Keep `/` and `/names/...` paths identical; add `_redirects` for `/pdf/` and `/info.html`; test on a preview deployment first |
| Stale version/date (current site already shows this) | Build-rendered footer + SW fix (§10); do not reintroduce client fetch |
| Old generated `names/` directory conflicts with new Astro output | Remove old generated `names/`/`data/name-chunks` outputs once the new build is verified; keep a git tag for rollback |
| PDF cover image | Use an owner-supplied Kalabhairava deity image; don’t reuse the Kali image |
| CI visual baselines are Windows-specific | Refresh snapshots on the same OS as CI; adapt budgets to measured sizes rather than copying blindly |
| Cloudflare 25 MiB per-file limit | Keep printable PDF <25 MB; if the designed ebook is larger, use R2 |

---

## 15. Suggested session kickoff prompt

Paste this into the new session once the local project is set up (put this guide at
`docs/KALABHAIRAVA-SEO-REBUILD-GUIDE.md` in that workspace):

> SEO rebuild for the Kalabhairava 1000 Names site (`bhairavakalikenamosthute.com`,
> repo `09ashishkapoor/kalabhairava1000names`). Read `docs/KALABHAIRAVA-SEO-REBUILD-GUIDE.md` and follow
> its recommended Astro rebuild plan. Reference implementation to copy from:
> `C:\Users\kalbhairav\Documents\1000namesofmaadya` (branch `main`, commit `e9b58a3`) — you can read files
> from there directly; do not modify that repo. First deliverable: baseline + Phase 0–1 (Astro scaffold,
> data conversion, `npm run build` working), then mapping/name pages. Keep the existing `/` and
> `/names/...` URLs. When you finish a phase, run `npm run validate`, report changed files, and list what
> is still open. Do not deploy or switch Cloudflare build settings without the owner’s confirmation.

Optional split with Agent Teams: Lead (scaffold/integration/deploy), mapping teammate (§5),
pages teammate (§6 Phases 2–3), copy/PDF teammate (§6 Phase 4). Keep write scopes disjoint: mapping files
(`seo/`, `src/data/`), page templates (`src/pages/`, `src/layouts/`, `public/reference.css`), and
PDF/landing copy respectively.

---

## 16. Files from the reference repo worth reading before starting

- `seo/1000namesofmakali-seo-plan.md` — the original audit/plan (same problem statement, Kali-specific numbers).
- `seo/name-mapping-report.md` — mapping method + QA + override approach.
- `seo/build-name-mapping.mjs`, `seo/lib/transliterate.mjs` — the transliteration pipeline.
- `seo/build-sitemap.mjs`, `seo/build-print-pdf.mjs` — generated artifact patterns.
- `src/pages/names/[name].astro`, `[range].astro`, `index.astro` — page templates.
- `src/layouts/ReferenceLayout.astro`, `public/reference.css` — sister-site design system.
- `public/sw.js`, `src/pages/index.astro` footer section — version/cache fix.
- `seo/owner-actions.md` — external steps.

---

## 17. Appendix — complete change log from the reference site (what “all these changes” means)

Every item below was actually shipped on the Makali site (commit series on `main`, latest `e9b58a3`).

| # | Change | Where implemented in reference | Reproduce on Kalabhairava in |
|---|---|---|---|
| 1 | SEO audit + written plan (indexability, transliteration, thin pages, internal links, measurement) | `seo/1000namesofmakali-seo-plan.md` | Phase 0 (repeat audit on the 12-URL baseline) |
| 2 | Name-spelling mapping: site spelling → common spelling → IAST → Devanagari → variants → slug; generated, overrides file, QA report | `seo/build-name-mapping.mjs`, `seo/lib/transliterate.mjs`, `src/data/name-mapping.json`, `seo/name-mapping-report.md`, `seo/data/name-overrides.json`, `seo/name-mapping.csv` | §5 |
| 3 | Per-name pages: `Article`/`DefinedTerm`/`BreadcrumbList`, Devanagari, IAST, also-spelled, meaning + elaboration, prev/next name, range/hub links, canonical/OG/meta | `src/pages/names/[name].astro`, `public/name-pages.css` (now in `reference.css`) | Phase 2 |
| 4 | Repeated names share one page listing every occurrence | mapping `pageGroups` + `[name].astro` | §5.3 |
| 5 | Range pages link every entry to its name page; range copy explains the linking | `src/pages/names/[range].astro` | Phase 2 |
| 6 | Names hub rewritten as crawlable directory with intro + image | `src/pages/names/index.astro` | Phase 2 |
| 7 | Head-term landing pages: 108 names, 1008 vs 1072 explainer, PDF, lyrics, benefits | `src/pages/108-names-of-kali/`, `1008-names-of-kali/`, `kali-sahasranama-pdf/`, `kali-sahasranama-lyrics/`, `kali-sahasranama-benefits/` | Phase 3 / §8 |
| 8 | Trust/E-E-A-T pages: about (Person/ProfilePage schema), contact, privacy, expanded sources | `src/pages/about/`, `contact/`, `privacy/`, `sources/` | Phase 3 |
| 9 | Image with descriptive alt text on hub/108/about | `page-figure` blocks + `public/MaaAdyaKali_5.webp` | Phase 3 (use Kalabhairava art) |
| 10 | Homepage title/meta/OG retargeted to head queries; footer links all ranges + landing pages | `src/pages/index.astro` | Phase 2/3 |
| 11 | Generated sitemap covering every URL; auto-run on build (`prebuild`) | `seo/build-sitemap.mjs`, `package.json` | Phase 6 |
| 12 | Structured data on every template (Article/DefinedTerm/Book/FAQ/Breadcrumb/CollectionPage/ItemList) | page templates | Phase 2/3 |
| 13 | `_redirects` for `/pdf/`; `_headers` caching for new CSS/PDF/sitemap; robots + `llms.txt` | `public/_redirects`, `_headers`, `llms.txt`, `robots.txt` | Phase 3/6 |
| 14 | Printable on-domain PDF generated from site data (cover with deity image, Devanagari, English meanings, 68 pp, 2.6 MB) | `seo/build-print-pdf.mjs`, `seo/assets/maa-adya-mahakali-cover.jpg`, `public/downloads/` | Phase 4 |
| 15 | Sister-site visual rebuild for every non-landing page (header/mobile menu/footer, temple palette, Crimson Text + Philosopher, gold pill buttons/cards) | `src/layouts/ReferenceLayout.astro`, `public/reference.css` | Phase 1 / §9 |
| 16 | Build-rendered version + last-updated footer (no client fetch, no hardcoded fallback) | `src/pages/index.astro`, `src/layouts/ReferenceLayout.astro` | Phase 5 / §10 |
| 17 | Service-worker fix: no `version.json` caching, cache version bump, query-aware static cache keys | `public/sw.js` | Phase 5 / §10 |
| 18 | Validation rebuilt: Node unit suites, Playwright smoke/a11y/visual/perf, refreshed stale snapshots/budgets, regression test for version/SW, GitHub Actions + lychee | `tests/`, `playwright-tests/`, `.github/workflows/validation.yml`, `docs/validation-baseline.md` | Phase 7 / §11 |
| 19 | Measurement tooling copied into the workspace and verified from the new path | `search-quality/` (compare/longtail/visibility) | Phase 0 |
| 20 | Owner-action checklist (GSC/Bing, Cloudflare cache, PDF hosting/R2, backlinks, archive.org, social, verification) | `seo/owner-actions.md` | §13 |
| 21 | Live deploy + post-deploy checks (sitemap 1,061 URLs, `/pdf/` 301, PDF, final pages, CI green) | commits `b143f37`, `e9b58a3` | Phase 7 |

Items that are **Makali-specific** and must not be copied literally: any 1,072 counts, the 1008-vs-1,072
explainer angle, the Maa Kali images/copy, and the Kali landing-page titles. Use the same pattern with
1,000 / 925 / Kalabhairava content instead.
