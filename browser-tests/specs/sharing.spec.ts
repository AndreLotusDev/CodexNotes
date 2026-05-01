import { expect, test } from "../fixtures/test";
import { buildUserIdentity, register } from "../helpers/auth";
import { captureSharePath, createNote } from "../helpers/notes";

test("share enable exposes a public path and updates the notes list badge", async ({ page, appUrl }) => {
  await register(page, appUrl, buildUserIdentity("share-enable"));

  const title = `Share enabled ${Date.now()}`;
  await createNote(page, appUrl, { title, body: "share me" });

  await expect(page.getByRole("heading", { name: "Share" })).toBeVisible();
  await expect(page.getByText("Disabled", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Enable share" }).click();
  await expect(page.getByText("Enabled", { exact: true })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Sharing updated." })).toBeVisible();
  await expect(page.locator("text=/\\/s\\/[A-Za-z0-9_-]+/")).toBeVisible();

  await page.goto(`${appUrl}/notes`);
  await expect(page.getByText(title)).toBeVisible();
  await expect(page.getByText("Shared")).toBeVisible();
});

test("public shared note pages are readable while invalid tokens resolve to the custom 404 view", async ({
  page,
  browser,
  appUrl
}) => {
  await register(page, appUrl, buildUserIdentity("public-share"));

  const title = `Public share ${Date.now()}`;
  await createNote(page, appUrl, { title, body: "Visible to the public" });
  await page.getByRole("button", { name: "Enable share" }).click();

  const sharePath = await captureSharePath(page);
  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();

  await publicPage.goto(`${appUrl}${sharePath}`);
  await expect(publicPage.getByText("Shared note")).toBeVisible();
  await expect(publicPage.getByRole("heading", { name: title })).toBeVisible();
  await expect(publicPage.getByText("Visible to the public")).toBeVisible();
  await expect(publicPage.getByRole("button", { name: "Delete note" })).toHaveCount(0);
  await expect(publicPage.locator(".ProseMirror")).toHaveCount(0);

  await publicPage.goto(`${appUrl}/s/not-a-real-token`);
  await expect(publicPage.getByText("This page drifted out of reach.")).toBeVisible();
  await expect(publicPage.getByRole("link", { name: "Back to notes" })).toBeVisible();

  await publicContext.close();
});

test("share revoke removes the path, resets the list badge, and invalidates the old public URL", async ({
  page,
  browser,
  appUrl
}) => {
  await register(page, appUrl, buildUserIdentity("share-revoke"));

  const title = `Revoked share ${Date.now()}`;
  await createNote(page, appUrl, { title, body: "temporary share" });
  await page.getByRole("button", { name: "Enable share" }).click();
  const sharePath = await captureSharePath(page);

  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();
  await publicPage.goto(`${appUrl}${sharePath}`);
  await expect(publicPage.getByRole("heading", { name: title })).toBeVisible();

  await page.getByRole("button", { name: "Disable share" }).click();
  await expect(page.getByText("Disabled", { exact: true })).toBeVisible();
  await expect(page.locator("text=/\\/s\\/[A-Za-z0-9_-]+/")).toHaveCount(0);

  await page.goto(`${appUrl}/notes`);
  await expect(page.getByText(title)).toBeVisible();
  await expect(page.getByText("Private", { exact: true })).toBeVisible();

  await publicPage.reload();
  await expect(publicPage.getByText("This page drifted out of reach.")).toBeVisible();
  await publicContext.close();
});
