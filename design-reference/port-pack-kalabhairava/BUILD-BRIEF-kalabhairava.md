# Build brief — The Pothi for bhairavakalikenamosthute.com

You are implementing an approved redesign in **this** repository. The design is finished; this is a
build job. Work on a branch, keep the site shippable, and verify visually.

The pack in this folder contains the system files, the templates and the target demo. Read them before
writing code; open `pothi-kalabhairava.html` in a browser — that is the target.

---

## 1. The site you are changing

| Fact | Value |
|---|---|
| Names in the dataset | **1,000** (5 chunks of 200) |
| Sets of eleven in the reader | **91** (90 full + a final set of 10) — derive it, never hard-code 98 |
| Ranges | **10** (`/names/1-100/` … `/names/901-1000/`) |
| Unique name pages | 935 (`/names/[slug]/`) |
| Guide pages (108 / 1,008 / PDF / lyrics / benefits) | **none** — do not add nav for them |
| About / contact / privacy | **none** — only `/sources/` |
| 404 | **none today: unknown URLs return the homepage with HTTP 200.** Add a real 404 |
| Devanagari + IAST | **already in the build mapping** (e.g. `भैरवाय` · `Bhairavāya` · common `Bhairava` · source `BHAIRAVAAYA`) |
| Runtime chunks | ASCII name + one-line meaning + elaboration only — same gap the parent site had |

## 2. What to build

Replace the current stylesheets with the Pothi system and move the page types onto it:

| Route | Today | Target |
|---|---|---|
| `/` | hero + card grid + "Read More" | the reader: frontispiece, 91-set fore-edge, two-leaf spread, mobile index |
| `/names/[slug]/` | title + "What X means" + elaboration | name page: Devanagari `h1`, IAST, spelling table panel, measured prose, position folio, previous/next name |
| `/names/1-100/` … | 100-row table | range page: Devanagari numeral title, 10 range tabs, two-column index |
| `/names/` | hub | hub: title, range tabs, contents list |
| `/sources/` | text page | text template: single measured column |
| unknown | homepage (200) | a real 404 |

## 3. Non-negotiables

1. **Server-render everything.** Names, meanings, elaborations, links must be in the HTML Astro emits.
   Render Devanagari + IAST from the build mapping (the parent site does the same); the runtime chunks
   stay the source for everything after the first set.
2. **URLs, titles, descriptions, canonicals, structured data and internal links stay as they are.**
   This is a visual rebuild; the 946 sitemap URLs must survive.
3. **One stylesheet system**, not two. `pothi-system.css` + `pothi-reader.css` + `theme-kalabhairava.css`.
   Delete the old CSS from the build.
4. **Do not fork a component to make a page fit.** If something does not fit, fix the component or say so.
5. **Night reading is required on every page**: the button in the running head, the pre-paint script
   inline in `<head>`, `pothi-theme.js` with `defer`. Day is the default when the system has no preference.
6. **Accessibility floor:** body ≥17.5px on phones; all active text ≥4.5:1 in **both** themes; visible
   focus; 44px controls; `prefers-reduced-motion` respected.
7. **No new dependencies**, no CSS framework, no client-side routing.
8. **Do not rewrite the meanings or elaborations.** Their voice ("Salutations To The one who is
   terrifying and destroys fear.") is the site's own; keep it verbatim.
9. **No emoji, no glows, no pills, no uppercase micro-labels** — those were the failures being replaced.

## 4. Files in this pack, and what to do with them

- `theme-kalabhairava.css` — copy to `public/`. **Only edit this for brand.**
- `pothi-system.css`, `pothi-reader.css`, `pothi-theme.js` — copy to `public/` unchanged.
- `pothi-kalabhairava.html` — the target; keep in `design-reference/`, not shipped.
- `pothi-name-page.html`, `pothi-range-page.html` — structure references (parent content).
- `DESIGN.md`, `NIGHT-MODE.md` — the contract; put under `docs/`.

If this repo's layout/layout names differ from the parent's, map them yourself — the pack's file names
are the parent's conventions, the patterns are what matter.

## 5. Order of work

1. Branch. Copy the four shared files. Wire the layout `<head>`: fonts (Crimson Pro + Tiro Devanagari
   Sanskrit, self-host/subset before launch), `theme-kalabhairava.css`, `pothi-system.css`, the
   pre-paint theme script, `pothi-theme.js`.
2. **Name page first** — smallest blast radius, proves the system on real data. Compare against
   `pothi-name-page.html`.
3. Range pages + hub (static rows, no JS).
4. Reader: server-render the first set of eleven from the mapping; keep search, set paging and the
   note disclosure; compute 91 sets from the total.
5. `/sources/` text page + a real 404.
6. Delete the old CSS/JS, update the design docs, then validate: unit tests if any, a production build,
   and a visual pass at 1440 and 375 in **both** themes.

## 6. Definition of done

- [ ] Every route in §2 renders in the Pothi system; no page still loads the old stylesheets.
- [ ] The reader shows Devanagari + IAST + meaning without a tap; eleven names per set; 91 sets.
- [ ] Search works and is accent-insensitive (`bhairava` finds `Bhairavāya`).
- [ ] Name pages: real slugs, Devanagari `h1`, correct previous/next, correct breadcrumbs.
- [ ] Night selector on every page: persists, follows the system when unset, no flash, print = day.
- [ ] Unknown URLs return a real 404 (not the homepage with 200).
- [ ] No horizontal scroll at 320 / 375 / 1440; no console errors; no failed requests.
- [ ] `sitemap.xml` regenerated and all 946 URLs still resolve.
- [ ] A text diff of a name page and a range page before/after shows no copy changes.

## 7. Do not

- Do not change URLs, redirects, robots, `llms.txt`, or the sitemap's URL set.
- Do not add guide/PDF pages or nav items this site does not have.
- Do not copy the parent site's content, dedication or numbering.
- Do not re-explore the design direction or "improve" the system on the way through.

## 8. Report back

For each page type: a day and night screenshot at 1440 and 375, one line on what changed, and any
deviation from `pothi-kalabhairava.html` with the reason. End with the build/validation result and the
list of files touched.
