import { describe, expect, it } from "vitest";
import { getInstallDirectory, getPortableSkillContent, getPortableSkillStatus } from "@/lib/skill-download";
import { createSkillDownload } from "@/lib/skill-download-server";

const approvedVersion = {
  id: "version-approved",
  content_hash: "sha256:abc123def456789",
  content_snapshot: "---\nname: release-captain\ndescription: Prepare a safe release.\n---\n\nFollow the release checklist."
};

describe("portable skill downloads", () => {
  it("accepts an approved portable SKILL.md", () => {
    expect(getPortableSkillStatus({ type: "claude_skill", name: "Release Captain", description: "Prepare a safe release.", approved_version: approvedVersion })).toEqual({ eligible: true, reason: null });
  });

  it("allows shared published skills whose catalog metadata predates frontmatter requirements", () => {
    const sharedArtifact = {
      type: "claude_skill" as const,
      name: "Shared Release Captain",
      description: "Prepare a safe release for the team.",
      approved_version: { ...approvedVersion, content_snapshot: "# Release Captain\n\nFollow the release checklist." }
    };

    expect(getPortableSkillStatus(sharedArtifact)).toEqual({ eligible: true, reason: null });
    expect(getPortableSkillContent(sharedArtifact)).toContain("name: Shared Release Captain");
    expect(getPortableSkillContent(sharedArtifact)).toContain("description: Prepare a safe release for the team.");
  });

  it("rejects unpublished and tool-specific skills", () => {
    expect(getPortableSkillStatus({ type: "claude_skill", approved_version: null } as never).eligible).toBe(false);
    expect(getPortableSkillStatus({
      type: "claude_skill",
      name: "Release Captain",
      description: "Prepare a safe release.",
      approved_version: { ...approvedVersion, content_snapshot: "---\nname: release-captain\ndescription: Prepare a safe release.\nallowed-tools: Bash\n---\n\nFollow the release checklist." }
    } as never).reason).toContain("tool-specific");
  });

  it("creates a ZIP with the exact approved content and target-specific guide", () => {
    const download = createSkillDownload({ slug: "release-captain", name: "Release Captain", version: approvedVersion, target: "claude-code", os: "windows" });
    const zipText = download.content.toString("utf8");

    expect(download.filename).toBe("release-captain-abc123def456.zip");
    expect(zipText).toContain("release-captain/SKILL.md");
    expect(zipText).toContain(approvedVersion.content_snapshot);
    expect(zipText).toContain("%USERPROFILE%\\.claude\\skills\\");
    expect(zipText).toContain("Updating safely");
  });

  it("uses the documented personal skill locations", () => {
    expect(getInstallDirectory("codex", "mac")).toBe("~/.codex/skills/");
    expect(getInstallDirectory("codex", "windows")).toBe("%USERPROFILE%\\.codex\\skills\\");
    expect(getInstallDirectory("claude-code", "mac")).toBe("~/.claude/skills/");
    expect(getInstallDirectory("claude-code", "windows")).toBe("%USERPROFILE%\\.claude\\skills\\");
  });
});
