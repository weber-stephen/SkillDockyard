import path from "node:path";
import { describe, expect, it } from "vitest";
import { scanRepos } from "@/lib/scan/scanner";
import { detectRisks } from "@/lib/scan/risk";

const fixture = path.resolve("tests/fixtures/sample-repo");

describe("scanner", () => {
  it("finds supported AI artifacts and risk flags", async () => {
    const artifacts = await scanRepos({
      repo: fixture,
      config: {
        repos: [],
        riskRules: {
          approvedMcpServers: ["github"],
          highImpactTools: ["shell", "stripe", "github:write"]
        }
      }
    });

    expect(artifacts.length).toBeGreaterThanOrEqual(5);
    expect(artifacts.map((item) => item.artifact.type)).toContain("claude_skill");
    expect(artifacts.map((item) => item.artifact.type)).toContain("copilot_agent");
    expect(artifacts.flatMap((item) => item.risks.map((risk) => risk.kind))).toContain("inline_credentials");
    expect(artifacts.flatMap((item) => item.risks.map((risk) => risk.kind))).toContain("high_impact_tool");
  });

  it("redacts inline credential evidence", () => {
    const risks = detectRisks({
      content: "api_key = sk-1234567890abcdefghijklmnop",
      tools: [],
      mcpServers: [],
      owner: "Security",
      approvedMcpServers: [],
      highImpactTools: []
    });

    expect(risks[0]?.kind).toBe("inline_credentials");
    expect(risks[0]?.evidence).toContain("...");
    expect(risks[0]?.evidence).not.toContain("abcdefghijklmnop");
  });
});
