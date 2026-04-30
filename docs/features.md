# TinyNotes Feature Documentation

This document tracks the current user-facing behavior in TinyNotes. Keep it updated whenever a feature or component change affects what users can do, what they can see, or how a flow should be tested.

## How To Use This File

- Use this file as the source of truth for future Playwright coverage.
- When a feature is added, updated, or removed, update the matching section in this file in the same change.
- Prefer documenting real product behavior over intended behavior.
- Each feature entry should explain both the functionality and the expected test flow.

## Feature: Root Route Redirect

- [x] Playwright test written

### Functionality

- Visiting `/` redirects authenticated users to `/notes`.
- Visiting `/` redirects unauthenticated users to `/login`.

### How To Test

1. Open `/` in a fresh browser session with no authenticated cookie.
2. Confirm the app redirects to `/login`.
3. Sign in successfully.
4. Open `/` again.
5. Confirm the app redirects to `/notes`.

## Feature: Login

- [x] Playwright test written

### Functionality

- `/login` shows the login screen for unauthenticated users.
- The screen includes email and password inputs and a submit button.
- A demo credential hint is shown: `demo@tinynotes.local` / `password123`.
- Successful login redirects to `/notes`.
- Invalid credentials return a generic error message.
- Authenticated users visiting `/login` are redirected to `/notes`.

### How To Test

1. Open `/login` while signed out.
2. Confirm the email, password, and `Sign in` controls are visible.
3. Confirm the demo credential hint is visible.
4. Submit invalid credentials.
5. Confirm a generic error message appears and the user stays on `/login`.
6. Submit valid credentials.
7. Confirm the app redirects to `/notes`.
8. While signed in, open `/login` again.
9. Confirm the app redirects to `/notes`.

## Feature: Registration

- [x] Playwright test written

### Functionality

- `/register` shows the account creation form for unauthenticated users.
- The form requires name, email, password, and password confirmation.
- Registration validates required fields, minimum password length, and matching passwords.
- Successful registration redirects to `/notes`.
- Authenticated users visiting `/register` are redirected to `/notes`.

### How To Test

1. Open `/register` while signed out.
2. Confirm the name, email, password, and confirm password fields are visible.
3. Submit the form with missing values and confirm validation feedback is shown.
4. Submit with a password shorter than 8 characters and confirm the error message appears.
5. Submit with mismatched passwords and confirm the error message appears.
6. Submit valid registration data for a new user.
7. Confirm the app redirects to `/notes`.
8. While signed in, open `/register`.
9. Confirm the app redirects to `/notes`.

## Feature: Authenticated Notes Shell

- [x] Playwright test written

### Functionality

- All authenticated notes routes use the shared notes layout.
- The header shows the product label, signed-in user name, a `New note` link, and a `Sign out` action.
- The `All notes` link is shown on note detail pages and hidden on `/notes`.
- Unauthenticated access to `/notes`, `/notes/new`, and `/notes/[id]` redirects to `/login`.

### How To Test

1. While signed out, open `/notes`.
2. Confirm the app redirects to `/login`.
3. Sign in and open `/notes`.
4. Confirm the shared header is visible with `New note` and `Sign out`.
5. Open `/notes/new` and confirm an `All notes` link is shown in the header.
6. Click `Sign out`.
7. Confirm the app redirects to `/login`.

## Feature: Notes List

- [x] Playwright test written

### Functionality

- `/notes` lists only the authenticated user's notes.
- Notes are ordered by `updated_at` descending, so the most recently changed note appears first.
- Each list item shows the note title, formatted updated timestamp, and sharing status badge.
- Clicking a note opens `/notes/[id]`.
- If the user has no notes, an empty state card is shown instead of a list.

### How To Test

1. Sign in as a user with at least one note.
2. Open `/notes`.
3. Confirm each note card shows a title, timestamp, and `Private` or `Shared` badge.
4. Click a note card and confirm the app opens `/notes/[id]`.
5. Edit a different note so its `updated_at` changes, then return to `/notes`.
6. Confirm the updated note now appears first in the list.
7. Sign in as a brand-new user with no notes.
8. Open `/notes`.
9. Confirm the empty state message is shown.

## Feature: New Note Draft

- [x] Playwright test written

### Functionality

- `/notes/new` opens a client-side draft state before anything is persisted.
- The initial draft starts with an empty title and empty TipTap document.
- The page shows a `Draft` panel explaining that the note is not real until created.
- The create action is disabled until the draft has either a title or content and is different from the initial empty state.

### How To Test

1. Sign in and open `/notes/new`.
2. Confirm the title input is empty.
3. Confirm the editor is empty and the status badge reads `Unchanged`.
4. Confirm the `Create note` button is disabled.
5. Type a title or body content.
6. Confirm the status badge changes to `Ready`.
7. Confirm the `Create note` button becomes enabled.

