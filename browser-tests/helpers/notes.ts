import { expect, Locator, Page } from "playwright/test";

export async function createNote(page: Page, appUrl: string, input: { title: string; body?: string }) {
  await page.goto(`${appUrl}/notes/new`);
  await page.getByPlaceholder("Untitled note").fill(input.title);

  if (input.body) {
    await fillEditor(page, input.body);
  }

  await expect(page.getByText("Ready")).toBeVisible();
  await page.getByRole("button", { name: "Create note" }).click();
  await expect(page).not.toHaveURL(`${appUrl}/notes/new`);
  await expect(page.getByRole("heading", { name: "Share" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Danger zone" })).toBeVisible();
  await expect(page.getByText("Note created.")).toBeVisible();
  return page.url();
}

export async function fillEditor(page: Page, text: string) {
  const editor = getEditor(page);
  await editor.click();
  await editor.fill("");
  await editor.type(text);
}

export async function appendEditorText(page: Page, text: string) {
  const editor = getEditor(page);
  await editor.click();
  await editor.press("End");
  await editor.type(text);
}

export function getEditor(page: Page) {
  return page.locator(".ProseMirror").first();
}

export function getPreview(page: Page) {
  return page.locator("h2", { hasText: "Preview" }).locator("xpath=..").locator("div.prose-note");
}

export async function waitForSavedState(page: Page) {
  await expect(page.getByText("Saving...")).toBeVisible();
  await expect(page.getByText("Saved")).toBeVisible();
}

export async function captureSharePath(page: Page) {
  const shareText = await page.locator("text=/\\/s\\/[A-Za-z0-9_-]+/").textContent();
  if (!shareText) {
    throw new Error("Expected a share path to be visible.");
  }

  return shareText.trim();
}

export async function openDeleteDialog(page: Page) {
  await page.getByRole("button", { name: "Delete note" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

export async function selectLastWord(editor: Locator, wordLength: number) {
  await editor.click();
  for (let index = 0; index < wordLength; index += 1) {
    await editor.press("Shift+ArrowLeft");
  }
}

function escapeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
