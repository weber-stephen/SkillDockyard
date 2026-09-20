import { describe, expect, it } from "vitest";
import { INGEST_LIMITS, validateIngestBatch } from "@/lib/ingest-limits";
import { validateManualSubmissionInput } from "@/lib/submissions";
import { readJsonBody } from "@/lib/request-body";

const validArtifact = {
  repo: { name: "repo", root_path: "/tmp/repo", branch_ref: null },
  artifact: { name: "Skill", slug: "skill", type: "claude_skill", path: "SKILL.md", description: null, owner: null },
  version: { commit_sha: null, content_hash: "sha256:hash", content_snapshot: "# Skill instructions", summary: null, tools: [], mcp_servers: [], tags: [] },
  risks: []
};

describe("security input limits", () => {
  it("rejects excessive artifact counts and snapshots before ingestion", () => {
    expect(validateIngestBatch(Array.from({ length: INGEST_LIMITS.maxArtifacts + 1 }, () => validArtifact))).toBe(false);
    expect(validateIngestBatch([{ ...validArtifact, version: { ...validArtifact.version, content_snapshot: "x".repeat(INGEST_LIMITS.maxSnapshotBytes + 1) } }])).toBe(false);
  });

  it("rejects excessive tool lists and malformed submission fields", () => {
    expect(validateIngestBatch([{ ...validArtifact, version: { ...validArtifact.version, tools: Array.from({ length: INGEST_LIMITS.maxListItems + 1 }, () => "shell") } }])).toBe(false);
    expect(validateManualSubmissionInput({ mode: "new", skillText: "x".repeat(INGEST_LIMITS.maxSnapshotBytes + 1) })).toContain("too large");
    expect(validateManualSubmissionInput({ mode: "new", skillText: "valid", tools: Array.from({ length: INGEST_LIMITS.maxListItems + 1 }, () => "shell") })).toContain("tools");
  });

  it("rejects request bodies beyond the byte limit before JSON parsing", async () => {
    const request = new Request("http://localhost/api/scan", {
      method: "POST",
      body: JSON.stringify({ payload: "x".repeat(2 * 1024 * 1024) })
    });
    await expect(readJsonBody(request)).rejects.toMatchObject({ status: 413 });
  });
});
