import matter from "gray-matter";
import type { ArtifactDetail } from "@/lib/types";

export type DownloadTarget = "codex" | "claude-code";
export type DownloadOs = "mac" | "windows";

export interface PortableSkillResult {
  eligible: boolean;
  reason: string | null;
}

const portableFrontmatterKeys = new Set(["name", "description"]);

type PortableSkillArtifact = Pick<ArtifactDetail, "type" | "name" | "description" | "visibility"> & {
  approved_version: (Pick<NonNullable<ArtifactDetail["approved_version"]>, "content_snapshot" | "content_hash"> & Partial<Pick<NonNullable<ArtifactDetail["approved_version"]>, "id" | "summary">>) | null;
  current_version?: (Pick<NonNullable<ArtifactDetail["current_version"]>, "content_snapshot" | "content_hash"> & Partial<Pick<NonNullable<ArtifactDetail["current_version"]>, "id" | "summary">>) | null;
};

function getDownloadVersion(artifact: PortableSkillArtifact) {
  return artifact.visibility === "private" ? artifact.current_version : artifact.approved_version;
}

export function getPortableSkillStatus(artifact: PortableSkillArtifact): PortableSkillResult {
  if (artifact.type !== "claude_skill" && artifact.type !== "skill_folder") {
    return { eligible: false, reason: "Only published skills in your library can be installed in Codex or Claude Code." };
  }
  const version = getDownloadVersion(artifact);
  if (!version) {
    return { eligible: false, reason: artifact.visibility === "private" ? "This private draft has no saved version yet." : "This skill has not been published yet." };
  }

  const parsed = matter(version.content_snapshot);
  const keys = Object.keys(parsed.data);
  const name = typeof parsed.data.name === "string" && parsed.data.name.trim() ? parsed.data.name : artifact.name;
  const description = typeof parsed.data.description === "string" && parsed.data.description.trim()
    ? parsed.data.description
    : artifact.description ?? version.summary;
  if (!name?.trim() || !description?.trim()) {
    return { eligible: false, reason: "Add a name and description to the skill before publishing it for download." };
  }
  if (keys.some((key) => !portableFrontmatterKeys.has(key))) {
    return { eligible: false, reason: "This skill uses tool-specific settings, so it cannot be installed as one shared Codex and Claude skill." };
  }

  return { eligible: true, reason: null };
}

/**
 * Older shared versions may predate required SKILL.md frontmatter. Keep their
 * published content intact where possible, but hydrate missing portable
 * metadata from the approved catalog record for the downloaded copy.
 */
export function getPortableSkillContent(artifact: PortableSkillArtifact) {
  const version = getDownloadVersion(artifact);
  if (!version) return null;

  const parsed = matter(version.content_snapshot);
  const name = typeof parsed.data.name === "string" && parsed.data.name.trim() ? parsed.data.name : artifact.name;
  const description = typeof parsed.data.description === "string" && parsed.data.description.trim()
    ? parsed.data.description
    : artifact.description ?? version.summary;

  if (!name?.trim() || !description?.trim()) return version.content_snapshot;
  if (typeof parsed.data.name === "string" && parsed.data.name.trim() && typeof parsed.data.description === "string" && parsed.data.description.trim()) {
    return version.content_snapshot;
  }

  return matter.stringify(parsed.content, { ...parsed.data, name, description });
}

export function getInstallDirectory(target: DownloadTarget, os: DownloadOs) {
  if (target === "codex") return os === "mac" ? "~/.codex/skills/" : "%USERPROFILE%\\.codex\\skills\\";
  return os === "mac" ? "~/.claude/skills/" : "%USERPROFILE%\\.claude\\skills\\";
}
