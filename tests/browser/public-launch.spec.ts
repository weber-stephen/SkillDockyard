import { expect, test, type Page } from "@playwright/test";

const documents = [
  { link: "Privacy", path: "/privacy", heading: "Privacy policy" },
  { link: "Terms", path: "/terms", heading: "Terms of service" },
  { link: "Support", path: "/support", heading: "Support" }
];

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
}

for (const device of [
  { name: "desktop", viewport: { width: 1280, height: 800 }, isMobile: false },
  { name: "phone", viewport: { width: 390, height: 844 }, isMobile: true }
]) {
  test.describe(`public launch links on ${device.name}`, () => {
    test.use({ viewport: device.viewport, isMobile: device.isMobile });

    for (const document of documents) {
      test(`opens ${document.link} from the homepage`, async ({ page }) => {
        await page.goto("/");
        await page.getByRole("contentinfo").getByRole("link", { name: document.link, exact: true }).click();
        await expect(page).toHaveURL(document.path);
        await expect(page.getByRole("heading", { name: document.heading, level: 1 })).toBeVisible();
        await expect(page.getByRole("link", { name: "support@skilldockyard.com" })).toHaveAttribute("href", "mailto:support@skilldockyard.com");
        await expect(page.getByRole("navigation", { name: "Legal and support" }).getByRole("link")).toHaveCount(3);
        if (device.isMobile) await expectNoHorizontalOverflow(page);
      });
    }

    test("opens the signup terms and privacy links in a new tab", async ({ page, context }) => {
      await page.goto("/signup");
      await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
      for (const document of documents.slice(0, 2)) {
        const popupPromise = context.waitForEvent("page");
        await page.getByRole("link", { name: document.heading }).click();
        const popup = await popupPromise;
        await popup.waitForLoadState("domcontentloaded");
        await expect(popup).toHaveURL(document.path);
        await expect(popup.getByRole("heading", { name: document.heading, level: 1 })).toBeVisible();
        await popup.close();
      }
      await expect(page.getByRole("checkbox")).toHaveCount(2);
      if (device.isMobile) await expectNoHorizontalOverflow(page);
    });
  });
}

test.describe("phone launch journey", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  test("reaches the campaign demo and compares its versions", async ({ page }) => {
    await page.goto("/");
    await expectNoHorizontalOverflow(page);
    await page.getByRole("link", { name: "Explore the campaign demo", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Campaign Brief Builder", level: 1 })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.getByRole("link", { name: /Compare versions/i }).click();
    await expect(page.getByRole("heading", { name: "Review Campaign Brief Builder", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Request changes" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("reaches the signup form from the homepage", async ({ page }) => {
    await page.goto("/");
    await page.locator("header").getByRole("link", { name: "Create free account", exact: true }).click();
    await expect(page).toHaveURL("/signup");
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
