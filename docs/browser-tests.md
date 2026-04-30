# Browser Test Guide

This project keeps browser automation in the dedicated `browser-tests/` folder so it can be run independently from linting, type-checking, or other workflows.

## Install The Browser Runtime

Run this once on a machine that has not installed Playwright browsers yet:

```bash
bun run test:browser:install
```

## Run The Suite

Headless:

```bash
bun run test:browser
```

Headed:

```bash
bun run test:browser:headed
```

Interactive Playwright UI:

```bash
bun run test:browser:ui
```

## What The Browser Suite Does

- Starts a dedicated TinyNotes dev server on `127.0.0.1:3001`.
- Uses its own SQLite database under `browser-tests/.runtime/`.
- Runs the feature coverage mapped from [docs/features.md](/C:/Users/andrs/Desktop/CFPartners/codex/docs/features.md).
- Saves a screenshot after every test into `browser-tests/artifacts/screenshots/`.
- Writes Playwright HTML output into `browser-tests/artifacts/report/`.

## Useful Paths

- Config: [browser-tests/playwright.config.ts](/C:/Users/andrs/Desktop/CFPartners/codex/browser-tests/playwright.config.ts)
- Specs: [browser-tests/specs](/C:/Users/andrs/Desktop/CFPartners/codex/browser-tests/specs)
- Evidence screenshots: `browser-tests/artifacts/screenshots/`
- HTML report: `browser-tests/artifacts/report/`

## Run A Single Spec Or Test

Single spec:

```bash
bunx playwright test -c browser-tests/playwright.config.ts browser-tests/specs/sharing.spec.ts
```

Single test by title:

```bash
bunx playwright test -c browser-tests/playwright.config.ts --grep "share revoke"
```

## Notes

- The browser suite creates fresh users during execution, so repeated runs do not need manual cleanup.
- If `3001` is already in use, stop the conflicting process before running the suite.
