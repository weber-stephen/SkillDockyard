import { describe, expect, it } from "vitest";
import { deriveSubmissionOptions } from "@/lib/submission-options";
import type { Artifact, ArtifactDetail } from "@/lib/types";

const artifact = {
  id: "art",
  workspace_id: "workspace",
  repo_id: "repo",
  name: "Release Captain",
  slug: "release-captain",
  type: "claude_skill",
  repo_name: "platform-tools",
  path: "skills/release-captain/SKILL.md",
  description: null,
  owner: "@platform",
  status: "approved",
  current_version_id: "version",
  approved_version_id: "version",
  risk_count: 0,
  updated_at: "2026-08-20T00:00:00.000Z"
} satisfies Artifact;

describe("submission options", () => {
  it("derives dropdown values from artifacts, settings, and versions", () => {
    const detail = {
      ...artifact,
      current_version: {
        id: "version",
        artifact_id: "art",
        commit_sha: null,
        branch_ref: "main",
        content_hash: "sha256:value",
        content_snapshot: "# Release Captain",
        summary: null,
        tools: ["github"],
        mcp_servers: ["localhost:3333"],
        tags: [],
        status: "approved",
        created_at: "2026-08-20T00:00:00.000Z"
      },
      approved_version: null,
      risks: [],
      approvals: []
    } satisfies ArtifactDetail;

    expect(
      deriveSubmissionOptions([artifact], [detail], {
        highImpactTools: ["shell", "github"],
        approvedMcpServers: ["github"]
      })
    ).toEqual({
      owners: ["@platform"],
      libraryAreas: ["General Skills", "platform-tools"],
      tools: ["github", "shell"],
      mcpServers: ["github", "localhost:3333"]
    });
  });
});
