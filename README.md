# TinyNotes

TinyNotes is a Next.js 15 App Router app running on Bun with SQLite-backed auth, note CRUD, public sharing, and browser coverage through Playwright.

## Getting Started

1. Install dependencies with `bun install`.
2. Copy `.env.example` to `.env` if you need to override local settings.
3. Apply migrations with `bun run migrate`.
4. Start the app with `bun run dev`.

## Core Commands

- `bun run dev` starts the local development server.
- `bun run build` builds the production app.
- `bun run start` serves the production build locally.
- `bun run lint` runs Next.js lint checks.
- `bun run typecheck` runs strict TypeScript checks.
- `bun run migrate` applies pending SQLite migrations.
- `bun run migrate:down -- <steps>` rolls back recent migrations.

## Browser Tests

The repository includes an isolated Playwright workspace in `browser-tests/`.

- `bun run test:browser` runs the browser suite headlessly.
- `bun run test:browser:headed` runs the same suite with a visible browser.
- `bun run test:browser:ui` opens the Playwright UI runner.
- `bun run test:browser:install` installs the Chromium browser used by the suite.

Every Playwright test saves a screenshot evidence file into `browser-tests/artifacts/screenshots/`.

Detailed browser test instructions live in [docs/browser-tests.md](/C:/Users/andrs/Desktop/CFPartners/codex/docs/browser-tests.md).
