import { expect, test } from "../fixtures/test";
import { buildUserIdentity, login, logout, register } from "../helpers/auth";
import { appendEditorText, createNote, waitForSavedState } from "../helpers/notes";

test("authenticated notes shell guards private routes and exposes the shared header actions", async ({ page, appUrl }) => {
  await page.goto(`${appUrl}/notes`);
  await expect(page).toHaveURL(`${appUrl}/login`);

  await page.goto(`${appUrl}/notes/new`);
  await expect(page).toHaveURL(`${appUrl}/login`);

  await page.goto(`${appUrl}/notes/seed-demo-note`);
  await expect(page).toHaveURL(`${appUrl}/login`);

  await login(page, appUrl);
  await expect(page.getByText("Demo User")).toBeVisible();
  await expect(page.getByRole("link", { name: "New note" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await expect(page.getByRole("link", { name: "All notes" })).toHaveCount(0);

  await page.goto(`${appUrl}/notes/new`);
  await expect(page.getByRole("link", { name: "All notes" })).toBeVisible();

  await logout(page, appUrl);
});

test("notes list shows only the signed in user data, supports empty state, and resorts after edits", async ({
  page,
  appUrl
}) => {
  const user = buildUserIdentity("notes-list");
  await register(page, appUrl, user);

  await expect(page.getByText("No notes yet")).toBeVisible();

  const firstTitle = `Alpha note ${Date.now()}`;
  const secondTitle = `Beta note ${Date.now()}`;

  await createNote(page, appUrl, { title: firstTitle, body: "first body" });
  await page.goto(`${appUrl}/notes`);
  await expect(page.getByText(firstTitle)).toBeVisible();
  await expect(page.getByText("Private")).toBeVisible();
  await expect(page.getByText("Updated")).toBeVisible();

  await createNote(page, appUrl, { title: secondTitle, body: "second body" });
  await page.goto(`${appUrl}/notes`);

  const noteTitles = page.locator('a[href^="/notes/"] h2');
  await expect(noteTitles.first()).toHaveText(secondTitle);

  await page.getByText(firstTitle).click();
  await appendEditorText(page, " refreshed");
  await waitForSavedState(page);

  await page.goto(`${appUrl}/notes`);
  await expect(page.locator('a[href^="/notes/"] h2').first()).toHaveText(firstTitle);
  await expect(page.getByText("Welcome to TinyNotes")).toHaveCount(0);
});
