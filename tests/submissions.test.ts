import { describe, expect, it } from "vitest";
import { buildManualSubmission } from "@/lib/submissions";
import type { ArtifactDetail } from "@/lib/types";

const riskRules = {
  approvedMcpServers: ["github"],
  highImpactTools: ["shell", "stripe"]
};

const existingArtifact: ArtifactDetail = {
  id: "art_release",
  workspace_id: "workspace",
  repo_id: "repo",
  name: "Release Captain",
  slug: "release-captain",
  type: "claude_skill",
  repo_name: "platform-tools",
  path: "skills/release-captain/SKILL.md",
  description: "Published release workflow.",
  owner: "Platform",
  status: "approved",
  current_version_id: "version_current",
  approved_version_id: "version_current",
  risk_count: 0,
  updated_at: "2026-08-20T00:00:00.000Z",
  current_version: null,
  approved_version: null,
  risks: [],
  approvals: []
};

describe("manual submissions", () => {
  it("builds an update proposal for an existing shared skill", () => {
    const submission = buildManualSubmission(
      {
        mode: "update",
        artifactId: existingArtifact.id,
        owner: "Platform",
        changeSummary: "Adds billing release checks.",
        skillText: "---\nname: Release Captain\ntools: [github, stripe]\n---\nUse shell checks before publishing billing releases."
      },
      { existingArtifact, riskRules }
    );

    expect(submission.targetArtifactId).toBe(existingArtifact.id);
    expect(submission.compareHref).toBe(`/artifacts/${existingArtifact.id}/review`);
    expect(submission.artifact.artifact.path).toBe(existingArtifact.path);
    expect(submission.artifact.version.summary).toContain("Submitted update worth preserving");
    expect(submission.artifact.risks.map((risk) => risk.kind)).toContain("high_impact_tool");
  });

  it("builds a new skill proposal with a stable manual path", () => {
    const submission = buildManualSubmission(
      {
        mode: "new",
        name: "Support Triage",
        owner: "Support Ops",
        changeSummary: "Creates a repeatable escalation workflow.",
        skillText: "# Support Triage\n\nClassify customer issues, summarize context, and prepare an escalation note."
      },
      { riskRules }
    );

    expect(submission.targetArtifactId).toBeNull();
    expect(submission.artifact.repo.name).toBe("manual-submissions");
    expect(submission.artifact.artifact.path).toBe("submitted/support-triage.md");
    expect(submission.artifact.version.tags).toEqual(["manual-submission", "new"]);
  });

  it("uses plain-language validation errors", () => {
    expect(() =>
      buildManualSubmission(
        {
          mode: "new",
          name: "Short",
          owner: "Team",
          changeSummary: "Useful.",
          skillText: "too short"
        },
        { riskRules }
      )
    ).toThrow("Paste the full skill instructions before submitting.");
  });
});
