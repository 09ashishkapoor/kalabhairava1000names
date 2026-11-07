# Deployment

The rebuilt site is an Astro static site. It is currently on the local branch
`seo/astro-rebuild`; production still serves the old framework-free site until
the owner approves the switch.

## Status and branch

- Rebuild branch: `seo/astro-rebuild`
- Pre-rebuild rollback tag: `pre-seo-rebuild`
- Validation: `npm run validate` (946-page build + unit + 10 Playwright tests)
- Production deployment: **not changed by the agent**

## Cloudflare Pages settings

In the Cloudflare Pages project for `bhairavakalikenamosthute.com`, update:

| Setting | Value |
| --- | --- |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | `22` (`NODE_VERSION=22`) |
| Environment variable | `HUSKY=0` (skip the local version-bump git hook in CI) |
| Root directory | repository root |

Do this **before or together with** merging the rebuild branch. If the old build
command (`python inject_version.py`, output `.`) is still configured, the new
Astro site will not be served.

## Safe rollout order

1. Push `seo/astro-rebuild` to the remote and let Cloudflare create a preview
   deployment for the branch.
2. Open the preview URL and run the post-deploy checks below.
3. Change the Cloudflare build settings to Astro (`npm run build` → `dist`).
4. Merge to `main` (fast-forward is fine) and confirm the production deployment.
5. Purge the Cloudflare cache for `/`, `/names/*`, `/sw.js` and
   `/version.json` once, then reload with a hard refresh.
6. Submit the sitemap in Google Search Console (see
   [`seo/owner-actions.md`](seo/owner-actions.md)).

## Post-deploy checks

- [ ] `/` renders the Kalabhairava reader, hero image and names; stats show
      1,000 names.
- [ ] `/names/` lists 10 range links; a range page links all 100 names.
- [ ] A name page loads, e.g. `/names/bhairavaya/` (canonical, description,
      JSON-LD, Devanagari, prev/next).
- [ ] `/108-names-of-kalabhairava/` renders 108 rows.
- [ ] `/1000-names-of-kalabhairava/`, `/kalabhairava-sahasranama-lyrics/`,
      `/kalabhairava-sahasranama-benefits/` load.
- [ ] `/kalabhairava-sahasranama-pdf/` loads and
      `/downloads/kalabhairava-sahasranama-names.pdf` returns the 66-page,
      ~2.4 MB PDF.
- [ ] `/pdf/` and `/info.html` return 301 to the new pages; `www` redirects to
      the apex domain.
- [ ] `/sitemap.xml` returns 946 URLs; `/robots.txt` and `/llms.txt` load.
- [ ] Footer shows the build-rendered version and date (e.g. `V1.5`,
      `November 7, 2026`), not a stale hardcoded value.
- [ ] `/version.json` is *not* served from the service worker cache after a
      version bump; reload with DevTools Application → Service Workers.
- [ ] PDF/assets under 25 MiB; no Cloudflare Pages asset limit issues.

## Rollback

1. Cloudflare Pages → Deployments → roll back to the previous production
   deployment (fastest), **or**
2. Reset the branch/merge: `git checkout pre-seo-rebuild` and redeploy the old
   build command/output.

The old files remain at the repository root until the first Astro deployment is
confirmed, so the old build pipeline still works from the tag.

## After parity is confirmed (cleanup)

Only after the Astro deployment is live and verified, remove the legacy
framework-free site artifacts to keep the repo simple (`index.html`, `app.js`,
`styles.css`, `critical.css`, `navigation.*`, `translations.js`, `i18n.js`,
`search-worker.js`, `registerSW.js`, the old `sw.js`, `data/`, `names/`,
`generate_loading_artifacts.py`, `inject_version.py`, `version.txt`,
`last-updated.txt`, old root `sitemap.xml`/`robots.txt`/`_headers`/`_redirects`,
and legacy Python tests). The canonical dataset `sahasranama_meanings.json`
stays. A short cleanup PR is safer than mixing it into the deploy PR.

## Version bumping

`.husky/pre-commit` runs `BUMP_VERSION_COMMIT=false npm run bump-version`, which
updates `public/version.json`. That file is rendered into every page footer at
build time — there is no client-side version fetch. Do not add `/version.json`
to the service-worker cache.

## Raw local checks

```bash
npm ci
npm run validate
npm run build
npx @playwright/test test    # after build + preview if needed
```