## Feature: Note Creation

- [x] Playwright test written

### Functionality

- Creating a note is done from `/notes/new`.
- The app rejects empty untitled notes.
- After a successful create, the user is navigated to `/notes/[id]?toast=created`.
- The toast system converts the query parameter into a `Note created.` toast and removes the query parameter from the URL.

### How To Test

1. Sign in and open `/notes/new`.
2. Without entering any title or content, try to create a note if the control becomes available through UI manipulation.
3. Confirm the user receives the error `Add a title or some content before creating a note.`
4. Enter a unique title and some body content.
5. Click `Create note`.
6. Confirm the app navigates to the new `/notes/[id]` route.
7. Confirm a `Note created.` toast appears.
8. Refresh the page and confirm the toast query parameter is no longer present in the URL.
9. Return to `/notes` and confirm the new note appears in the list.

## Feature: Note Editing And Autosave

- [x] Playwright test written

### Functionality

- Existing notes open in `/notes/[id]`.
- The title field and TipTap content can both be edited.
- Changes autosave with a debounce of about 900ms.
- Autosave only runs when the serialized note content differs from the last saved state.
- The status badge reflects `Ready`, `Saving...`, `Saved`, or `Error`.
- Successful autosave shows a `Note saved.` toast.

### How To Test

1. Sign in and open an existing note.
2. Change the title.
3. Confirm the status badge changes to `Saving...` shortly after the edit.
4. Wait for the save to complete.
5. Confirm the status badge changes to `Saved`.
6. Confirm a `Note saved.` toast appears.
7. Refresh the page.
8. Confirm the updated title is still present.
9. Repeat the test with body content changes in the editor.

## Feature: Rich Text Editing Toolbar

- [x] Playwright test written

### Functionality

- The editor supports bold, italic, underline, strike, heading 1, heading 2, bullet list, ordered list, blockquote, code block, link, undo, and redo.
- Toolbar buttons show active state styling when the corresponding mark or block is active.
- Link insertion prompts for a URL.
- Clearing the prompt value removes an existing link from the selected text.

### How To Test

1. Open a note in create or edit mode.
2. Type sample text and select part of it.
3. Apply bold, italic, underline, and strike, confirming the toolbar buttons reflect active state.
4. Create a heading, bullet list, ordered list, blockquote, and code block, confirming each format applies in the editor.
5. Select text and click the link button.
6. Enter a valid `https://` URL and confirm the text becomes linked.
7. Trigger the link prompt again for linked text, clear the value, and confirm the link is removed.
8. Use undo and redo and confirm the editor state changes accordingly.

## Feature: Live Preview Panel

- [x] Playwright test written

### Functionality

- The note editor includes a preview panel beside the editor.
- The preview updates immediately as the TipTap JSON changes.
- Existing notes load with server-rendered sanitized HTML as their initial preview.
- New notes use a rendered preview of the current local draft.

### How To Test

1. Open `/notes/new`.
2. Type formatted content into the editor.
3. Confirm the preview panel updates without a page reload.
4. Create the note and wait until the app lands on `/notes/[id]`.
5. Refresh the page.
6. Confirm the preview still renders the saved content.

## Feature: Share Enable

- [x] Playwright test written

### Functionality

- Existing notes include a `Share` panel.
- Share controls are not shown on `/notes/new`.
- Enabling share creates or re-enables a public token for the note.
- After enabling share, the UI shows an `Enabled` badge and the relative share path `/s/[token]`.
- A success toast is shown after the change.
- The notes list badge changes from `Private` to `Shared`.

### How To Test

1. Open an existing private note.
2. Confirm the `Share` panel is visible and its badge reads `Disabled`.
3. Click `Enable share`.
4. Confirm the badge changes to `Enabled`.
5. Confirm a share path starting with `/s/` is displayed.
6. Confirm a success toast appears.
7. Open `/notes` in another tab or navigate back.
8. Confirm the note now shows a `Shared` badge in the list.

## Feature: Public Shared Note View

- [x] Playwright test written

### Functionality

- `/s/[token]` is publicly accessible without authentication.
- The page shows the note title, updated timestamp, and sanitized rendered HTML.
- The view is read-only and uses the custom 404 flow when the token is invalid or no longer active.

### How To Test

1. Enable sharing for an existing note.
2. Copy the displayed `/s/[token]` path.
3. Open the path in a signed-out browser session.
4. Confirm the note title and rendered content are visible.
5. Confirm there are no edit controls on the page.
6. Replace the token with a fake value.
7. Confirm the custom 404 page is shown.

## Feature: Share Revoke

- [x] Playwright test written

### Functionality

