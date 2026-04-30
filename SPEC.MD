# TinyNotes - SPEC (Bun + TypeScript + Next.js + SQLite)

## 0) Goals and constraints

### Features

* Email+password authentication.
* Authenticated users can create, view, edit, delete notes.
* Notes can be shared publicly via an unguessable link token.
* Share link can be disabled (revoked) by the note owner.
* Unauthenticated users can view shared notes via `/s/[token]`.

### Constraints

* Bun runtime, TypeScript, Next.js **App Router**, TailwindCSS.
* Rich text via TipTap. Stored as **TipTap JSON**; rendered as **sanitized HTML** for display.
* SQLite via **Bun's built-in SQLite client**.
* No file storage, no images in notes.
* Raw SQL only (no ORM); custom migrations script.
* No password reset, no email confirmation, no outbound email sending.
* Minimal but **proper error handling** (no sensitive detail leakage).
* Custom **404 page**.
* Styling: "elegant acqua colors".

---

## 1) Architecture overview

### Rendering and data access

* Use Next.js App Router.
* Use **React Server Components** for all note data reads.
* Use **Server Functions (Server Actions)** for all note mutations.
* Do not use client-side data fetching for initial note/page data (`useEffect() + fetch()` etc.).
* Do not add custom REST/JSON endpoints for notes or sharing.
* Client Components only for TipTap editor UI, form state, minimal interactivity, and invoking Server Actions.
* `/notes`, `/notes/new`, `/notes/[id]`, and `/s/[token]` read their initial data exclusively in Server Components via direct server-side data-access functions.
* The application does not support query-parameter-driven note views. Route params are used only as resource identifiers (`[id]`, `[token]`).

### Auth

* Custom credentials auth:
  * Register / login via email+password.
  * Session management via secure cookie (httpOnly) backed by the `sessions` SQLite table.
* App authorization:
  * Only owners can read/write their notes on authenticated routes.
  * Public shared route checks token and share status.

### Notes content pipeline

* Store:
  * `content_json` (TipTap JSON string).
  * Do not store `content_text`, derived plaintext, FTS/search shadow data, or filter-oriented metadata.
* Render:
  * TipTap JSON -> HTML on server.
  * **Sanitize** HTML (strict allowlist) before returning/serving to clients, especially on the public share view.

---

## 2) Routes (UI)

### Public

* `GET /` -> if authenticated redirect to `/notes`, else redirect to `/login`.
* `GET /login` -> login form.
* `GET /register` -> registration form.
* `GET /s/[token]` -> public shared note view (sanitized HTML).

### Authenticated

* `GET /notes` -> list user's notes (sorted by `updated_at DESC`).
  * No filtering, search, pagination, or query-string-controlled list state.
* `GET /notes/new` -> create note page (editor).
* `GET /notes/[id]` -> view/edit note page (editor + share controls).

### Not found

* `app/not-found.tsx` custom 404 for missing pages/resources.

---

## 3) Server Functions (Server Actions)

Mutations are implemented as Server Actions invoked from forms and client interactions. Reads are done in Server Components by directly calling server-side data-access functions.

No application-level note/share mutation may be implemented via custom API routes. Server Actions are the only mutation interface for note CRUD and share toggles.

### Notes actions (authenticated; require session)

* `createNoteAction(input: { title?: string; contentJson: object })`
* `updateNoteAction(input: { id: string; title?: string; contentJson?: object })`
* `deleteNoteAction(input: { id: string })`

All actions return typed result objects (success/error) and must not leak SQL/internal details in user-facing messages.

Required cache revalidation behavior:

* `createNoteAction` revalidates `/notes`.
* `updateNoteAction` revalidates `/notes/[id]` and any route that renders the same note content, including `/s/[token]` when sharing is enabled.
* `deleteNoteAction` revalidates `/notes`.

### Share actions (authenticated; require session)

* `enableShareAction(input: { id: string })` -> `{ shareUrl, token, shareEnabled: true }`
* `disableShareAction(input: { id: string })` -> `{ shareEnabled: false }`

Required cache revalidation behavior:

