# Kalabhairava Sahasranama

A fast, framework-free devotional web app for browsing the 1000 names of Sri Kalabhairava with English and Hindi meanings, search, and crawlable static reference pages.

## Highlights

- Bilingual interface in English and Hindi
- Real-time search across all 1000 names and meanings
- Interactive homepage reader with progressive loading
- Generated static `/names/` pages for indexable range-based browsing
- Responsive layout for desktop and mobile
- Progressive Web App support
- Repo smoke tests plus Playwright browser validation

## Tech Stack

- HTML5 / CSS3
- Vanilla JavaScript
- Web Worker search
- Python utilities for artifact generation and local serving
- Node-based npm scripts for cross-platform command execution
- Pytest and Playwright for validation

## Repository Structure

| File / Folder | Purpose |
|---|---|
| `index.html` | Main landing page and interactive names reader |
| `app.js` | Reader state, rendering, progressive loading, search wiring |
| `i18n.js` / `translations.js` | Language state and UI strings |
| `search-worker.js` | Background search worker |
| `styles.css` / `critical.css` | Main site styling |
| `navigation.css` / `navigation.js` | Sticky nav and section scroll behavior |
| `sahasranama_meanings.json` | Canonical source dataset |
| `data/bootstrap-names.json` | Initial reader payload |
| `data/names-manifest.json` | Progressive-loading manifest |
| `data/name-chunks/` | Chunked name data for the reader |
| `names/` | Generated static SEO pages for 100-name ranges |
| `names/static-pages.css` | Shared stylesheet for generated static pages |
| `generate_loading_artifacts.py` | Generates reader data artifacts, static pages, sitemap entries, and mobile hero asset |
| `inject_version.py` | Injects the version number into HTML at build time |
| `simple-server.py` | Local dev server with automatic port fallback |
| `scripts/run-python.js` | Cross-platform Python launcher used by npm scripts |
| `manifest.webmanifest` / `registerSW.js` / `sw.js` | PWA assets |
| `robots.txt` / `sitemap.xml` | SEO assets |
| `tests/` | Pytest smoke tests and Playwright browser validation |

## Local Development

Start the local server:

```bash
npm start
```

The server starts on port `8000` by default. If that port is busy it automatically tries `8001` through `8019`. Open the exact `http://127.0.0.1:PORT` URL reported by the server.

Run the server directly with Python:

```bash
python simple-server.py
```

Use a different starting port:

```powershell
$env:PORT='9000'
python simple-server.py
```

## Generated Artifacts

This repo keeps several generated files under version control:

- `data/bootstrap-names.json`
- `data/names-manifest.json`
- `data/name-chunks/*.json`
- `names/index.html`
- `names/*/index.html`
- `sitemap.xml`
- `MaaAdyaKali_5-mobile.webp`

Regenerate them after changing the canonical dataset, static names-page copy, or generator logic:

```bash
node scripts/run-python.js generate_loading_artifacts.py
```

## Running Tests

Run repo smoke tests:

```bash
npm test
```

Run them directly with Python:

```bash
python -m pytest tests/
```

## Browser Validation

Install Playwright browser dependencies:

```bash
npm run playwright:install
```

Run the core browser smoke suite:

```bash
npm run test:e2e
```

Run visual validation:

```bash
npm run test:visual
```

Run performance validation:

```bash
npm run test:perf
```

Run the full validation sequence:

```bash
npm run validate
```

The Playwright suite starts its own local server at `http://127.0.0.1:4173` and writes artifacts to `playwright-report/` and `test-results/`.

## Deployment

Deploy the repository root as a static site to Cloudflare Pages, Netlify, Vercel, GitHub Pages, or any comparable static host.

- Output directory: `.`
- No framework build is required for normal deploys
- Optional version injection step: `python inject_version.py`

If you changed `sahasranama_meanings.json` or generator-driven SEO/static content and want the host to build from source, run artifact generation before deploy:

```bash
python generate_loading_artifacts.py
python inject_version.py
```

### Host Notes

- `sahasranama_meanings.json` must be served as `application/json`
- Keep `_headers` and `_redirects` for Cloudflare Pages
- GitHub Pages ignores `_headers`
- For Cloudflare Pages, set `HUSKY=0` during CI so Husky installation is skipped

## SEO Notes

- The generated `/names/` pages are intended as crawlable static reference pages
- `sitemap.xml` is generated from the artifact pipeline
- Submit the sitemap URL in Google Search Console once, then let Google re-fetch it
- Use URL Inspection for important newly deployed pages if you want faster discovery

## Versioning

Version is stored in `version.txt` and shown in the footer.

- Automatic: Husky bumps the version on each commit
- Manual shell script: `./increment_version.sh`
- Manual PowerShell script: `./increment_version.ps1`

## Contributing

1. Create a branch
2. Make focused changes
3. Regenerate artifacts if you changed source data or generator output
4. Run `npm test`
5. Use `npm start` to preview locally
6. Open a pull request with a clear description

## License

MIT. See [LICENSE](LICENSE).
