# Deployment Guide

This repository is a root-level static site. There is no `site/` subdirectory and there is no build step.

## What to deploy

Publish the repository root as static files. The core runtime assets are:

- `index.html`
- `styles.css`
- `navigation.css`
- `app.js`
- `i18n.js`
- `translations.js`
- `navigation.js`
- `search-worker.js`
- `critical.css`
- `load-styles.js`
- `sahasranama_meanings.json`
- `manifest.webmanifest`
- `registerSW.js`
- `sw.js`
- `MaaAdyaKali_5.webp`
- `_headers` and `_redirects` when your host supports them

## Local preview

Use the included Python helper:

```bash
python simple-server.py
```

On Windows you can also use:

```powershell
./start-server.ps1
```

Default local URL: `http://localhost:8000`

## Static host settings

For Netlify, Cloudflare Pages, Vercel, GitHub Pages, or similar static hosts:

- Build command: leave empty
- Output directory: repository root / `.`
- Node install step: not required

### Host notes

- `sahasranama_meanings.json` must be served as `application/json`
- Keep `_headers` and `_redirects` if your platform understands them
- Service worker registration is already skipped on `localhost` and `127.0.0.1`

## GitHub Pages

If you use GitHub Pages, publish from the root of your selected branch. Do not point Pages at a non-existent `site/` folder.

## Quick publish checklist

1. Confirm the repo root contains the expected static files.
2. Preview locally and verify search, language toggle, and dataset loading.
3. Publish the repository root as the site output.
4. Verify that `manifest.webmanifest`, `sw.js`, and `sahasranama_meanings.json` load successfully in production.
