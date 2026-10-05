import { expect, test } from "@playwright/test";

test.describe("demo review workflow", () => {
  test("requires an explanation before requesting changes", async ({ page }) => {
    await page.goto("/demo/artifacts/art_release_captain/review");

    await expect(page.getByRole("heading", { name: "Review Campaign Brief Builder", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Line Diff" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Compatibility and Trust Signals" })).toBeVisible();

    await page.getByRole("button", { name: "Request changes" }).click();
    await expect(page.getByText("Add a note before requesting changes or rejecting this submission.")).toBeVisible();

    await page.getByPlaceholder("Why is this safe and useful to share?").fill("Add the source for each customer claim before publishing.");
    await page.getByRole("button", { name: "Request changes" }).click();
    await expect(page.getByText("Changes requested. The published version remains active.")).toBeVisible();
  });
});
