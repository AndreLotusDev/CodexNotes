import { expect, test } from "../fixtures/test";
import { buildUserIdentity, login, register } from "../helpers/auth";
import { captureSharePath, createNote, openDeleteDialog, waitForSavedState } from "../helpers/notes";

test("note deletion confirmation works and removes both the note and any active share link", async ({
  page,
  browser,
  appUrl
}) => {
  await register(page, appUrl, buildUserIdentity("delete-note"));

  const title = `Delete me ${Date.now()}`;
  await createNote(page, appUrl, { title, body: "deletion body" });
  await page.getByRole("button", { name: "Enable share" }).click();
  const sharePath = await captureSharePath(page);

  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();
  await publicPage.goto(`${appUrl}${sharePath}`);
  await expect(publicPage.getByRole("heading", { name: title })).toBeVisible();

  await openDeleteDialog(page);
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await openDeleteDialog(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await openDeleteDialog(page);
  await page.getByRole("dialog").getByRole("button", { name: "Delete note" }).click();
  await expect(page).toHaveURL(new RegExp(`${appUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/notes(?:\\?toast=deleted)?$`));
  await expect(page.getByRole("status").filter({ hasText: "Note deleted." })).toBeVisible();
  await expect(page.getByText(title)).toHaveCount(0);

  await publicPage.reload();
  await expect(publicPage.getByText("This page drifted out of reach.")).toBeVisible();
  await publicContext.close();
});

test("toast notifications surface create, save, share, and delete outcomes", async ({ page, appUrl }) => {
  await register(page, appUrl, buildUserIdentity("toasts"));

  const title = `Toast note ${Date.now()}`;
  await createNote(page, appUrl, { title, body: "toast body" });
  await expect(page.getByRole("status").filter({ hasText: "Note created." })).toBeVisible();

  await page.getByPlaceholder("Untitled note").fill(`${title} saved`);
  await waitForSavedState(page);
  await expect(page.getByRole("status").filter({ hasText: "Note saved." })).toBeVisible();

  await page.getByRole("button", { name: "Enable share" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Sharing updated." })).toBeVisible();

  await openDeleteDialog(page);
  await page.getByRole("dialog").getByRole("button", { name: "Delete note" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Note deleted." })).toBeVisible();
});

test("loading states appear during delayed navigation to notes and shared note routes", async ({
  page,
  browser,
  context,
  appUrl
}) => {
  await login(page, appUrl);

  await page.goto(`${appUrl}/notes/new`);
  await context.route(/\/notes(\?_rsc=.*)?$/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1_500));
    await route.continue();
  }, { times: 1 });
  await page.getByRole("link", { name: "All notes" }).click();
  await expect(page.locator(".animate-pulse").first()).toBeVisible();
  await expect(page.locator("h2").filter({ hasText: /^Welcome to TinyNotes$/ }).first()).toBeVisible();

  await page.goto(`${appUrl}/notes/seed-demo-note`);
  await page.getByRole("button", { name: "Enable share" }).click();
  const sharePath = await captureSharePath(page);

  const publicContext = await browser.newContext();
  await publicContext.route(/\/s\/[^?]+(\?_rsc=.*)?$/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1_500));
    await route.continue();
  }, { times: 1 });
  const sharedPage = await publicContext.newPage();
  await sharedPage.goto(`${appUrl}${sharePath}`);
  await expect(sharedPage.locator(".animate-pulse").first()).toBeVisible();
  await expect(sharedPage.getByText("Shared note")).toBeVisible();
  await publicContext.close();
});

test("custom 404 handling is shared across invalid routes, unknown owned notes, and invalid shares", async ({
  page,
  appUrl
}) => {
  await page.goto(`${appUrl}/does-not-exist`);
  await expect(page.getByText("This page drifted out of reach.")).toBeVisible();

  await login(page, appUrl);
  await page.goto(`${appUrl}/notes/not-a-real-id`);
  await expect(page.getByText("This page drifted out of reach.")).toBeVisible();

  await page.goto(`${appUrl}/s/not-a-real-token`);
  await expect(page.getByText("This page drifted out of reach.")).toBeVisible();
});

test("security headers are returned on app responses", async ({ page, appUrl }) => {
  const response = await page.goto(`${appUrl}/login`);
  expect(response).not.toBeNull();

  const headers = response?.headers() ?? {};
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["referrer-policy"]).toBe("no-referrer");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["permissions-policy"]).toContain("camera=()");
});
