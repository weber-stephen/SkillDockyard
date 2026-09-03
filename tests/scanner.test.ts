import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getInstalledSkillSources, scanRepos } from "@/lib/scan/scanner";
import { detectRisks } from "@/lib/scan/risk";

const fixture = path.resolve("tests/fixtures/sample-repo");
const exampleRepo = path.resolve("examples/skill-dockyard-example-repo");

describe("scanner", () => {
  it("uses the standard Codex and Claude Code skill folders for an installed-skills scan", () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "skill-dockyard-home-"));
    fs.mkdirSync(path.join(home, ".codex", "skills"), { recursive: true });
    fs.mkdirSync(path.join(home, ".claude", "skills"), { recursive: true });
    try {
      expect(getInstalledSkillSources(home)).toEqual([
        { name: "Codex skills", path: path.join(home, ".codex", "skills"), include: ["**/SKILL.md"] },
        { name: "Claude Code skills", path: path.join(home, ".claude", "skills"), include: ["**/SKILL.md"] }
      ]);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  });
  it("finds supported skill files and trust-note flags", async () => {
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

  it("keeps the public example repo useful for marketing and sales onboarding", async () => {
    const artifacts = await scanRepos({
      repo: exampleRepo,
      config: {
        repos: [],
        riskRules: {
          approvedMcpServers: ["github", "filesystem-readonly"],
          highImpactTools: ["shell", "stripe", "github:write"]
        }
      }
    });

    expect(artifacts).toHaveLength(3);
    expect(artifacts.map((item) => item.artifact.type)).toEqual(["claude_skill", "claude_skill", "claude_skill"]);
    expect(artifacts.map((item) => item.artifact.name).sort()).toEqual(["Campaign Brief Builder", "Customer Voice Digest", "Sales Discovery Prep"]);
    // The checked-in seed is not a standalone Git checkout, so it has no Git author to infer as an owner.
    // The public cloned example receives the latest Git author as its starting owner.
    expect(artifacts.flatMap((item) => item.risks.map((risk) => risk.kind))).toEqual(["missing_owner", "missing_owner", "missing_owner"]);
  });
});
