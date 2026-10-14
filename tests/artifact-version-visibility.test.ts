import { describe, expect, it } from "vitest";
import { selectVisibleArtifactData } from "@/lib/data";
import type { Artifact, ArtifactVersion, Proposal, RiskFlag } from "@/lib/types";

const publishedVersion = { id: "published", artifact_id: "artifact", content_hash: "published-hash", content_snapshot: "PUBLISHED CONTENT" } as ArtifactVersion;
const submittedVersion = { id: "submitted", artifact_id: "artifact", content_hash: "submitted-hash", content_snapshot: "UNPUBLISHED CONTENT" } as ArtifactVersion;
const publishedRisk = { id: "risk-published", artifact_id: "artifact", artifact_version_id: "published" } as RiskFlag;
const submittedRisk = { id: "risk-submitted", artifact_id: "artifact", artifact_version_id: "submitted" } as RiskFlag;
const pendingProposal = {
  id: "proposal",
  artifact_id: "artifact",
  candidate_version_id: "submitted",
  workspace_id: "workspace",
  submitted_by_user_id: "submitter",
  status: "pending_review"
} as Proposal;
const artifact = {
  visibility: "workspace",
  current_version_id: "submitted",
  approved_version_id: "published"
} as Pick<Artifact, "visibility" | "current_version_id" | "approved_version_id">;

describe("submitted version visibility", () => {
  it("returns only the published version and its risks to a viewer", () => {
    const result = selectVisibleArtifactData({ artifact, userId: "viewer", canPublish: false, versions: [submittedVersion, publishedVersion], risks: [submittedRisk, publishedRisk], proposals: [pendingProposal] });

    expect(result.currentVersion?.content_snapshot).toBe("PUBLISHED CONTENT");
    expect(result.risks).toEqual([publishedRisk]);
    expect(result.currentProposal).toBeNull();
    expect(result.proposals).toEqual([]);
  });

  it("allows the submitter to see their own awaiting-review version", () => {
    const result = selectVisibleArtifactData({ artifact, userId: "submitter", canPublish: false, versions: [submittedVersion, publishedVersion], risks: [submittedRisk, publishedRisk], proposals: [pendingProposal] });

    expect(result.currentVersion?.content_snapshot).toBe("UNPUBLISHED CONTENT");
    expect(result.risks).toEqual([submittedRisk]);
    expect(result.currentProposal?.id).toBe("proposal");
    expect(result.proposals).toEqual([pendingProposal]);
  });

  it("allows workspace reviewers to access submitted content and review history", () => {
    const resolvedProposal = { ...pendingProposal, candidate_version: submittedVersion };
    const result = selectVisibleArtifactData({ artifact, userId: "reviewer", canPublish: true, versions: [submittedVersion, publishedVersion], risks: [submittedRisk, publishedRisk], proposals: [resolvedProposal] });

    expect(result.currentVersion?.content_snapshot).toBe("UNPUBLISHED CONTENT");
    expect(result.proposals).toEqual([resolvedProposal]);
  });

  it("does not expose instructions for an unpublished skill to a non-reviewer", () => {
    const result = selectVisibleArtifactData({
      artifact: { ...artifact, approved_version_id: null },
      userId: "viewer",
      canPublish: false,
      versions: [submittedVersion],
      risks: [submittedRisk],
      proposals: [pendingProposal]
    });

    expect(result.currentVersion).toBeNull();
    expect(result.risks).toEqual([]);
    expect(result.currentProposal).toBeNull();
  });
});
