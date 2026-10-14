import { describe, expect, it } from "vitest";
import { detectRisks } from "@/lib/scan/risk";

describe("maintainer review note", () => {
  it("is a non-blocking recommendation rather than a publishing requirement", () => {
    const risks = detectRisks({ content: "# A skill", tools: [], mcpServers: [], owner: null, approvedMcpServers: [], highImpactTools: [] });
    expect(risks).toContainEqual(expect.objectContaining({
      kind: "missing_owner",
      severity: "low",
      message: "Consider adding a maintainer so teammates know who can answer questions about this skill."
    }));
  });
});
