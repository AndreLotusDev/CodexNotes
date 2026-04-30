# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js 15 App Router app running on Bun. Route files live under `app/`, including auth pages in `app/login` and `app/register`, note flows in `app/notes`, and public share pages in `app/s/[token]`. Shared server-side logic lives in `lib/` (`auth.ts`, `db.ts`, `migrate.ts`, `notes.ts`, `validation.ts`, `security.ts`). SQLite migrations live in `migrations/`, and migration entry scripts live in `scripts/`. Global styling is in `app/globals.css`, middleware is in `middleware.ts`, and product/architecture requirements are documented in `SPEC.MD`.

## Build, Test, and Development Commands
Install dependencies with `bun install`.

- `bun run dev` starts the local Next.js dev server under Bun.
- `bun run build` creates the production build and catches route/runtime issues.
- `bun run start` serves the production build locally.
- `bun run lint` runs Next.js linting.
- `bun run typecheck` runs strict TypeScript checks.
- `bun run migrate` applies pending SQLite migrations.
- `bun run migrate:down [steps]` rolls back the most recent migration, or multiple migrations when a step count is provided.

Run `bun run lint && bun run typecheck` before opening a PR.

## Coding Style & Naming Conventions
Use TypeScript with `strict` mode assumptions. Prefer 2-space indentation in JSX, CSS, and config files, and keep existing double-quote style in `.ts` and `.tsx` files. Use `PascalCase` for React components, `camelCase` for functions and variables, and kebab-free route folder names that match URLs, for example `app/notes/[id]/page.tsx`. Import shared modules through the `@/*` alias from `tsconfig.json` when practical.

Keep server mutations in Server Actions such as `app/actions.ts`; keep reusable business logic in `lib/` instead of route files.

For backend reads and writes, always scope data access to the authenticated user unless the route is explicitly public by spec, such as `/s/[token]`. Do not fetch or mutate notes by ID alone on authenticated paths; always carry the session user through to queries and authorization checks so operations like "list notes" only return that user's notes and note mutations only affect that user's records.

## Testing Guidelines
There is no dedicated test suite in this checkout yet. For now, treat `bun run lint` and `bun run typecheck` as required checks, and manually exercise login, note CRUD, and share-link flows in `bun run dev`. When working on persistence changes, also verify that migrations apply cleanly with `bun run migrate`. When adding tests, place them near the code they cover or in a small `tests/` directory, and use filenames ending in `.test.ts` or `.test.tsx`.

## Feature Documentation
Keep `docs/features.md` aligned with the current product behavior whenever you create, update, or delete a feature, or materially change a component that affects user-visible behavior. Treat that file as the canonical feature inventory for future Playwright coverage: every documented feature should describe what it does and how to test it manually or in browser automation.

## Commit & Pull Request Guidelines
Git history is not available in this workspace, so follow a simple imperative commit style such as `Add note share revocation handling`. Keep commits focused and scoped to one change. PRs should include a short summary, affected routes/modules, manual verification steps, and screenshots for UI changes. If a change intentionally diverges from `SPEC.MD`, call that out explicitly.
