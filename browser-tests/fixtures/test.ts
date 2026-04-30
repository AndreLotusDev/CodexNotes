import path from "node:path";
import { mkdirSync } from "node:fs";
import { test as base, expect } from "playwright/test";

export const test = base.extend<{
  appUrl: string;
}>({
  appUrl: async ({ baseURL }, use) => {
    await use(baseURL ?? "http://127.0.0.1:3001");
  }
});

test.afterEach(async ({ page }, testInfo) => {
  const screenshotsDir = path.join(process.cwd(), "browser-tests", "artifacts", "screenshots");
  mkdirSync(screenshotsDir, { recursive: true });

  const screenshotPath = path.join(
    screenshotsDir,
    `${sanitizeFileName(testInfo.titlePath.slice(1).join("__"))}--${testInfo.status}.png`
  );

  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
    animations: "disabled"
  });

  await testInfo.attach("evidence", {
    path: screenshotPath,
    contentType: "image/png"
  });
});

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

export { expect };
