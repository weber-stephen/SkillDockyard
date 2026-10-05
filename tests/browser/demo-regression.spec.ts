import { expect, test } from "@playwright/test";

test.describe("demo regression journeys", () => {
  test("browses a demo skill and its published content", async ({ page }) => {
    await page.goto("/demo/artifacts/art_release_captain");

    await expect(page.getByRole("heading", { name: "Campaign Brief Builder", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Current Skill" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Published Version" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Compare versions/i })).toHaveAttribute("href", "/demo/artifacts/art_release_captain/review");
  });

  test("validates and saves a browser-only demo draft", async ({ page }) => {
    await page.goto("/demo/submit");

    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Paste the full skill instructions before continuing.")).toBeVisible();

    await page.getByLabel("Why should this be shared?").fill("Helps support teams turn recurring tickets into clear follow-up steps.");
    await page.locator("textarea").nth(1).fill("# Support Follow-up\n\n## Role\nTurn ticket notes into a clear follow-up plan.\n\n## Steps\n1. Summarize the issue.\n2. Draft the next action.\n\n## Boundaries\nDo not include private customer data.");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByLabel("Skill name").fill("Support Follow-up");
    await page.getByRole("button", { name: "Save demo draft" }).click();

    await expect(page.getByText("Saved as a demo draft in this browser. It was not sent to reviewers or teammates.")).toBeVisible();
    await expect(page.getByText("Support Follow-up", { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Private drafts" })).toBeVisible();
    await expect(page.getByText("Support Follow-up", { exact: true })).toBeVisible();
  });
});
