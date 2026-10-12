import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type TestInfo } from "@playwright/test";

export async function checkAccessibility(page: Page, testInfo: TestInfo) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();

  await testInfo.attach("a11y-results", {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json"
  });

  const violations = results.violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.slice(0, 5).map((node) => node.html)
  }));

  expect(violations, `Accessibility violations:\n${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
}
