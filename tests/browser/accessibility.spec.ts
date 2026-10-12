import { expect, test } from "@playwright/test";
import { checkAccessibility } from "./a11y";

async function expectAppLandmarks(page: import("@playwright/test").Page, title: string) {
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
}

test.describe("WCAG 2.2 AA critical workspace journeys", () => {
  test("Skills exposes landmarks, headings, labelled search, and filtered content", async ({ page }, testInfo) => {
    await page.goto("/demo/artifacts");

    await expectAppLandmarks(page, "Skills");
    const search = page.getByRole("textbox", { name: "Search skills" });
    await expect(search).toBeVisible();
    await search.fill("sales");
    await expect(page.getByRole("link", { name: "Sales Discovery Prep" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Campaign Brief Builder" })).toHaveCount(0);
    await checkAccessibility(page, testInfo);
  });

  test("Add skill announces validation feedback and lets a keyboard user continue", async ({ page }, testInfo) => {
    await page.goto("/demo/submit");
    await expectAppLandmarks(page, "Add a new skill to the library.");

    const continueButton = page.getByRole("button", { name: "Continue" });
    await continueButton.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Paste the full skill instructions before continuing.")).toHaveAttribute("role", "alert");
    await expect(page.getByRole("textbox", { name: "Skill instructions" })).toBeFocused();
    await checkAccessibility(page, testInfo);

    await page.getByLabel("Why should this be shared?").fill("Helps support teams turn recurring tickets into clear follow-up steps.");
    await page.getByRole("textbox", { name: "Skill instructions" }).fill("# Support Follow-up\n\n## Role\nTurn ticket notes into a clear follow-up plan.\n\n## Steps\n1. Summarize the issue.\n2. Draft the next action.\n\n## Boundaries\nDo not include private customer data.");
    await continueButton.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Skill name")).toBeVisible();
    await checkAccessibility(page, testInfo);
  });

  test("Submission review provides named decisions and announces required-note feedback", async ({ page }, testInfo) => {
    await page.goto("/demo/artifacts/art_release_captain/review");
    await expectAppLandmarks(page, "Review Campaign Brief Builder");
    await expect(page.getByRole("textbox", { name: "Why is this safe and useful to share?" })).toBeVisible();

    await page.getByRole("button", { name: "Request changes" }).click();
    await expect(page.getByText("Add a note before requesting changes or rejecting this submission.")).toHaveAttribute("role", "alert");
    await checkAccessibility(page, testInfo);
  });

  test("Skill sharing uses named, keyboard-operable choices and announced feedback", async ({ page }, testInfo) => {
    await page.goto("/demo/artifacts/art_release_captain");
    await expectAppLandmarks(page, "Campaign Brief Builder");

    const sharing = page.getByRole("region", { name: "Share skill" });
    await expect(sharing.getByRole("radio", { name: "Individual" })).toBeChecked();
    await sharing.getByRole("radio", { name: "Workspace" }).focus();
    await page.keyboard.press("Space");
    await expect(sharing.getByRole("radio", { name: "Workspace" })).toBeChecked();
    await expect(sharing.getByRole("combobox", { name: "What can they do?" })).toBeVisible();
    await sharing.getByRole("button", { name: "Share skill" }).click();
    await expect(sharing.getByRole("alert")).toBeVisible();
    await checkAccessibility(page, testInfo);
  });

  test("Workspace settings has descriptive navigation and settings-area landmark", async ({ page }, testInfo) => {
    await page.goto("/demo/settings");
    await expectAppLandmarks(page, "Workspace settings");
    const areas = page.getByRole("region", { name: "Workspace settings areas" });
    await expect(areas.getByRole("link", { name: "Import settings" })).toBeVisible();
    await expect(areas.getByRole("link", { name: "Trust rules" })).toBeVisible();
    await checkAccessibility(page, testInfo);
  });

  test("Skip link sends keyboard focus to main content", async ({ page }) => {
    await page.goto("/demo/artifacts");

    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await expect(skipLink).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
  });
});

test.describe("WCAG 2.2 AA responsive navigation", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  test("mobile navigation is a labelled dialog with managed focus", async ({ page }, testInfo) => {
    await page.goto("/demo/artifacts");
    const trigger = page.getByRole("button", { name: "Open navigation" });

    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const dialog = page.getByRole("dialog", { name: "Navigation" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Close navigation" })).toBeFocused();
    await dialog.getByRole("link", { name: "Export skill list" }).focus();
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("link", { name: "Skill Dockyard" })).toBeFocused();
    await checkAccessibility(page, testInfo);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
