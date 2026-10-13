import { defineConfig, devices } from "@playwright/test";

const host = "127.0.0.1";
const port = Number(process.env.ACCEPTANCE_BROWSER_TEST_PORT ?? 4320);
const baseURL = `http://${host}:${port}`;

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Acceptance browser tests require the local Supabase environment. Run through npm run test:browser:acceptance.");
}

export default defineConfig({
  testDir: "./tests/acceptance-browser",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? [["github"], ["html", { outputFolder: "playwright-acceptance-report", open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- -H ${host} -p ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 90_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_SITE_URL: baseURL,
      SELF_SERVICE_SIGNUP_ENABLED: "true"
    }
  }
});
