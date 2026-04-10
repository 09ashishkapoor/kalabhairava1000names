# Deployment Guide

This repository is a root-level static site. There is no `site/` subdirectory and there is no build step.

## What to deploy

Publish the repository root as-is. The full list of runtime assets:

| Asset | Required |
|---|---|
| `index.html` | ✅ |
| `styles.css` | ✅ |
| `critical.css` | ✅ |
| `navigation.css` | ✅ |
| `load-styles.js` | ✅ |
| `app.js` | ✅ |
| `i18n.js` | ✅ |
| `translations.js` | ✅ |
| `navigation.js` | ✅ |
| `search-worker.js` | ✅ |
| `sahasranama_meanings.json` | ✅ |
| `manifest.webmanifest` | ✅ |
| `registerSW.js` | ✅ |
| `sw.js` | ✅ |
| `workbox-239d0d27.js` | ✅ |
| `MaaAdyaKali_5.webp` | ✅ |
| `robots.txt` | ✅ |
| `sitemap.xml` | ✅ |
| `info.html` | ✅ |
| `version.txt` | ✅ |
| `last-updated.txt` | ✅ |
| `_headers` | Cloudflare Pages / Netlify only |
| `_redirects` | Cloudflare Pages / Netlify only |

Files **not** deployed (ignored or dev-only): `node_modules/`, `.husky/`, `simple-server.py`, `tests/`, `package.json`, `package-lock.json`, `inject_version.py`, `increment_version.*`, `.gitignore`.

## Local preview

```bash
npm start
```

Or directly:

```bash
python simple-server.py
```

Default URL: `http://localhost:8000`. If the port is occupied the server automatically tries the next available port up to 8019. Set `PORT` to change the starting port:

```bash
PORT=9000 python simple-server.py
```

## Static host settings

| Setting | Value |
|---|---|
| Build command | `python inject_version.py` (optional — injects version into footer) |
| Output directory | `.` (repository root) |
| Node version | Not required |

### Cloudflare Pages
- Add env var `HUSKY=0` to skip Husky install during CI build
- `_headers` and `_redirects` are picked up automatically
- Set build command to `python inject_version.py` to stamp the version in the footer

### Netlify
- Base directory: leave empty
- Publish directory: `.`
- `_redirects` is picked up automatically

### GitHub Pages
- Publish from the branch root. Do not point Pages at a `site/` folder.

## Quick publish checklist

1. Run `npm start` and verify: search works, language toggle works, names load.
2. Check `version.txt` has a valid version string.
3. Push to your hosting branch / trigger a deploy.
4. In production verify `manifest.webmanifest`, `sw.js`, and `sahasranama_meanings.json` all return HTTP 200.
