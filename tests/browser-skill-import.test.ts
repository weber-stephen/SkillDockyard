import { describe, expect, it } from "vitest";
import { buildBrowserImportArtifacts, validateBrowserSkillImport } from "@/lib/browser-skill-import";
import { getImportedSkillMetadata, normalizeImportPath } from "@/lib/skill-import";

const skill = "---\nname: Release notes\ndescription: Prepare release notes.\ntools: [github]\n---\n\n# Release notes\n\nPrepare a release summary.";

describe("browser skill import", () => {
  it("keeps import paths relative and rejects traversal", () => {
    expect(normalizeImportPath("release-notes/SKILL.md")).toBe("release-notes/SKILL.md");
    expect(normalizeImportPath("../secret/SKILL.md")).toBeNull();
    expect(normalizeImportPath("/Users/me/.codex/skills/SKILL.md")).toBeNull();
  });

  it("extracts browser-preview metadata without a local filesystem", () => {
    expect(getImportedSkillMetadata(skill, "release-notes/SKILL.md")).toMatchObject({
      name: "Release notes",
      description: "Prepare release notes.",
      tools: ["github"],
      type: "claude_skill"
    });
  });

  it("builds a server-authoritative import record", () => {
    const [artifact] = buildBrowserImportArtifacts([{ path: "release-notes/SKILL.md", content: skill }], { approvedMcpServers: [], highImpactTools: ["github"] }, "Team release workflow");
    expect(artifact.repo.root_path).toBe("browser://skill-import");
    expect(artifact.artifact.path).toBe("imports/release-notes/SKILL.md");
    expect(artifact.version.content_hash).toMatch(/^sha256:/);
    expect(artifact.version.summary).toContain("Team release workflow");
    expect(artifact.risks.map((risk) => risk.kind)).toContain("high_impact_tool");
  });

  it("requires a shared explanation for workspace submissions", () => {
    expect(validateBrowserSkillImport({ visibility: "workspace", skills: [{ path: "release-notes/SKILL.md", content: skill }] })).toContain("Explain");
    expect(validateBrowserSkillImport({ visibility: "private", skills: [{ path: "release-notes/SKILL.md", content: skill }] })).toBeNull();
  });
});
