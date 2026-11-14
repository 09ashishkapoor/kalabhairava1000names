# Night reading — does a mode selector fit?

**Verdict: yes — but as *night reading*, not as a dark theme.** It is already built and live in the
prototypes: the reader (`dir-2.html`), the name page and the range page all switch.

![Day and night](review/day-night-board.png)

## Why it fits here (and why it usually doesn't)

Most dark modes are a colour inversion bolted onto a brand that only ever thought about white. This
site is the opposite case. Kali *is* the night; the names are recited after dark; the site's original
idea was literally "The Midnight Shrine"; and the dominant use case is a phone in bed. Skipping night
mode would be the strange choice.

What must not happen is the anti-reference in `PRODUCT.md`: "dark horror or occult shock". That is why
the night palette is **warm ink-black**, not black, and why the accent gets *lighter* rather than
hotter. It should feel like the same book read by lamplight, not a different website.

## The rule that makes it work

Night mode is **the same paper, after dark** — a second set of tokens, never an inversion:

| Token | Day | Night | Night contrast |
|---|---|---|---|
| paper (surfaces) | `#faf3e3` | `#1a1410` | — |
| ground | `#eee3ca` | `#120e0b` | — |
| ink | `#1b1510` | `#efe3cd` | 15.1:1 |
| ink-2 (prose) | `#4a3f31` | `#d3c5ad` | 11.3:1 |
| ash (captions) | `#5b5142` | `#a99a83` | 7.0:1 |
| cinnabar (accent) | `#9c2b1c` | `#e0604a` | 5.4:1 |
| gold (numerals) | `#775a21` | `#d3ab5a` | 8.9:1 |
| rules | `#cdbc9c` | `rgba(211,171,90,.20)` | — |

Two rules learned from the review of the current site:
1. **The accent flips direction.** On paper, crimson had to be *darkened* to pass 4.5:1; on ink it has
   to be *lightened*. A single "brand red" cannot do both jobs.
2. **Shadows are replaced by hairlines.** A drop shadow on `#120e0b` is invisible; separation comes from
   a 1px gold rule instead.

Images are **dimmed, not inverted**: the frontispiece drops to 60% brightness so the statue reads like a
print under a lamp. Inverting photographs is where most dark themes become horror posters.

## The control: small, textual, in the running head

```
◯ NIGHT        (day)          ● DAY        (night)
```

- A single button at the right end of the running head: hollow circle + "Night" in small caps; filled
  circle + "Day" when active. No sun/moon icons (they read as a settings app), no three-state menu
  (auto/day/night is a preference users rarely change twice), no floating pill over the content.
- **Default follows the system** (`prefers-color-scheme`), so most people never touch it.
- **An explicit choice is remembered** (`localStorage`, key `pothi-theme`) and survives navigation.
- **No flash**: a 6-line inline script sets `data-theme` on `<html>` before first paint.
- On phones it moves to the brand row (top right) so it does not add a row to the header.
- Print is always day (`@media print` restores the day tokens) — the PDF edition is unchanged.
- Keyboard and screen readers get a real button: `aria-pressed` and a changing `aria-label`
  ("Switch to night reading" / "Switch to day reading").

## What is already in the files

| File | Change |
|---|---|
| `pothi-system.css` | night tokens, `color-scheme`, print fallback, theme control styles; hard-coded colours replaced by `--rule-soft`, `--edge-band`, `--hover`, `--panel-shadow` |
| `pothi-theme.js` | **the shared control**: delegation, persistence, system-follow while no explicit choice, `aria-pressed` and label updates |
| `dir-2.html` (reader) | same tokens inline, toggle in the bar, pre-paint script, frontispiece dimming, gutter/shadow treatment |
| `pothi-name-page.html`, `pothi-range-page.html` | toggle + pre-paint script + shared `pothi-theme.js` |

The pre-paint script stays inline in each page's `<head>` (it must run before first paint); the
interaction itself is one shared file, so every future template gets the control by adding three lines:
the button, the head script, and the script tag.

Verified: click and keyboard both toggle, state persists across pages, system preference is respected
when nothing is stored, print reverts to day, and both themes hold at 1440, 768, 375 and 320.
Measured contrast in night mode: **no active text below 4.5:1**.

## What I would *not* do

- **No automatic sunset switch.** It sounds charming and behaves unpredictably (laptop at 4pm, phone in
  a dark room). System preference + an explicit choice is enough.
- **No per-page theme.** One choice for the whole site.
- **No "true black" option.** On OLED the pure-black look is tempting, but it kills the paper metaphor
  and makes the gold hairlines look like neon. If you ever want it, it is a third token set, not a tweak.
- **No dark PDF.** The printed edition stays light — it is printed on paper.

## Effort

Night mode is **half a day** on top of the build: tokens, the control, the no-flash script, print
fallback, and one visual-regression pass for both themes. The palette above is already measured, so
there is no exploration left — only implementation.
