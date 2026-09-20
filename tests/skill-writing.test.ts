import { describe, expect, it } from "vitest";
import { getSkillWritingChecks, skillTemplate } from "@/lib/skill-writing";

describe("skill writing guidance", () => {
  it("provides a complete guided template", () => {
    const checks = getSkillWritingChecks(skillTemplate);
    expect(checks.every((check) => check.complete)).toBe(true);
  });

  it("keeps optional guidance advisory", () => {
    const checks = getSkillWritingChecks("---\nname: Example\ndescription: Use this whenever a concise example workflow is needed.\n---\n\n1. Complete the request.");
    expect(checks.filter((check) => check.required).every((check) => check.complete)).toBe(true);
    expect(checks.some((check) => !check.required && !check.complete)).toBe(true);
  });
});
