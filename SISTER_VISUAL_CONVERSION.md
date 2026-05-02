# Sister Site Visual Conversion Guide

Source of truth: `/mnt/e/projects/productionwebsites/1000namesofmaadya`

This guide exists to make **kalabhairava1000names** visually match the sister site as closely as possible.

## Goal

Match the sister site’s:

- dark shrine background treatment
- centered hero composition
- pill CTA styling
- floating nav button
- card + reveal reading flow
- spacing, contrast, and devotional tone

Ignore the repo’s existing `DESIGN.md` and `PRODUCT.md` while doing this conversion.

## Copy Order

1. Copy the sister site’s visual tokens and component rules.
2. Copy the layout shell and section rhythm.
3. Keep the current content/data, but restyle it to the sister site’s structure.
4. Validate with browser screenshots on desktop + mobile.

## Files to Sync from the Sister Site

Use these as the visual source of truth:

- `public/styles.css` → current `styles.css`
- `public/ui/system.css` → current `ui/system.css`
- `public/ui/components.css` → current `ui/components.css`
- `public/navigation.min.css` / `public/navigation.min.js` → current `navigation.css` / `navigation.js`
- `public/app.js` → current `app.js` only if the markup still matches
- `public/maadya-bg-1111-landscape.webp` / `public/maadya-bg-1111-portrait.webp` → optional, if exact background match is wanted
- `public/MaaAdyaKali_5.webp` → optional, if exact hero/icon match is wanted

## Visual Rules

### Background

- Full-page fixed background image.
- Dark overlay on top.
- Mobile uses portrait image; desktop uses landscape image.
- Background should feel like a shrine wall, not a generic gradient.

### Hero

- Centered vertically and horizontally.
- Large stacked title.
- Short subtitle line beneath.
- Two pill buttons beneath the subtitle.
- One subtle reference link below the buttons.

### Buttons

- Primary: crimson-to-blood-red pill.
- Secondary: dark translucent pill with pale border.
- Large touch target, soft shadow, slight lift on hover.

### Cards

- Dark surfaces.
- Thin low-contrast border.
- Gentle radius.
- No flashy glassmorphism.
- Expansion should feel like deeper reading, not a modal.

### Search + Reading Flow

- Search should sit inside the same dark devotional system.
- Name cards should feel like layered reading vessels.
- Mobile should remain one-column and scroll-friendly.

### Navigation

- Floating circular nav button.
- Bottom-right placement.
- High contrast, but restrained glow.

## Token Direction

Use this palette behavior:

- Black = sacred field
- Charcoal = contained surface
- Crimson = active invocation
- Gold = rare devotional highlight
- Smoke white = primary text

## Structural Expectations

Match the sister site’s page rhythm:

1. Hero
2. Names reader
3. About / meaning sections
4. Sources / reference content
5. Promo / footer area

## Implementation Checklist

- [x] Restyle `body::before` and `body::after` to match sister layering
- [x] Make hero typography and spacing match the sister layout
- [x] Align CTA button shapes, hover states, and shadows
- [x] Align card padding, radius, border, and reveal behavior
- [x] Make search controls visually identical in spacing and tone
- [x] Ensure mobile breakpoint behavior mirrors the sister site
- [x] Keep content identical, but visuals locked to the sister system

## Acceptance Criteria

The conversion is done when:

- desktop screenshots feel indistinguishable at a glance
- mobile hero and cards match the sister site’s tone and spacing
- buttons, cards, and floating nav have the same visual weight
- the page still works with the current content and data

## Notes

If exact pixel matching is required, copy the sister site’s assets too.
If content identity must stay Kalabhairava-specific, keep the current images but preserve the sister site’s spacing, composition, and surface rules.
