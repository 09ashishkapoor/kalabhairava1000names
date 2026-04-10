# Sri Kalabhairava Sahasranama

A fast, framework-free devotional web app presenting the 1000 names of Sri Kalabhairava with English and Hindi content, search, and mobile-friendly reading.

## Highlights
- Bilingual interface (English and Hindi)
- Real-time search across names and meanings
- Lightweight static architecture (no build toolchain required)
- Responsive layout for desktop and mobile
- Version display with automated version bump workflow
- Progressive enhancement with service worker registration in production

## Tech Stack
- HTML5
- CSS3
- Vanilla JavaScript (ES modules + Web Worker for search)
- JSON dataset (`sahasranama_meanings.json`)

## Repository Structure
- `index.html` - Main application shell and content sections
- `app.js` - App state, rendering, and UI interactions
- `i18n.js` - Language state and translation helpers
- `translations.js` - UI translation strings
- `search-worker.js` - Background indexing/search worker
- `styles.css` - Main styling
- `navigation.css` / `navigation.js` - Navigation system
- `sahasranama_meanings.json` - Core data file
- `manifest.webmanifest` / `manifest.json` - Web app metadata
- `registerSW.js` / `sw.js` / `workbox-239d0d27.js` - Service worker setup
- `.github/workflows/version-bump.yml` - Auto version bump on `main`

## Local Development
This is a static site. You can run it directly with Python or the included helper scripts.

### Option 1: Python
```bash
python simple-server.py
```
Default URL: `http://localhost:8000`

### Option 2: Windows helper scripts
```powershell
./start-server.ps1
```
or
```bat
start-server.bat
```

## Deployment
Deploy as a static site to any host (Cloudflare Pages, Netlify, GitHub Pages, Vercel, S3+CDN, traditional hosting).

### Required files
Deploy the repository root contents, including:
- `index.html`
- `styles.css`
- `app.js`
- `sahasranama_meanings.json`
- `manifest.webmanifest`
- `registerSW.js`
- `sw.js`
- static assets (`MaaAdyaKali_5.webp`, etc.)

### Host behavior notes
- Ensure `application/json` is served for `*.json`
- Keep `_headers` and `_redirects` if your platform supports them
- Service worker registration is automatically skipped on `localhost`/`127.0.0.1`

## Versioning
Version is stored in `version.txt` and surfaced in the UI footer.

### Manual bump
```bash
./increment_version.sh
```
PowerShell alternative:
```powershell
./increment_version.ps1
```

### Git hook setup (optional)
```bash
./setup_version_hook.sh
```
PowerShell alternative:
```powershell
./setup_version_hook.ps1
```

### CI bump
On pushes to `main`, `.github/workflows/version-bump.yml` increments version metadata and commits back when needed.

## Public Repo Readiness Notes
- Local/editor artifacts are ignored via `.gitignore`
- No framework secrets or runtime env files are required for local run
- Before publishing, verify repo settings (visibility, branch protection, Pages/hosting config)

## Contributing
1. Create a branch
2. Make focused changes
3. Test locally
4. Open a pull request with a clear description

## License
If you want explicit open-source reuse terms, add a `LICENSE` file (for example MIT, Apache-2.0, or CC BY-NC depending on your intent).

## Credits
Built and maintained for devotional access to Sri Kalabhairava Sahasranama.
