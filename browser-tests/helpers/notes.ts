import { expect, Locator, Page } from "playwright/test";

export async function createNote(page: Page, appUrl: string, input: { title: string; body?: string }) {
  await page.goto(`${appUrl}/notes/new`);
  await page.getByPlaceholder("Untitled note").fill(input.title);

  if (input.body) {
    await fillEditor(page, input.body);
  }

  await expect(page.getByText("Ready")).toBeVisible();
  await page.getByRole("button", { name: "Create note" }).click();
  await page.waitForURL(/\/notes\/[^/?]+(?:\?toast=created)?$/, {
    timeout: 30_000
  });
  await expect(page.getByRole("heading", { name: "Share" })).toBeVisible({
    timeout: 30_000
  });
  await expect(page.getByRole("heading", { name: "Danger zone" })).toBeVisible({
    timeout: 30_000
  });
  await expect(page.getByRole("status").filter({ hasText: "Note created." })).toBeVisible({
    timeout: 30_000
  });
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
  await expect(page.getByText("Saving...", { exact: true })).toBeVisible();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
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