- A shared note owner can disable sharing from `/notes/[id]`.
- Disabling share hides the share path and changes the share badge back to `Disabled`.
- The notes list badge changes back to `Private`.
- The previously valid `/s/[token]` route becomes unavailable and resolves to the 404 page.

### How To Test

1. Open a note with sharing already enabled.
2. Confirm the share path is visible.
3. Open the public `/s/[token]` path in a separate tab and confirm it works.
4. Return to the authenticated note page and click `Disable share`.
5. Confirm the authenticated page now shows `Disabled` and no share path.
6. Return to `/notes` and confirm the badge is now `Private`.
7. Refresh the public `/s/[token]` page.
8. Confirm it now resolves to the custom 404 page.

## Feature: Note Deletion

- [x] Playwright test written

### Functionality

- Existing notes include a `Danger zone` panel with a `Delete note` action.
- Clicking the action opens a confirmation dialog.
- The dialog can be dismissed with `Cancel`, by clicking the backdrop, or with `Escape` while not deleting.
- Confirming deletion removes the note and any related share row, then redirects to `/notes?toast=deleted`.
- The toast system converts the query parameter into a `Note deleted.` toast.

### How To Test

1. Open an existing note.
2. Click `Delete note`.
3. Confirm a modal dialog appears with cancel and confirm actions.
4. Dismiss the dialog with `Cancel`.
5. Open it again and dismiss it with the `Escape` key.
6. Open it again and confirm deletion.
7. Confirm the app returns to `/notes`.
8. Confirm a `Note deleted.` toast appears.
9. Confirm the deleted note no longer appears in the list.
10. If the note had sharing enabled, confirm the old `/s/[token]` link now shows the custom 404 page.

## Feature: Toast Notifications

- [x] Playwright test written

### Functionality

- Toasts are global and rendered from the root layout.
- Success and error toasts appear in the top-right corner.
- Toasts are used for create, delete, autosave success, share updates, and action failures.
- Route-driven toasts consume the `toast` query parameter and then remove it from the URL.

### How To Test

1. Create a note and confirm the `Note created.` toast appears.
2. Edit a note and confirm the `Note saved.` toast appears.
3. Delete a note and confirm the `Note deleted.` toast appears.
4. Enable or disable sharing and confirm a `Sharing updated.` toast appears.
5. Trigger an error state, such as invalid login, and confirm an error toast or inline error appears where expected.

## Feature: Loading States

- [x] Playwright test written

### Functionality

- `/notes` has a loading skeleton route state.
- `/s/[token]` has a loading skeleton route state.
- Both loading states use placeholder panels styled to match the app shell.

### How To Test

1. Throttle the network or CPU in the browser devtools.
2. Navigate to `/notes`.
3. Confirm loading skeleton panels appear before the real content.
4. Open a shared note URL under the same throttled conditions.
5. Confirm the shared note loading skeleton appears before the final content.

## Feature: Custom Not Found

- [x] Playwright test written

### Functionality

- The app uses a custom 404 page for unknown routes, missing owned notes, and invalid or revoked share links.
- The page intentionally does not reveal whether the resource was missing, revoked, or never existed.
- The page includes a `Back to notes` button.

### How To Test

1. Open a clearly invalid route such as `/does-not-exist`.
2. Confirm the custom 404 page appears.
3. While signed in, open `/notes/not-a-real-id`.
4. Confirm the same 404 page appears.
5. Open an invalid or revoked `/s/[token]` path.
6. Confirm the same 404 page appears.

## Feature: Security Headers

- [ ] Playwright test written

### Functionality

- Middleware sets a Content Security Policy and other hardening headers on app responses.
- The middleware also backfills the `origin` header on POST requests when it is missing.
- The app sends `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, and `Permissions-Policy`.

### How To Test

1. Start the app locally.
2. Open any route and inspect the network response headers.
3. Confirm the response includes `Content-Security-Policy`.
4. Confirm the response includes `Referrer-Policy: no-referrer`.
5. Confirm the response includes `X-Content-Type-Options: nosniff`.
6. Confirm the response includes `X-Frame-Options: DENY`.
7. Confirm the response includes `Permissions-Policy`.

## Feature: Demo Seed Data

- [ ] Playwright test written

### Functionality

- The app seeds a demo user and welcome note through migrations.
- Seed data is created only when migrations are run explicitly; starting the app does not auto-apply migrations.
- The demo user email is `demo@tinynotes.local`.
- The seeded note is titled `Welcome to TinyNotes`.

### How To Test

1. Run migrations against a fresh database.
2. Open `/login`.
3. Sign in with `demo@tinynotes.local` and `password123`.
4. Confirm login succeeds.
5. Confirm `/notes` contains the `Welcome to TinyNotes` note.
