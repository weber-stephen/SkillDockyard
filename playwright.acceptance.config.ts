import { defineConfig, devices } from "@playwright/test";

const host = "127.0.0.1";
const port = Number(process.env.ACCEPTANCE_TEST_PORT ?? 4319);
const baseURL = `http://${host}:${port}`;

export default defineConfig({
  testDir: "./tests/acceptance",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 45_000,
  reporter: process.env.CI ? [["github"], ["html", { outputFolder: "playwright-report/acceptance", open: "never" }]] : "list",
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run start -- -H ${host} -p ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
    env: { ...process.env, NEXT_PUBLIC_SITE_URL: baseURL }
  }
});
