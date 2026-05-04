# Plan: update English Kalabhairava names prose and remove Hindi fields

## Context

- The source text file `kalabhairava_sahasranama1000_withelaborations_may042027.txt` contains 1000 numbered English entries.
- The canonical site dataset is `sahasranama_meanings.json`, which feeds generated loading artifacts and static SEO pages.
- I verified that the text file and JSON dataset both contain exactly 1000 entries, and their indexes/names match exactly after normalizing capitalization/spacing.
- The website is already English-only in the UI/static page generator, but the canonical dataset still carries unused `hindi_*` fields that should be removed.
- `data/search-index.json` is only referenced as an `app.js` fallback if `data/names-manifest.json` has not loaded; the manifest’s active search source is already `sahasranama_meanings.json`.

## Approach

- Parse the text file into structured entries keyed by index/name.
- Rebuild the canonical JSON dataset with only English fields: `index`, `english_name`, `english_one_line`, and `english_elaboration`.
- Use the text file as the source of truth for English names, one-line meanings, and elaborations.
- Change `app.js` search fallback from `./data/search-index.json` to `./sahasranama_meanings.json`, then remove the unused fallback file.
- Update `last-updated.txt` to `2026-05-04`, then regenerate derived artifacts from `generate_loading_artifacts.py` so homepage bootstrap/chunks, static `/names/` pages, and sitemap lastmod use the refreshed content.
- Keep generated output paths and chunk sizing unchanged.

## Files to modify

- `sahasranama_meanings.json`
- `app.js`
- `data/bootstrap-names.json`
- `data/name-chunks/*.json`
- `data/search-index.json` (remove after changing fallback)
- `names/index.html`
- `names/*/index.html`
- `sitemap.xml`
- `last-updated.txt`
- `tests/test_repo_smoke.py`

## Reuse

- `generate_loading_artifacts.py` already generates `data/bootstrap-names.json`, `data/name-chunks/*.json`, `/names/` static pages, and `sitemap.xml` from `sahasranama_meanings.json`.
- Existing app rendering in `app.js` already uses only `english_name`, `english_one_line`, and `english_elaboration` for cards and search matching.
- Existing `search-worker.js` already indexes only English fields, so it should not require changes.
- Existing repo smoke tests in `tests/test_repo_smoke.py` validate dataset shape, generated artifact consistency, and English-only static pages; update the dataset-shape assertion to require absence of Hindi keys.

## Steps

- [ ] Add/use a one-off parser to read each text entry as: index, source name line, one-line meaning, and `ELABORATION:` body.
- [ ] Validate parsed count is exactly 1000 and every parsed index/name matches `sahasranama_meanings.json` after normalization.
- [ ] Replace the canonical dataset with English-only records populated from the parsed text file.
- [ ] Remove `hindi_name`, `hindi_one_line`, and `hindi_elaboration` from every canonical dataset entry.
- [ ] Change the `app.js` search fallback from `./data/search-index.json` to `./sahasranama_meanings.json` so `data/search-index.json` can be safely removed without breaking early search if the manifest is delayed.
- [ ] Remove `data/search-index.json`.
- [ ] Update `last-updated.txt` to `2026-05-04`.
- [ ] Regenerate loading artifacts and static SEO pages with `python3 generate_loading_artifacts.py`.
- [ ] Update `tests/test_repo_smoke.py` so the canonical dataset shape expects only English fields and asserts Hindi fields are absent.

## Verification

- Run a parser validation check: 1000 parsed entries, no index/name mismatches, no empty one-line meanings or elaborations, and no remaining `hindi_*` keys.
- Run `npm run test:repo` to verify dataset shape and generated artifact consistency.
- Manually inspect entries 1, a middle entry, and 1000 in `sahasranama_meanings.json`, homepage data artifacts, and `/names/` static HTML.
- Search the repo for `hindi_name`, `hindi_one_line`, `hindi_elaboration`, and `data/search-index.json` to confirm no live references remain.
- Run the site locally and confirm the reader/search shows the updated prose.
