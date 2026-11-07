# Owner actions

Steps only the site owner can complete for `bhairavakalikenamosthute.com`.
Nothing here requires touching the Astro code.

## 1. Google Search Console

1. Confirm the property for `https://bhairavakalikenamosthute.com` is verified.
2. After the Astro deployment is live, open **Sitemaps** and submit:
   `https://bhairavakalikenamosthute.com/sitemap.xml`
3. Confirm the report lists **946 discovered URLs** (925 name pages + 10 ranges
   + names hub + homepage + 9 landing/trust pages).
4. Use **URL Inspection** on:
   - `https://bhairavakalikenamosthute.com/`
   - `https://bhairavakalikenamosthute.com/names/`
   - `https://bhairavakalikenamosthute.com/108-names-of-kalabhairava/`
   - `https://bhairavakalikenamosthute.com/names/bhairavaya/`
   - `https://bhairavakalikenamosthute.com/kalabhairava-sahasranama-pdf/`
   Request indexing once each; then leave it to Google.
5. Check **Pages → Indexing** over the following weeks. Expect the 925 name
   pages to be discovered through the static hub/ranges and sitemap.

## 2. Bing Webmaster Tools

1. Import the site from Google Search Console (or add it manually).
2. Submit the same sitemap.
3. Optional: enable IndexNow later if you want instant URL submission.

## 3. Cloudflare Pages

1. Change build configuration to Astro:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: `22`, environment variable `HUSKY=0`
2. Keep the apex domain as canonical; the site includes a `www` → apex redirect
   in `public/_redirects`.
3. After deploy, purge cache for `/`, `/names/*`, `/sw.js`, `/version.json`.
4. Optional: add a Cloudflare cache rule so HTML is revalidated while
   `/downloads/*.pdf`, images and `/reference.css` are cached for longer.

## 4. Analytics

- The homepage uses GA4 property **`G-7MXEHWVXYL`** (the property the old
  Kalabhairava site used). The copied template originally pointed at the Makali
  property; it has been corrected, but confirm the property is the one you want.
- Static reference pages do not load Analytics.
- No consent banner is configured; if you need one for your jurisdiction, add it
  before enabling ads or embedding third-party media.

## 5. Archive.org editions

Verify these public editions still resolve; the PDF landing page links them:

- English: <https://archive.org/details/Kalabhairava-sahasranama-kaliputraashish>
- Hindi: <https://archive.org/details/Kalabhairava-sahasranama-in-Hindi-kaliputraashish>
- Second digital edition: <https://archive.org/details/kalabhairavaBaba_1000names_ebook_Final_SecondDigitalEdition>

If an identifier changes, update `archiveEnglish`, `archiveHindi` and
`archiveSecondEdition` in
`src/pages/kalabhairava-sahasranama-pdf/index.astro`.

## 6. Content review (recommended before heavy promotion)

- Review the **71 reviewed spelling overrides** in
  `seo/data/name-overrides.json` (English spelling corrections). The mapping
  report is `seo/name-mapping-report.md`.
- Known follow-up: Devanagari for those overridden rows is still the recovered
  legacy spelling; a future pass can regenerate Devanagari from the site
  spelling.
- The 108-name page uses positions 1–108 from the 1,000-name text. Confirm this
  is the practice set you want to feature.
- Confirm the PDF cover image/credit line is acceptable
  (`Tryst With Kaali — Praveen Radhakrishnan` is retained in the image and
  credited in the PDF final page).

## 7. Backlinks / launch

1. Link to the new landing pages from the parampara sites and social profiles.
2. Share the PDF page and 108-names page as the two primary entry points.
3. Add the site to the author's GitHub profile / archive.org item descriptions.
4. Optional: create a short post or reel about the 1,000-name chant and link to
   `/kalabhairava-sahasranama-lyrics/`.

## 8. Confirmations for the agent/handoff

- [ ] Cloudflare build settings switched to Astro (`npm run build` → `dist`).
- [ ] Production deploy verified with the post-deploy checklist in
      [`DEPLOYMENT.md`](DEPLOYMENT.md).
- [ ] Sitemap submitted in GSC and Bing.
- [ ] GA property confirmed.
- [ ] Owner approved the spelling overrides / pending Devanagari follow-up.
