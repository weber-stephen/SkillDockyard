import { describe, expect, it } from "vitest";
import { canProposeRole, computeArtifactPermission } from "@/lib/access";
import type { Artifact, ArtifactShare, Workspace, WorkspaceMembership } from "@/lib/types";

const artifact: Artifact = {
  id: "artifact",
  workspace_id: "source-workspace",
  repo_id: "repo",
  name: "Shared skill",
  slug: "shared-skill",
  type: "claude_skill",
  repo_name: "skills",
  path: "skills/shared-skill/SKILL.md",
  description: null,
  owner: "Platform",
  status: "approved",
  current_version_id: "current",
  approved_version_id: "current",
  risk_count: 0,
  updated_at: "2026-09-03T00:00:00.000Z"
};

const workspaces: Workspace[] = [{ id: "source-workspace", name: "Platform", created_at: "2026-09-03T00:00:00.000Z" }];

function membership(role: WorkspaceMembership["role"]): WorkspaceMembership {
  return {
    id: `${role}-membership`,
    workspace_id: "source-workspace",
    user_id: "user",
    email: "user@example.com",
    role,
    created_at: "2026-09-03T00:00:00.000Z"
  };
}

function share(permission: ArtifactShare["permission"]): ArtifactShare {
  return {
    id: `${permission}-share`,
    artifact_id: artifact.id,
    source_workspace_id: artifact.workspace_id,
    target_type: "user",
    target_user_id: "recipient",
    target_workspace_id: null,
    target_email: "recipient@example.com",
    target_workspace_name: null,
    permission,
    status: "active",
    created_by_user_id: "owner",
    created_at: "2026-09-03T00:00:00.000Z",
    activated_at: "2026-09-03T00:00:00.000Z",
    revoked_at: null,
    declined_at: null
  };
}

describe("artifact permissions", () => {
  it("allows proposals for owners, reviewers, and editors only", () => {
    expect(canProposeRole("owner")).toBe(true);
    expect(canProposeRole("reviewer")).toBe(true);
    expect(canProposeRole("editor")).toBe(true);
    expect(canProposeRole("viewer")).toBe(false);
  });

  it("gives source workspace viewers no proposal or publishing rights", () => {
    expect(computeArtifactPermission({ artifact, memberships: [membership("viewer")], workspaces, shares: [], userId: "user" })).toMatchObject({
      accessScope: "owned_workspace",
      canProposeUpdate: false,
      canPublish: false,
      canManageShares: false
    });
  });

  it("lets shared recipients propose only when the share allows it", () => {
    const proposed = computeArtifactPermission({ artifact, memberships: [], workspaces: [], shares: [share("propose")], userId: "recipient" });
    const viewOnly = computeArtifactPermission({ artifact, memberships: [], workspaces: [], shares: [share("view")], userId: "recipient" });

    expect(proposed).toMatchObject({ canProposeUpdate: true, canPublish: false, canManageShares: false, share: { id: "propose-share" } });
    expect(viewOnly).toMatchObject({ canProposeUpdate: false, canPublish: false, canManageShares: false, share: { id: "view-share" } });
  });

  it("ignores revoked shares", () => {
    expect(computeArtifactPermission({ artifact, memberships: [], workspaces: [], shares: [{ ...share("propose"), status: "revoked" }], userId: "recipient" })).toBeNull();
  });
});
