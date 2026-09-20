import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getViewerContext: vi.fn(),
  createServerSupabase: vi.fn()
}));

vi.mock("@/lib/access", () => ({ getViewerContext: mocks.getViewerContext, computeArtifactPermission: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabase: mocks.createServerSupabase }));

import { acceptShareInvite } from "@/lib/shares";

function query(result: unknown) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result)
  };
  return chain;
}

describe("workspace share invite acceptance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the invited workspace even when membership order changes", async () => {
    const updateChain = query({ data: { id: "share-1", status: "active", target_workspace_id: "workspace-b" }, error: null });
    const artifactShares = { update: vi.fn().mockReturnValue(updateChain) };
    const shareLookup = query({
      data: { id: "share-1", status: "pending", target_type: "workspace", target_email: "owner@example.com", target_workspace_id: "workspace-b", source_workspace_id: "source", artifact_id: "artifact" },
      error: null
    });
    const from = vi.fn().mockReturnValueOnce(shareLookup).mockReturnValueOnce(artifactShares).mockReturnValueOnce({ insert: vi.fn().mockResolvedValue({ error: null }) });
    mocks.createServerSupabase.mockReturnValue({ from });
    mocks.getViewerContext.mockResolvedValue({
      user: { id: "owner", email: "owner@example.com" },
      memberships: [
        { workspace_id: "workspace-a", role: "owner" },
        { workspace_id: "workspace-b", role: "owner" }
      ],
      workspaces: []
    });

    const accepted = await acceptShareInvite("share-1");

    expect(accepted.target_workspace_id).toBe("workspace-b");
    expect(artifactShares.update).toHaveBeenCalledWith(expect.objectContaining({ target_workspace_id: "workspace-b" }));
    expect(updateChain.eq).toHaveBeenCalledWith("status", "pending");
  });

  it("fails closed for an ambiguous legacy invite without a target workspace", async () => {
    const shareLookup = query({
      data: { id: "share-1", status: "pending", target_type: "workspace", target_email: "owner@example.com", target_workspace_id: null, source_workspace_id: "source", artifact_id: "artifact" },
      error: null
    });
    mocks.createServerSupabase.mockReturnValue({ from: vi.fn().mockReturnValue(shareLookup) });
    mocks.getViewerContext.mockResolvedValue({
      user: { id: "owner", email: "owner@example.com" },
      memberships: [{ workspace_id: "workspace-a", role: "owner" }, { workspace_id: "workspace-b", role: "owner" }],
      workspaces: []
    });

    await expect(acceptShareInvite("share-1")).rejects.toThrow("owner of the invited workspace");
  });
});
