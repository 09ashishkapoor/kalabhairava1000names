---
name: The Pothi
description: A paper-on-desk devotional reading system. Built for the Maa Ādya Mahākālī Sahasranāma; portable to the sister sites.
version: 1.0
status: approved, not yet implemented
layers:
  core: pattern, structure, type relationship — never changes between sites
  theme: ink, paper, accent, imagery treatment — one file per site
colors:
  day:
    paper: "#faf3e3"
    ground: "#eee3ca"
    strip: "#f2e7cf"
    ink: "#1b1510"
    ink-secondary: "#4a3f31"
    ash: "#5b5142"
    cinnabar: "#9c2b1c"
    gold: "#775a21"
    rule: "#cdbc9c"
    desk: "#ddcfb2"
  night:
    paper: "#1a1410"
    ground: "#120e0b"
    strip: "#171210"
    ink: "#efe3cd"
    ink-secondary: "#d3c5ad"
    ash: "#a99a83"
    cinnabar: "#e0604a"
    gold: "#d3ab5a"
    rule: "rgba(211,171,90,0.20)"
    desk: "#0c0907"
typography:
  latin: { family: "Crimson Pro", weights: [300, 400, 600], styles: [roman, italic] }
  devanagari: { family: "Tiro Devanagari Sanskrit", weights: [400], fallback: "Noto Serif Devanagari" }
  scale:
    display: "clamp(54px, 9vw, 118px)"
    section: "clamp(21px, 2.2vw, 27px)"
    body: "19px / 18px mobile"
    caption: "12.5–14px, small caps"
rounded: 0
spacing: "8pt; margins are the composition, minimum 20% of the page"
---

# Design system: The Pothi

## Overview

**Creative north star: "the book on the desk."** A page of a printed devotional book, laid on a
warm wooden desk, read by daylight or by lamp. Paper is the surface, the Devanagari is the object,
and the only colour is the red of the ink used for the name you are reading.

The system exists to solve a specific failure: the previous design treated a sacred text as a
landing page (hero, cards, buttons) and split the site into two visual systems. The Pothi has **one
system, one stylesheet, and a second colour set for night reading**.

**Key characteristics:** warm paper · one accent, used sparingly · Devanagari first, Latin second ·
hairline rules instead of borders/shadows · no cards, no pills, no icons · generous margins.

## Two layers — this is what makes it portable

| Layer | Contains | Changes per site? |
|---|---|---|
| **Core** | page grid, running head, breadcrumb, kicker, titles, panel, prose measure with drop cap, section head with a Devanagari label, folio, pager, leader-dot contents list, dense index rows, colophon footer, night-reading control | **No** |
| **Theme** | `--paper`, `--ink`, `--cinnabar`, `--gold`, `--rule`, `--desk`; the Latin + Devanagari font pairing; imagery treatment | **Yes — one small file** |

A sister site takes `pothi-system.css` unchanged and adds a theme file that overrides the colour and
font tokens. It never forks the components. That is the whole point: forking is how the previous
two-system mess happened.

## Colours

Paper, ink, and **one** accent. Day and night are the same book under different light — night is not
an inversion, it is a second paper.

- **Cinnabar** is the accent: IAST transliteration, the current item, links, folios, one rule per
  page at most. On paper it must be dark enough to read (`#9c2b1c`, 6.8:1); on ink it must be light
  enough (`#e0604a`, 5.4:1). A single brand red cannot do both jobs.
- **Gold** marks numbers and numerals only (positions, ranges, counts). It never carries a sentence.
- **Ink** is never `#000`; night paper is never `#000`. Warm blacks keep the paper metaphor.
- **Contrast:** every active text ≥4.5:1 in both themes. Disabled controls may sit lower.

**The one-accent rule.** If a screen has cinnabar in more than three places, it has stopped being an
accent. Gold hairlines are structure, not decoration.

## Typography

