import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getViewerContext: vi.fn(), createServerSupabase: vi.fn(), computeArtifactPermission: vi.fn() }));
vi.mock("@/lib/access", () => ({ getViewerContext: mocks.getViewerContext, computeArtifactPermission: mocks.computeArtifactPermission }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabase: mocks.createServerSupabase }));

import { createShare } from "@/lib/shares";

function artifactQuery(artifact = { id: "artifact-1", workspace_id: "source-workspace" }) {
  return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: artifact, error: null }) };
}

describe("skill-share server boundary", () => {
  const rpc = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getViewerContext.mockResolvedValue({ user: { id: "owner-1", email: "Owner@Example.com" }, memberships: [], workspaces: [] });
    mocks.computeArtifactPermission.mockReturnValue({ canManageShares: true });
    rpc.mockResolvedValue({ data: { id: "share-1", status: "pending" }, error: null });
  });

  it("creates a pending individual share with a normalized recipient email", async () => {
    const shares = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [], error: null }) };
    mocks.createServerSupabase.mockReturnValue({ from: vi.fn((table) => table === "artifact_catalog" ? artifactQuery() : shares), rpc });

    await expect(createShare({ artifactId: "artifact-1", targetType: "user", targetEmail: " Recipient@Example.com ", permission: "propose" })).resolves.toMatchObject({ id: "share-1" });
    expect(rpc).toHaveBeenCalledWith("create_artifact_share", expect.objectContaining({ p_artifact_id: "artifact-1", p_actor_user_id: "owner-1", p_actor_email: "Owner@Example.com", p_target_type: "user", p_target_email: "recipient@example.com", p_target_workspace_id: null, p_permission: "propose", p_activate: false }));
  });

  it("creates an immediately active share for a known workspace without adding membership", async () => {
    const shares = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [], error: null }) };
    const workspace = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { id: "target-workspace", name: "Growth Team" }, error: null }) };
    const from = vi.fn((table) => table === "artifact_catalog" ? artifactQuery() : table === "artifact_shares" ? shares : workspace);
    mocks.createServerSupabase.mockReturnValue({ from, rpc });

    await createShare({ artifactId: "artifact-1", targetType: "workspace", targetWorkspaceId: "target-workspace", permission: "view" });
    expect(rpc).toHaveBeenCalledWith("create_artifact_share", expect.objectContaining({ p_target_type: "workspace", p_target_workspace_id: "target-workspace", p_target_workspace_name: "Growth Team", p_target_email: null, p_permission: "view", p_activate: true }));
    expect(from).not.toHaveBeenCalledWith("workspace_members");
  });

  it("fails closed before calling the share RPC when the actor cannot manage shares", async () => {
    const shares = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [], error: null }) };
    mocks.computeArtifactPermission.mockReturnValue(null);
    mocks.createServerSupabase.mockReturnValue({ from: vi.fn((table) => table === "artifact_catalog" ? artifactQuery() : shares), rpc });

    await expect(createShare({ artifactId: "artifact-1", targetType: "user", targetEmail: "recipient@example.com", permission: "view" })).rejects.toThrow("owners or reviewers");
    expect(rpc).not.toHaveBeenCalled();
  });
});
