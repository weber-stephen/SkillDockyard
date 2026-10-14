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

function workspaceShare(permission: ArtifactShare["permission"]): ArtifactShare {
  return {
    ...share(permission),
    id: `${permission}-workspace-share`,
    target_type: "workspace",
    target_user_id: null,
    target_workspace_id: "recipient-workspace",
    target_email: null,
    target_workspace_name: "Recipient workspace"
  };
}

describe("artifact permissions", () => {
  it("allows proposals for owners, reviewers, and editors only", () => {
    expect(canProposeRole("owner")).toBe(true);
    expect(canProposeRole("reviewer")).toBe(true);
    expect(canProposeRole("editor")).toBe(true);
    expect(canProposeRole("viewer")).toBe(false);
  });

  it("limits publication and share management to owners and reviewers", () => {
    for (const role of ["owner", "reviewer"] as const) {
      expect(computeArtifactPermission({ artifact, memberships: [membership(role)], workspaces, shares: [], userId: "user" })).toMatchObject({
        canPublish: true,
        canManageShares: true
      });
    }
    expect(computeArtifactPermission({ artifact, memberships: [membership("editor")], workspaces, shares: [], userId: "user" })).toMatchObject({
      canPublish: false,
      canManageShares: false,
      canProposeUpdate: true
    });
  });

  it("gives source workspace viewers no proposal or publishing rights", () => {
    expect(computeArtifactPermission({ artifact, memberships: [membership("viewer")], workspaces, shares: [], userId: "user" })).toMatchObject({
      accessScope: "owned_workspace",
      canProposeUpdate: false,
      canPublish: false,
      canManageShares: false
    });
  });

  it("uses the signed-in member's role when a workspace has mixed roles", () => {
    const reviewer = membership("reviewer");
    const viewer = { ...membership("viewer"), id: "viewer-membership", user_id: "viewer", email: "viewer@example.com" };
    expect(computeArtifactPermission({ artifact, memberships: [reviewer, viewer], workspaces, shares: [], userId: "viewer" })).toMatchObject({
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

  it("grants a workspace share only to members of its active target workspace", () => {
    const targetMembership = {
      ...membership("editor"),
      workspace_id: "recipient-workspace",
      user_id: "workspace-recipient",
      email: "workspace-recipient@example.com"
    };
    const permission = computeArtifactPermission({
      artifact,
      memberships: [targetMembership],
      workspaces: [{ id: "recipient-workspace", name: "Recipient workspace", created_at: "2026-09-03T00:00:00.000Z" }],
      shares: [workspaceShare("propose")],
      userId: "workspace-recipient"
    });

    expect(permission).toMatchObject({ accessScope: "shared_workspace", canProposeUpdate: true, canPublish: false, canManageShares: false });
    expect(computeArtifactPermission({ artifact, memberships: [], workspaces: [], shares: [workspaceShare("propose")], userId: "outsider" })).toBeNull();
  });

  it("does not grant access from pending, declined, or unrelated active shares", () => {
    for (const status of ["pending", "declined", "revoked"] as const) {
      expect(computeArtifactPermission({ artifact, memberships: [], workspaces: [], shares: [{ ...share("propose"), status }], userId: "recipient" })).toBeNull();
    }
    expect(computeArtifactPermission({ artifact, memberships: [], workspaces: [], shares: [share("propose")], userId: "not-the-recipient" })).toBeNull();
  });

  it("keeps private artifacts visible only to their creator", () => {
    const privateArtifact = { ...artifact, visibility: "private" as const, created_by_user_id: "creator" };
    expect(computeArtifactPermission({ artifact: privateArtifact, memberships: [membership("owner")], workspaces, shares: [], userId: "creator" })).toMatchObject({
      canEditPrivate: true,
      canPublish: false,
      canManageShares: false,
      canProposeUpdate: false
    });
    expect(computeArtifactPermission({ artifact: privateArtifact, memberships: [membership("owner")], workspaces, shares: [], userId: "user" })).toBeNull();
  });

  it("does not grant access from a membership in another workspace", () => {
    const otherWorkspaceMembership = { ...membership("owner"), workspace_id: "other-workspace" };
    expect(computeArtifactPermission({ artifact, memberships: [otherWorkspaceMembership], workspaces, shares: [], userId: "user" })).toBeNull();
  });

  it("keeps view-only shares from gaining update or publishing rights", () => {
    const permission = computeArtifactPermission({ artifact, memberships: [], workspaces: [], shares: [share("view")], userId: "recipient" });
    expect(permission).toMatchObject({ canProposeUpdate: false, canPublish: false, canManageShares: false });
  });
});