- **Devanagari:** Tiro Devanagari Sanskrit — a text face for Sanskrit, not a UI font. It carries
  names at display size (up to 118px) and at reading size (20–30px). Never letterspaced, never
  uppercase, never synthetic bold.
- **Latin:** Crimson Pro — a book serif with real italics. Used for everything Latin: prose, captions,
  small-caps labels, numerals.
- **The relationship:** Devanagari is primary; the IAST line in cinnabar italic is the bridge; the
  English meaning is the commentary. If a page shows only Latin, it is a utility page (index, hub),
  not a reading page.
- **Small caps, not uppercase.** Labels use `font-variant: all-small-caps` with 0.12–0.17em tracking.
  All-caps micro-labels are a template tell and are banned.
- **Measure:** 60–66ch for prose; display type may exceed it. Body 18–19px desktop, 17.5px phone.

## Layout and rhythm

- **One column, generous margins.** Content sits inside `clamp(20px, 5vw, 72px)` page margins; the
  reading column is left-aligned, never centred.
- **Hairlines carry structure.** Sections are separated by 1px rules, panels by a 1px `--rule-dark`
  border. No shadows in night mode; one soft paper shadow in day mode.
- **Numbers live in the margin**, not in badges: position, folio, range.
- **The spread** (two leaves with a gutter) is reserved for the reader; reference pages use a single
  sheet.
- **Density is allowed** on index pages — a 100-row two-column index is the correct form for a
  reference, not a grid of cards.

## Components

Running head (brand + nav + night control) · breadcrumb · kicker · `dev-title` / `iast-title` /
`num-title` · panel (with optional two-column prose + definition list) · prose with drop cap ·
`sec` heading with a Devanagari label · folio · name pager (previous/next with Devanagari) ·
leader-dot contents list · range tabs · dense index row · colophon footer · fore-edge thumb index ·
night-reading control.

All specified in `design-demos/pothi-system.css`; the markup patterns are in the three prototypes.

## Content patterns (data-dependent — re-derive per site)

These are *not* decoration; they must map to real structure or they become theatre:

| Pattern | Needs | If the site has no such structure |
|---|---|---|
| Sets of eleven + pager | a numbered sequence | use chapter/issue numbers, or drop the pager |
| Fore-edge of 98 sets | 98 sets that exist | use the number of articles/issues, or omit |
| Folio = position number | stable positions | use page numbers within a section |
| Dense index of names + meanings | a list with two fields | index rows of title + standfirst |
| Devanagari + IAST on every entry | Sanskrit source text | show Latin title + italic subtitle instead |

**Rule:** if removing a structural device makes the page clearer, the device was borrowed, not designed.

## Night reading

A second token set, plus a small control in the running head (`◯ Night` / `● Day`). Follows the
system preference until the reader chooses; the choice persists; print always reverts to day. Images
are dimmed, never inverted. Full spec: `design-demos/NIGHT-MODE.md`.

## Do / Don't

**Do** let the Devanagari be the largest thing on the page · use one accent · put numbers in the margin
· set labels in small caps · show the meaning without a click · keep 20%+ of every screen empty ·
route all colour through tokens so night mode costs nothing.

**Don't** use cards, pills, badges, emoji, glow, gradient text, or uppercase micro-kickers · centre the
reading column · invert photographs · let gold carry sentences · copy the 11-name pacing onto a site
that has no sets of eleven · fork the stylesheet per site.

## Porting checklist (for a sister site)

1. Copy `pothi-system.css` and `pothi-theme.js` unchanged.
2. Write `theme-<site>.css` with that site's paper/ink/accent/font pairing (start from the tokens above).
3. Map its page types onto the five templates (reader, entry page, index/range, guide, text).
4. Re-derive the content patterns in the table above from its real data — or drop them.
5. Run the contrast check in both themes and the 320/375/1440 overflow check.
6. Only then restyle; never fork a component to make a page fit.
