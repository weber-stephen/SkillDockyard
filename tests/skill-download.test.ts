import { describe, expect, it } from "vitest";
import { createSkillDownload, getInstallDirectory, getPortableSkillStatus } from "@/lib/skill-download";

const approvedVersion = {
  id: "version-approved",
  content_hash: "sha256:abc123def456789",
  content_snapshot: "---\nname: release-captain\ndescription: Prepare a safe release.\n---\n\nFollow the release checklist."
};

describe("portable skill downloads", () => {
  it("accepts an approved portable SKILL.md", () => {
    expect(getPortableSkillStatus({ type: "claude_skill", approved_version: approvedVersion } as never)).toEqual({ eligible: true, reason: null });
  });

  it("rejects unpublished and tool-specific skills", () => {
    expect(getPortableSkillStatus({ type: "claude_skill", approved_version: null } as never).eligible).toBe(false);
    expect(getPortableSkillStatus({
      type: "claude_skill",
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
