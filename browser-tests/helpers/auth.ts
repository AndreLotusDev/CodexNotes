import { expect, Page } from "playwright/test";

export const DEMO_USER = {
  email: "demo@tinynotes.local",
  password: "password123",
  name: "Demo User"
};

export function buildUserIdentity(label: string) {
  const token = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return {
    name: `Playwright ${label} ${token}`,
    email: `playwright-${slug}-${token}@tinynotes.local`,
    password: "password123"
  };
}

export async function login(page: Page, appUrl: string, credentials = DEMO_USER) {
  const response = await page.request.post(`${appUrl}/api/auth/sign-in/email`, {
    form: {
      email: credentials.email,
      password: credentials.password
    },
    headers: {
      origin: appUrl
    }
  });

  expect(response.ok()).toBeTruthy();
  await page.goto(`${appUrl}/notes`);
  await expect(page).toHaveURL(`${appUrl}/notes`);
}

export async function register(page: Page, appUrl: string, user = buildUserIdentity("user")) {
  const response = await page.request.post(`${appUrl}/api/auth/sign-up/email`, {
    form: {
      name: user.name,
      email: user.email,
      password: user.password
    },
    headers: {
      origin: appUrl
    }
  });

  expect(response.ok()).toBeTruthy();
  await page.goto(`${appUrl}/notes`);
  await expect(page).toHaveURL(`${appUrl}/notes`);
  return user;
}

export async function logout(page: Page, appUrl: string) {
  await page.context().clearCookies();
  await page.goto(`${appUrl}/login`);
  await expect(page).toHaveURL(`${appUrl}/login`, {
    timeout: 30_000
  });
}
