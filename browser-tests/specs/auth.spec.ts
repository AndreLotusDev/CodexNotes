import { expect, test } from "../fixtures/test";
import { buildUserIdentity, DEMO_USER, login, register } from "../helpers/auth";

test("root redirect, login flow, and demo seed data work end to end", async ({ page, appUrl }) => {
  await page.goto(`${appUrl}/`);
  await expect(page).toHaveURL(`${appUrl}/login`);
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByText(DEMO_USER.email)).toBeVisible();
  await expect(page.getByText(DEMO_USER.password)).toBeVisible();

  await login(page, appUrl);
  await expect(page.locator("h2").filter({ hasText: /^Welcome to TinyNotes$/ }).first()).toBeVisible();

  await page.goto(`${appUrl}/`);
  await expect(page).toHaveURL(`${appUrl}/notes`);

  await page.goto(`${appUrl}/login`);
  await expect(page).toHaveURL(`${appUrl}/notes`);
});

test("registration validates browser and server errors before redirecting new users to notes", async ({ page, appUrl }) => {
  const user = buildUserIdentity("register");

  await page.goto(`${appUrl}/register`);
  await expect(page.getByPlaceholder("Full name")).toBeVisible();
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(page.getByPlaceholder(/^Password$/)).toBeVisible();
  await expect(page.getByPlaceholder("Confirm password")).toBeVisible();

  await page.getByRole("button", { name: "Register" }).click();
  const missingNameMessage = await page.getByPlaceholder("Full name").evaluate((element: HTMLInputElement) => {
    element.reportValidity();
    return element.validationMessage;
  });
  expect(missingNameMessage).not.toBe("");

  await page.getByPlaceholder("Full name").fill(user.name);
  await page.getByPlaceholder("Email").fill(user.email);
  await page.getByPlaceholder(/^Password$/).fill("short");
  await page.getByPlaceholder("Confirm password").fill("short");
  await page.getByRole("button", { name: "Register" }).click();
  const shortPasswordMessage = await page.getByPlaceholder(/^Password$/).evaluate((element: HTMLInputElement) => {
    element.reportValidity();
    return element.validationMessage;
  });
  expect(shortPasswordMessage).not.toBe("");

  await page.getByPlaceholder(/^Password$/).fill("password123");
  await page.getByPlaceholder("Confirm password").fill("password456");
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.getByText("Passwords do not match.")).toBeVisible();

  await register(page, appUrl, user);

  await page.goto(`${appUrl}/register`);
  await expect(page).toHaveURL(`${appUrl}/notes`);
});
