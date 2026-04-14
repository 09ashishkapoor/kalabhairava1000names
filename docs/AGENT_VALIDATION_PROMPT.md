# Reusable Website Validation Rollout Prompt

Use this file as the **copy-paste brief** for an agent in another website repo.

## What this standard should add

The target repo should end up with a practical validation stack that shortens manual QA:

- repo smoke/unit checks kept as-is
- Playwright smoke tests for core user flows
- focused accessibility checks with `@axe-core/playwright`
- visual regression snapshots for stable, high-value UI areas
- Playwright-based performance budget checks
- GitHub Actions validation on PRs and pushes
- link checking in CI with `lycheeverse/lychee-action`
- one command to run the local validation set

## Copy-paste prompt for the agent

```md
Build a reusable automated validation baseline for this website repo.

Goals:
- shorten manual review before merge
- create repeatable browser-based checks
- keep the setup small, reviewable, and repo-specific
- make it suitable to standardize across similar static or frontend-heavy sites later

Please implement this exact pattern, adapted to the repo:

1. Keep existing repo tests if present.
2. Add Playwright browser smoke coverage for the highest-value user flows.
3. Add `@axe-core/playwright` accessibility checks for the most stable critical UI flow.
4. Add visual regression snapshots for 2-3 stable areas only.
5. Add a Playwright-based performance budget test for the main page or app shell.
6. Add GitHub Actions so validation runs on pull requests and pushes to the main branch.
7. Add CI link checking with `lycheeverse/lychee-action` for README plus key HTML/entry pages.
8. Add one local command like `npm run validate` that runs the full validation set.
9. Keep the browser matrix intentionally small unless the repo clearly needs more.
10. Document how to update snapshots and how to run the suite locally.

Constraints:
- prefer the lightest working solution
- no unnecessary abstractions
- no new dependencies beyond what is needed for Playwright/axe/link-checking
- adapt selectors, budgets, and visual targets to this repo instead of copying blindly
- avoid flaky snapshot targets; choose stable UI surfaces
- if visual snapshots are platform-specific, make CI match the platform used for baselines
- use repo-relative scripts and files only

Deliverables:
- Playwright config
- smoke tests
- visual regression tests + committed baselines
- performance budget test
- CI workflow
- README or docs update
- final summary listing changed files, verification run, and remaining risks

Verification required before completion:
- existing repo tests pass
- Playwright smoke tests pass
- visual regression tests pass
- performance budget test passes
- syntax/compile checks for touched source files pass

Also add a markdown file in the repo that explains:
- what was standardized
- how to reuse the pattern in future repos
- how to intentionally update visual baselines
```

## Repo-specific things the agent should choose carefully

The agent should **not** blindly copy selectors or budgets from this repo. It should inspect the target repo and choose:

- the 1-3 most important smoke flows
- the most stable accessibility scope
- 2-3 stable visual snapshot targets
- practical performance thresholds for that repo
- whether CI should run on Windows or Linux for snapshot stability

## Recommended acceptance checklist

- [ ] `npm run validate` (or equivalent) passes locally
- [ ] smoke tests cover the main happy path
- [ ] a11y check is scoped and stable
- [ ] visual baselines are committed and reproducible
- [ ] performance budget is meaningful, not arbitrary
- [ ] CI uploads Playwright artifacts on failure
- [ ] link checking runs in CI
- [ ] docs explain local usage and snapshot updates

## Notes from this repo's implementation

For this repo, the pattern ended up being:

- `tests/e2e/site-smoke.spec.js`
- `tests/e2e/visual-regression.spec.js`
- `tests/e2e/perf-budget.spec.js`
- `tests/e2e/helpers.js`
- `playwright.config.js`
- `.github/workflows/validate.yml`

This repo also keeps visual snapshots on a **Windows** baseline, so CI runs the browser-validation job on `windows-latest`.
