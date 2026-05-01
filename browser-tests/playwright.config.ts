import path from "node:path";
import { defineConfig, devices } from "playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001";
const artifactsDir = path.join(__dirname, "artifacts");

export default defineConfig({
  testDir: "./specs",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: path.join(artifactsDir, "report") }]
  ],
  outputDir: path.join(artifactsDir, "test-results"),
  timeout: 90_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL,
    trace: "retain-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ],
  webServer: {
    command: "node ./scripts/dev-server-launcher.js",
    url: baseURL,
    timeout: 180_000,
    reuseExistingServer: false
  }
});