* `enableShareAction` revalidates `/notes`, `/notes/[id]`, and the resulting `/s/[token]` route.
* `disableShareAction` revalidates `/notes`, `/notes/[id]`, and invalidates the previously shared `/s/[token]` route so it resolves to 404.

### Public shared note read

* `/s/[token]` Server Component resolves token server-side and renders sanitized HTML.
* Invalid/disabled token or missing note must resolve to the same **404** behavior.

---

## 4) Data model (SQLite schemas)

### General conventions

* Use `TEXT` for IDs/tokens.
* Use `INTEGER` for booleans (0/1).
* Use UTC ISO8601 strings for timestamps.

### Tables

#### `users`

* `id TEXT PRIMARY KEY`
* `email TEXT NOT NULL UNIQUE`
* `name TEXT NOT NULL`
* `password TEXT NOT NULL`
* `created_at TEXT NOT NULL`

#### `sessions`

* `token TEXT PRIMARY KEY`
* `user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
* `created_at TEXT NOT NULL`
* Index: `CREATE INDEX idx_sessions_user_id ON sessions(user_id);`

#### `notes`

* `id TEXT PRIMARY KEY`
* `user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
* `title TEXT NOT NULL DEFAULT ''`
* `content_json TEXT NOT NULL`
* `share_enabled INTEGER NOT NULL DEFAULT 0`
* `created_at TEXT NOT NULL`
* `updated_at TEXT NOT NULL`
* No `content_text` column, no full-text search table, and no additional filter/search support columns.
* Index: `CREATE INDEX idx_notes_user_id_updated_at ON notes(user_id, updated_at DESC);`

#### `shares`

Purpose: store public tokens separately and allow disable without deleting.

* `id TEXT PRIMARY KEY`
* `note_id TEXT NOT NULL UNIQUE REFERENCES notes(id) ON DELETE CASCADE`
* `token TEXT NOT NULL UNIQUE`
* `token_hash TEXT NOT NULL UNIQUE`
* `enabled INTEGER NOT NULL DEFAULT 1`
* `created_at TEXT NOT NULL`
* `disabled_at TEXT NULL`
* Index: `CREATE INDEX idx_shares_token_hash ON shares(token_hash);`

#### `migrations`

* `name TEXT PRIMARY KEY`
* `applied_at TEXT NOT NULL`

### Token handling

* Generate token: 32 random bytes -> base64url.
* Store both the raw token and `token_hash = SHA-256(token)`.
* On public lookup, hash the incoming token and match on `token_hash`.

---

## 5) SQL statements (raw)

### Notes

**List notes**

```sql
SELECT id, title, share_enabled, created_at, updated_at
FROM notes
WHERE user_id = ?
ORDER BY updated_at DESC;
```

**Create note**

```sql
INSERT INTO notes (id, user_id, title, content_json, share_enabled, created_at, updated_at)
VALUES (?, ?, ?, ?, 0, ?, ?);
```

**Get note by id (owner)**

```sql
SELECT id, user_id, title, content_json, share_enabled, created_at, updated_at
FROM notes
WHERE id = ? AND user_id = ?;
```

**Update note**

```sql
UPDATE notes
SET title = COALESCE(?, title),
    content_json = COALESCE(?, content_json),
    updated_at = ?
WHERE id = ? AND user_id = ?;
```

**Delete note**

```sql
DELETE FROM notes
WHERE id = ? AND user_id = ?;
```

### Sharing

**Find share row**

```sql
SELECT id, token, token_hash, enabled
FROM shares
WHERE note_id = ?
LIMIT 1;
```

**Create share**

```sql
INSERT INTO shares (id, note_id, token, token_hash, enabled, created_at, disabled_at)
VALUES (?, ?, ?, ?, 1, ?, NULL);
```

**Re-enable share**

```sql
UPDATE shares
SET enabled = 1,
    disabled_at = NULL
WHERE note_id = ?;
```

**Disable share**

```sql
UPDATE shares
SET enabled = 0,
    disabled_at = ?
WHERE note_id = ?;
```

**Update note share flag**

```sql
UPDATE notes
SET share_enabled = ?, updated_at = ?
WHERE id = ? AND user_id = ?;
```

**Public fetch by token**

