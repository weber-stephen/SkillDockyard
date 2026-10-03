import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getViewerContext: vi.fn(), createServerSupabase: vi.fn() }));
vi.mock("@/lib/access", () => ({ getViewerContext: mocks.getViewerContext, computeArtifactPermission: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabase: mocks.createServerSupabase }));

import { acceptShareInvite } from "@/lib/shares";

describe("workspace share invite acceptance", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("uses the atomic database function with the verified user identity", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { id: "share-1", status: "active", target_workspace_id: "workspace-b" }, error: null });
    mocks.createServerSupabase.mockReturnValue({ rpc });
    mocks.getViewerContext.mockResolvedValue({ user: { id: "owner", email: "owner@example.com", email_confirmed_at: "2026-10-03T00:00:00Z" }, memberships: [], workspaces: [] });
    const accepted = await acceptShareInvite("share-1");
    expect(accepted.target_workspace_id).toBe("workspace-b");
    expect(rpc).toHaveBeenCalledWith("respond_to_artifact_share", { p_share_id: "share-1", p_actor_user_id: "owner", p_actor_email: "owner@example.com", p_accept: true });
  });

  it("fails closed when the database rejects workspace ownership", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: new Error("You must be the workspace owner to accept this share") });
    mocks.createServerSupabase.mockReturnValue({ rpc });
    mocks.getViewerContext.mockResolvedValue({ user: { id: "owner", email: "owner@example.com", email_confirmed_at: "2026-10-03T00:00:00Z" }, memberships: [], workspaces: [] });
    await expect(acceptShareInvite("share-1")).rejects.toThrow("workspace owner");
  });

  it("requires a verified email before calling the mutation", async () => {
    const rpc = vi.fn();
    mocks.createServerSupabase.mockReturnValue({ rpc });
    mocks.getViewerContext.mockResolvedValue({ user: { id: "owner", email: "owner@example.com", email_confirmed_at: null }, memberships: [], workspaces: [] });
    await expect(acceptShareInvite("share-1")).rejects.toThrow("Confirm your email");
    expect(rpc).not.toHaveBeenCalled();
  });
});
