import type { ArtifactType } from "@/lib/types";

const artifactTypeLabels: Record<ArtifactType, string> = {
  agent_doc: "Agent guide",
  claude_skill: "Shared skill",
  copilot_agent: "Copilot agent",
  cursor_rule: "Cursor rule",
  mcp_config: "MCP configuration",
  prompt_library: "Prompt library",
  skill_folder: "Shared skill folder"
};

/**
 * Returns the product-facing name for an artifact type.
 *
 * `claude_skill` is a legacy storage value for portable SKILL.md files. The
 * product presents these as shared skills because they work with both Codex
 * and Claude Code.
 */
export function getArtifactTypeLabel(type: ArtifactType) {
  return artifactTypeLabels[type];
}
