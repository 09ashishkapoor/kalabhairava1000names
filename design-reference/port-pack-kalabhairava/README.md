# Port pack — The Pothi for bhairavakalikenamosthute.com

This folder holds **everything the other repo needs** and nothing else. Copy it into that repo, then
delete what you do not want. Nothing here is parent-site content except the two generic page templates.

## What to copy, and where it goes

| File | Destination in the Kalabhairava repo | Why |
|---|---|---|
| `pothi-system.css` | `public/pothi-system.css` (or `src/styles/`) | reference-page components: running head, breadcrumb, titles, panel, prose, folio, pager, contents list, range tabs, dense index, colophon, night control |
| `pothi-reader.css` | `public/pothi-reader.css` | reader components: cover/frontispiece, spread, leaves, set list, page, turn bar, mobile index |
| `theme-kalabhairava.css` | `public/theme-kalabhairava.css` | **the only file you edit for brand** — day + night tokens |
| `pothi-theme.js` | `public/pothi-theme.js` | night-reading control (shared, unchanged) |
| `pothi-kalabhairava.html` | `design-reference/` (not shipped) | the target look, built with this site's own names |
| `pothi-name-page.html` | `design-reference/` | name-page template (parent content, structure only) |
| `pothi-range-page.html` | `design-reference/` | range-page template with a 100-row index |
| `DESIGN.md` | `docs/design-system.md` | the system contract: core vs theme, components, rules |
| `NIGHT-MODE.md` | `docs/night-reading.md` | night palette and control behaviour |
| `BUILD-BRIEF-kalabhairava.md` | repo root or `docs/` | the implementation brief for the agent working in that repo |
| `assets/kalabhairava-bg-desktop.webp` | `design-reference/assets/` | only so the demo opens offline; the real image already lives in that repo |

## What deliberately is **not** here

- The parent site's screenshots and boards (~45 MB) — irrelevant to that repo.
- The parent's `dir-2.html` reader prototype — `pothi-kalabhairava.html` is the same reader with this
  site's content, and it opens standalone.
- The parent's data, name mapping, PDF, sitemap, tests.
- The parent's `BUILD-BRIEF.md` — it describes 1,072 names and five guide pages that this site does not have.

## Opening the demo

Open `pothi-kalabhairava.html` directly in a browser. It needs `pothi-reader.css`,
`theme-kalabhairava.css`, `pothi-theme.js` and `assets/kalabhairava-bg-desktop.webp` beside it — all
included. No server, no build.

## The two facts that change the parent's numbers

- **1,000 names → 91 sets** (90 full sets of eleven + a final set of ten). Do not hard-code 98.
- **10 ranges** of 100 names. Do not hard-code 11.

Everything else — the components, the type pairing, the night palette — is copy-and-go.
