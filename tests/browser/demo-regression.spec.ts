import { expect, test } from "@playwright/test";

test.describe("demo regression journeys", () => {
  test("browses a demo skill and its published content", async ({ page }) => {
    await page.goto("/demo/artifacts/art_release_captain");

    await expect(page.getByRole("heading", { name: "Campaign Brief Builder", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Current Skill" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Published Version" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Compare versions/i })).toHaveAttribute("href", "/demo/artifacts/art_release_captain/review");
    await expect(page.getByRole("heading", { name: "Compatibility and safety" })).toBeVisible();
    await page.getByRole("link", { name: "1 item to check" }).click();
    await expect(page.getByRole("heading", { name: "Review notes" })).toBeVisible();
    await expect(page.getByText("Check any research sources before publishing customer claims for the team.")).toBeVisible();
    await expect(page.getByText("Tool requiring review")).toBeVisible();
    const versionIdentifier = page.getByText("sha256:previous-campaign-brief");
    await expect(versionIdentifier).toBeHidden();
    await page.getByText("Technical version identifier").click();
    await expect(versionIdentifier).toBeVisible();
  });

  test("explains when there are no review notes", async ({ page }) => {
    await page.goto("/demo/artifacts/art_security_agent");
    await expect(page.getByText("No review notes found.", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /items? to check/ })).toHaveCount(0);
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

test.describe("demo skill instructions on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  test("wraps skill text without horizontal scrolling", async ({ page }) => {
    await page.goto("/demo/artifacts/art_release_captain");
    const instructions = page.getByLabel("Current skill instructions");
    await expect(instructions).toBeVisible();
    const layout = await instructions.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      whiteSpace: getComputedStyle(element).whiteSpace,
      overflowWrap: getComputedStyle(element).overflowWrap
    }));
    expect(layout.whiteSpace).toBe("pre-wrap");
    expect(layout.overflowWrap).toBe("anywhere");
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
    await expect(page.getByRole("link", { name: "1 item to check" })).toBeVisible();
  });
});
