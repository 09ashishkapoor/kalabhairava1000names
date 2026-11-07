# Validation Baseline

## What was standardized

This repo now uses one small validation pattern that can be reused on similar static or frontend-heavy sites:

1. **Existing repo tests stay in place** and run through `npm run test:unit`.
2. **Playwright smoke coverage** checks the highest-value happy paths.
3. **Scoped axe accessibility coverage** runs against the stable names explorer flow.
4. **Visual regression snapshots** cover only three stable surfaces.
5. **A performance budget test** guards the main page shell with practical thresholds.
6. **GitHub Actions** runs the suite on pull requests and pushes to `main`.
7. **Lychee link checking** runs in CI against `README.md`, the built home page, and the sitemap.

## Repo-specific choices

### Browser coverage
- **Chromium only**: enough confidence for this single-route static site without adding unnecessary matrix cost.
- **Windows Playwright job**: visual baselines were generated here, and screenshot rendering can differ across operating systems.

### Smoke flows
The smoke suite intentionally covers only the flows with the highest merge-review value:
- landing CTA -> names explorer
- search + clear
- mobile reader controls: search toggle, language switch, pagination, elaboration reveal

### Accessibility scope
Axe checks `#names-section` only. That is the most stable, user-critical interactive surface in this repo.

### Visual targets
Only these stable element snapshots are tracked:
- `.landing-content`
- `.controls-panel`
- first visible `.name-card`

### Performance budgets
The current repo build was measured and the budget is intentionally close to the current output rather than copied from another project:
- DOMContentLoaded: **< 1000ms** on the local preview server
- initial HTML: **<= 320 KB**
- bootstrap JS (`app.js`, `navigation.js`, `translations.js`): **<= 70 KB** combined
- initial stylesheet (`styles.min.css`): **<= 40 KB**

## Local commands

```bash
npm run test:unit
npm run check:syntax
npm run test:browser
npm run test:browser:update
npm run validate
```

### Recommended local flow

Run the full local baseline with:

```bash
npm run validate
```

That command runs:
- existing unit/regression tests
- syntax checks for the added validation files
- Astro build
- Playwright smoke, accessibility, visual, and performance tests

## Updating visual baselines intentionally

If a UI change is expected and the new screenshots are correct:

```bash
npm run test:browser:update
```

Then review the changed files inside `playwright-tests/visual.spec.js-snapshots/` before committing them.

### Snapshot review checklist
- confirm the change is intentional
- confirm the snapshot still targets a stable UI surface
- confirm the diff is not animation- or timing-related
- keep CI on the same OS used to generate the baseline

## How to reuse this pattern in future repos

1. **Keep the existing repo tests**; do not replace them with browser tests.
2. **Pick only 1-3 critical smoke flows** based on the real product, not a template.
3. **Scope axe to one stable critical flow** instead of scanning the whole site by default.
4. **Snapshot 2-3 stable elements only**, never the whole app unless it is truly static.
5. **Measure the current build output first**, then set budgets close to that measured baseline.
6. **Match CI OS to the baseline OS** when screenshot rendering is platform-sensitive.
7. **Add one local validate command** so reviewers and contributors can run the same checks easily.

## CI behavior

The workflow at `.github/workflows/validation.yml` does two things:
- **Browser validation job (Windows)**: runs `npm run validate` and uploads Playwright artifacts on failure.
- **Link check job (Ubuntu)**: builds the site and runs `lycheeverse/lychee-action` on `README.md`, `dist/index.html`, and `public/sitemap.xml`.

## Files that define the baseline

- `playwright.config.js`
- `playwright-tests/*.spec.js`
- `playwright-tests/helpers/site.js`
- `.github/workflows/validation.yml`
- `package.json`
- `README.md`
- `docs/validation-baseline.md`