```sql
SELECT n.title, n.content_json, n.updated_at
FROM shares s
JOIN notes n ON n.id = s.note_id
WHERE s.token_hash = ?
  AND s.enabled = 1
  AND n.share_enabled = 1
LIMIT 1;
```

---

## 6) TipTap editor specification

### Allowed features

* TipTap `StarterKit`
* Links extension:
  * allow only `http` / `https`
  * `rel="noopener noreferrer"` and open in new tab

### Content storage

* Client sends a TipTap JSON object.
* Server validates:
  * JSON parseable
  * size <= **256KB** serialized

### HTML rendering

* On server: TipTap JSON -> HTML.
* Sanitize using a strict allowlist.
* Public `/s/[token]` must only ever serve sanitized HTML.

---

## 7) Autosave behavior

### Client

* On editor changes, debounce (for example 800-1200ms) and invoke `updateNoteAction`.
* Do not autosave via `fetch()`, route handlers, or custom API endpoints.
* Track "saving / saved / error" UI state.
* Avoid save storms:
  * do not send if content is unchanged
  * cancel pending request on navigation/unmount if possible

### Server

* Accept partial updates and update `updated_at`.
* Enforce payload size and ownership.
* Return updated timestamps and share state.

---

## 8) Error handling and security

### Error contract

* Server Actions should return:
  * `{ error: { code: string, message: string } }`
* `message` must be generic; no SQL details.
* Log full details server-side only.

Suggested `code` values:

* `UNAUTHORIZED`
* `FORBIDDEN`
* `NOT_FOUND`
* `VALIDATION_ERROR`
* `CONFLICT`
* `INTERNAL_ERROR`

### Sensitive info handling

* Public shared note resolution always returns 404 for:
  * invalid token
  * disabled share
  * missing note
* Auth endpoints return generic invalid-credentials errors.

### Security headers

* `Content-Security-Policy`
* `Referrer-Policy: no-referrer`
* `X-Content-Type-Options: nosniff`
* `X-Frame-Options: DENY`
* `Permissions-Policy`

### CSRF

* Use same-site cookie sessions and ensure Server Actions require a valid session.

---

## 9) Styling (Tailwind, "elegant acqua colors")

### Theme

* Add a small acqua palette via CSS variables.
* Use neutral background + acqua accents.
* Keep components consistent across shell, forms, editor, and status states.

### Required page states

* Loading states for note fetch and share fetch.
* Empty list state for `/notes`.
* Inline validation messages.
* No search bar, filter controls, or query-param-driven list UI on `/notes`.

---

## 10) Migrations

### Folder layout

* `migrations/01_create_tables.sql`, `02_seed_demo_data.sql`, etc.
* `scripts/migrate.ts`
* `scripts/migrate-down.ts`

Migration behavior:

* Ensure the `migrations` table exists.
* Read migration files sorted by filename.
* Parse `-- up` and `-- down` sections from each file.
* Apply pending migrations within transactions.
* Record the applied migration filename with timestamp.
* Support rollback by most recent applied migration.
* Run pending migrations only through the explicit migration scripts, not automatically during app startup or route rendering.

### Current migration content

* `01_create_tables.sql`: `users`, `sessions`, `notes`, `shares`, indexes.
* `02_seed_demo_data.sql`: demo user and welcome note.

---

## 11) Environment variables

* `DATABASE_PATH=./data/tinynotes.sqlite`
* `APP_URL=http://localhost:3000`
* Optional: `NODE_ENV`, `LOG_LEVEL`

---

## 12) Acceptance criteria (minimal)

1. Register + login works; session persists via cookie.
2. Authenticated users can create, edit, and delete notes; autosave reliably persists.
3. `/notes` shows notes sorted by last updated.
4. `/notes` has no search, filter, pagination, or query-param-controlled behavior.
5. Enable share returns a link; `/s/[token]` shows sanitized rendered content without auth.
6. Disable share makes `/s/[token]` return 404.
7. Unauthorized access to `/notes/*` redirects to `/login`.
8. Custom 404 page is shown for missing routes/resources.
9. Errors shown to the user are generic; server logs contain details.
10. No note page depends on `useEffect()`-driven initial data fetching.
