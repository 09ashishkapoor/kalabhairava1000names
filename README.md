# Kalabhairava Sahasranama - 1000 names of Baba KalaBhairava

A fast, framework-free devotional web app presenting the 1000 names of Kalabhairava Baba with English and Hindi meanings, real-time search, and a clean mobile-friendly reading experience.

## Highlights
- Bilingual interface — English and Hindi
- Real-time search across all 1000 names and meanings (Web Worker)
- Clean landing page with two reading modes: Browse by card or Search
- Lightweight static architecture — no framework, no build step
- Responsive layout for desktop and mobile
- Version auto-bumped on every commit via Husky pre-commit hook
- Progressive Web App (installable, service worker in production)

## Tech Stack
- HTML5 / CSS3
- Vanilla JavaScript (IIFE module pattern + Web Worker for search)
- JSON dataset (`sahasranama_meanings.json`) — 1000 entries with name, one-line meaning, and full elaboration in English and Hindi
- Python dev server (`simple-server.py`) with automatic port fallback
- Husky for pre-commit version bumping

## Repository Structure

| File / Folder | Purpose |
|---|---|
| `index.html` | Single-page app shell — landing, names, about, footer |
| `app.js` | App state, card rendering, search, i18n wiring |
| `i18n.js` | Language state and translation lookup |
| `translations.js` | UI strings in English and Hindi |
| `search-worker.js` | Background Web Worker for fuzzy name search |
| `styles.css` | Full site styles |
| `critical.css` | Above-the-fold CSS inlined in `<head>` |
| `load-styles.js` | Async CSS loader for non-critical styles |
| `navigation.css` / `navigation.js` | Sticky nav and section scroll logic |
| `sahasranama_meanings.json` | Core dataset — 1000 names with meanings |
| `manifest.webmanifest` | PWA web app manifest |
| `registerSW.js` | Service worker registration (skipped on localhost) |
| `sw.js` / `workbox-239d0d27.js` | Workbox-based service worker |
| `robots.txt` / `sitemap.xml` | SEO |
| `_headers` / `_redirects` | Cloudflare Pages platform config |
| `info.html` | Redirect page for `/info` → `/#about-section` |
| `version.txt` / `last-updated.txt` | Version and date shown in footer |
| `increment_version.sh` / `.ps1` | Version bump scripts |
| `inject_version.py` | Injects version into HTML at build time (CF Pages) |
| `simple-server.py` | Local dev server with automatic port fallback |
| `package.json` | npm scripts: `start`, `prepare` (Husky), `test` |
| `.husky/pre-commit` | Runs `increment_version.sh` on every commit |
| `tests/` | Smoke tests (`pytest`) |

## Local Development

```bash
npm start
```

The server starts on port 8000 by default. If that port is busy it automatically tries 8001, 8002, … up to 8019.
Always open the exact `http://127.0.0.1:PORT` URL printed by the server, because the active port may not be `8000`.

Or run directly with Python:

```bash
python3 simple-server.py
```

To use a different starting port:

```bash
PORT=9000 python3 simple-server.py
```

## Deployment

Deploy the repository root as a static site to Cloudflare Pages, Netlify, Vercel, GitHub Pages, or any static host.

- **Build command:** `python inject_version.py` (optional — injects the version number into the footer at build time)
- **Output directory:** repository root (`.`)
- **No Node install step required**

### Host notes
- `sahasranama_meanings.json` must be served as `application/json`
- Keep `_headers` and `_redirects` for Cloudflare Pages
- GitHub Pages ignores `_headers`, so the JSON `X-Robots-Tag: noindex` rule will not apply there
- For Cloudflare Pages: add env var `HUSKY=0` so the Husky install step is skipped during CI

## Versioning

Version is stored in `version.txt` and shown in the footer.

**Automatic (Husky pre-commit hook):** the version is bumped on every `git commit` — no manual step needed.

**Manual bump if needed:**
```bash
./increment_version.sh
```
PowerShell:
```powershell
./increment_version.ps1
```

## Running Tests

```bash
npm test
# or
python -m pytest tests/
```

## Browser Validation Baseline

This repository includes a Playwright-based browser validation suite for the
highest-value manual checks:

- page load + core UI smoke coverage
- language toggle persistence
- bootstrap search flow
- accessibility scan on the names explorer flow
- visual regression baselines for the landing hero and names explorer
- baseline performance budgets for landing-page rendering
- HTML report, trace, screenshot, and video artifacts on failures

### Install browser test dependencies

```bash
npm run playwright:install
```

### Run all validation checks

```bash
npm run validate
```

### Run only browser validation

```bash
npm run test:e2e
```

The Playwright suite starts a local static server automatically at
`http://127.0.0.1:4173` and writes the HTML report to `playwright-report/`.

### Update visual baselines intentionally

```bash
npx playwright test tests/e2e/visual-regression.spec.js --update-snapshots
```

### Run performance budgets only

```bash
npm run test:perf
```

## Continuous Validation

GitHub Actions now runs the repo smoke tests and Playwright browser validation on:

- every pull request
- pushes to `main`

When browser validation fails, the workflow uploads the Playwright HTML report as
an artifact so manual review can start from traces/screenshots instead of
reproducing the issue from scratch.

Phase 2 adds:

- visual snapshot regression checks
- automated performance budgets
- broken-link checking for markdown and HTML entrypoints

For reuse in other repos, see:

- `docs/AGENT_VALIDATION_PROMPT.md`

## Contributing
1. Create a branch
2. Make focused changes
3. `npm start` to preview locally
4. Open a pull request with a clear description

## License

MIT — see [LICENSE](LICENSE). Free to use, modify, and distribute.

## End Notes 
Built and maintained by KaliPutra_Ashish for access to 1000 names of Kalabhairava baba.  
Dedicated to my Guru Shri Praveen Radhakrishnan ❤️ and 🙏 Khyapa Parampara.

For any issues or suggestions, please open an issue or submit a pull request.
