import { expect, test } from "../fixtures/test";
import { buildUserIdentity, register } from "../helpers/auth";
import {
  appendEditorText,
  createNote,
  fillEditor,
  getEditor,
  getPreview,
  selectLastWord,
  waitForSavedState
} from "../helpers/notes";

test("new note drafts stay local until ready and creation produces a persisted note with a toast", async ({
  page,
  appUrl
}) => {
  await register(page, appUrl, buildUserIdentity("draft-create"));
  await page.goto(`${appUrl}/notes/new`);

  await expect(page.getByPlaceholder("Untitled note")).toHaveValue("");
  await expect(page.getByRole("heading", { name: "Draft" })).toBeVisible();
  await expect(page.getByText(/^Unchanged$/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Create note" })).toBeDisabled();

  const title = `Created from draft ${Date.now()}`;
  await page.getByPlaceholder("Untitled note").fill(title);
  await fillEditor(page, "Draft body content");
  await expect(page.getByText("Ready")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create note" })).toBeEnabled();

  await page.getByRole("button", { name: "Create note" }).click();
  await expect(page).not.toHaveURL(`${appUrl}/notes/new`);
  await expect(page.getByRole("heading", { name: "Share" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Note created." })).toBeVisible();

  await expect.poll(() => new URL(page.url()).searchParams.get("toast")).toBeNull();
  await page.reload();
  expect(new URL(page.url()).searchParams.get("toast")).toBeNull();

  await page.goto(`${appUrl}/notes`);
  await expect(page.getByText(title)).toBeVisible();
});

test("editing notes autosaves changes and keeps the live preview in sync across reloads", async ({ page, appUrl }) => {
  await register(page, appUrl, buildUserIdentity("autosave-preview"));

  const baseTitle = `Autosave note ${Date.now()}`;
  await createNote(page, appUrl, { title: baseTitle, body: "Original preview body" });

  const updatedTitle = `${baseTitle} updated`;
  await page.getByPlaceholder("Untitled note").fill(updatedTitle);
  await expect(page.getByText("Ready")).toBeVisible();
  await appendEditorText(page, " and more live preview text");
  await expect(getPreview(page)).toContainText("and more live preview text");

  await waitForSavedState(page);
  await expect(page.getByRole("status").filter({ hasText: "Note saved." })).toBeVisible();

  await page.reload();
  await expect(page.getByPlaceholder("Untitled note")).toHaveValue(updatedTitle);
  await expect(getPreview(page)).toContainText("and more live preview text");
});

test("the rich text toolbar applies formatting, links, and undo or redo actions", async ({ page, appUrl }) => {
  await register(page, appUrl, buildUserIdentity("toolbar"));
  await page.goto(`${appUrl}/notes/new`);

  const editor = getEditor(page);
  await fillEditor(page, "Format me");

  await selectLastWord(editor, 2);
  await page.getByRole("button", { name: "Bold" }).click();
  await page.getByRole("button", { name: "Italic" }).click();
  await page.getByRole("button", { name: "Underline" }).click();
  await page.getByRole("button", { name: "Strike" }).click();
  await expect(page.getByRole("button", { name: "Bold" })).toHaveClass(/border-\[var\(--acc-2\)\]/);

  await editor.press("Home");
  await page.getByRole("button", { name: "H1" }).click();
  await expect(page.getByRole("button", { name: "H1" })).toHaveClass(/border-\[var\(--acc-2\)\]/);

  await editor.press("End");
  await editor.press("Enter");
  await editor.type("Bullet item");
  await page.getByRole("button", { name: "Bullets" }).click();
  await expect(page.getByRole("button", { name: "Bullets" })).toHaveClass(/border-\[var\(--acc-2\)\]/);

  await editor.press("Enter");
  await editor.type("Ordered item");
  await page.getByRole("button", { name: "Numbers" }).click();
  await expect(page.getByRole("button", { name: "Numbers" })).toHaveClass(/border-\[var\(--acc-2\)\]/);

  await editor.press("Enter");
  await editor.type("Quoted item");
  await page.getByRole("button", { name: "Quote" }).click();
  await expect(page.getByRole("button", { name: "Quote" })).toHaveClass(/border-\[var\(--acc-2\)\]/);

  await editor.press("Enter");
  await editor.type("const answer = 42;");
  await page.getByRole("button", { name: "Code" }).click();
  await expect(page.getByRole("button", { name: "Code" })).toHaveClass(/border-\[var\(--acc-2\)\]/);

  await fillEditor(page, "Link me");
  await selectLastWord(editor, 2);
  page.once("dialog", (dialog) => dialog.accept("https://example.com"));
  await page.getByRole("button", { name: "Link" }).click();
  await expect(getPreview(page).locator('a[href="https://example.com"]')).toHaveCount(1);

  await selectLastWord(editor, 2);
  page.once("dialog", (dialog) => dialog.accept(""));
  await page.getByRole("button", { name: "Link" }).click();
  await expect(getPreview(page).locator('a[href="https://example.com"]')).toHaveCount(0);

  await editor.press("End");
  await editor.type(" Undo target");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(editor).not.toContainText("Undo target");
  await page.getByRole("button", { name: "Redo" }).click();
  await expect(editor).toContainText("Undo target");
});
