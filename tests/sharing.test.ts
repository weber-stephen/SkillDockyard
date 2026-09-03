import { describe, expect, it } from "vitest";
import { getSharingMetrics, getSharingStatus, mapArtifactStatusToSharingLabel } from "@/lib/sharing";
import type { Artifact } from "@/lib/types";

const baseArtifact: Artifact = {
  id: "art",
  workspace_id: "workspace",
  repo_id: "repo",
  name: "Skill",
  slug: "skill",
  type: "claude_skill",
  repo_name: "repo",
  path: "skills/skill/SKILL.md",
  description: null,
  owner: "@team",
  status: "approved",
  current_version_id: "current",
  approved_version_id: "current",
  risk_count: 0,
  updated_at: "2026-08-09T00:00:00.000Z"
};

describe("sharing labels", () => {
  it("maps existing artifact state to shared-library status", () => {
    expect(getSharingStatus(baseArtifact)).toBe("published");
    expect(getSharingStatus({ ...baseArtifact, status: "needs_reapproval", current_version_id: "next", approved_version_id: "published" })).toBe(
      "improvement_available"
    );
    expect(getSharingStatus({ ...baseArtifact, status: "unreviewed", approved_version_id: null })).toBe("new_skill");
    expect(getSharingStatus({ ...baseArtifact, status: "deprecated" })).toBe("archived");
  });

  it("derives dashboard metrics from shared-library status", () => {
    const artifacts = [
      baseArtifact,
      { ...baseArtifact, id: "improved", status: "needs_reapproval", current_version_id: "next", approved_version_id: "published" },
      { ...baseArtifact, id: "new", status: "unreviewed", approved_version_id: null },
      { ...baseArtifact, id: "archived", status: "deprecated" }
    ] satisfies Artifact[];

    expect(getSharingMetrics(artifacts)).toEqual({
      sharedSkills: 3,
      improvementsAvailable: 1,
      inSync: 1,
      newSkills: 1
    });
  });

  it("keeps database enum labels translated for the UI", () => {
    expect(mapArtifactStatusToSharingLabel("approved")).toBe("Published");
    expect(mapArtifactStatusToSharingLabel("needs_reapproval")).toBe("Improvement available");
    expect(mapArtifactStatusToSharingLabel("unreviewed")).toBe("New skill");
    expect(mapArtifactStatusToSharingLabel("deprecated")).toBe("Archived");
  });
});
