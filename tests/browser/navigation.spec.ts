import { expect, test } from "@playwright/test";

test.describe("demo navigation and skill browsing", () => {
  test("separates primary navigation from workspace utilities and marks import as Skills", async ({ page }) => {
    await page.goto("/demo/import");

    const primaryNavigation = page.getByRole("navigation", { name: "Primary navigation" });
    await expect(primaryNavigation.getByRole("link", { name: "Skills", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(primaryNavigation.getByRole("link", { name: "Workspace settings", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Workspace settings", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Export skill list", exact: true })).toBeVisible();
  });

  test("uses the shared brand mark on the public site", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Skill Dockyard", exact: true })).toBeVisible();
    await expect(page.locator(".brand-mark .brand-symbol svg")).toHaveCount(1);
  });

  test("shows standard Codex and Claude Code skill locations on the import page", async ({ page }) => {
    await page.goto("/demo/import");

    await expect(page.getByRole("heading", { name: "Where to find installed skills" })).toBeVisible();
    await expect(page.getByText("~/.codex/skills/", { exact: true })).toBeVisible();
    await expect(page.getByText("%USERPROFILE%\\.codex\\skills\\", { exact: true })).toBeVisible();
    await expect(page.getByText("~/.claude/skills/", { exact: true })).toBeVisible();
    await expect(page.getByText("%USERPROFILE%\\.claude\\skills\\", { exact: true })).toBeVisible();
  });

  test("filters skills and keeps product links in the demo", async ({ page }) => {
    await page.goto("/demo/artifacts");

    await expect(page.getByRole("heading", { name: "Skills", level: 1 })).toBeVisible();
    await page.getByPlaceholder("Search skills...").fill("sales");
    await expect(page.getByRole("link", { name: "Sales Discovery Prep" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Campaign Brief Builder" })).toHaveCount(0);

    await page.getByRole("link", { name: "Sales Discovery Prep" }).click();
    await expect(page).toHaveURL("/demo/artifacts/art_security_agent");
    await expect(page.getByRole("heading", { name: "Sales Discovery Prep", level: 1 })).toBeVisible();
  });

  test("renders stable visual baselines for skills and review", async ({ page }) => {
    await page.goto("/demo/artifacts");
    await expect(page).toHaveScreenshot("demo-skills.png", {
      mask: [page.locator("tbody td:last-child")]
    });

    await page.goto("/demo/artifacts/art_release_captain/review");
    await expect(page).toHaveScreenshot("demo-review.png");
  });

  test("shows the demo empty states and review queue", async ({ page }) => {
    await page.goto("/demo/notifications");
    await expect(page.getByText("Demo actions stay local and do not send workspace notifications.")).toBeVisible();

    await page.goto("/demo/invites");
    await expect(page.getByText("No pending invitations right now.")).toBeVisible();

    await page.goto("/demo/review-queue");
    await expect(page.getByRole("heading", { name: "Submissions to review", level: 1 })).toBeVisible();
    await expect(page.getByText("The demo shows comparison screens, but does not create shared submissions.")).toBeVisible();
  });
});

test.describe("demo navigation on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  test("opens the menu and navigates to Skills", async ({ page }) => {
    await page.goto("/demo");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("link", { name: "Workspace settings", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Export skill list", exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Skills", exact: true }).click();

    await expect(page).toHaveURL("/demo/artifacts");
    await expect(page.getByRole("heading", { name: "Skills", level: 1 })).toBeVisible();
  });
});
