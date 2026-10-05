import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hasSupabaseConfig: vi.fn(),
  requireUser: vi.fn(),
  requireWorkspaceId: vi.fn(),
  createServerSupabase: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({ hasSupabaseConfig: mocks.hasSupabaseConfig, createServerSupabase: mocks.createServerSupabase }));
vi.mock("@/lib/supabase/auth", () => ({ requireUser: mocks.requireUser, requireWorkspaceId: mocks.requireWorkspaceId }));

import { acceptWorkspaceInvite, createWorkspaceInvite, renameWorkspace } from "@/lib/workspace-admin";

describe("workspace administration server boundaries", () => {
  const rpc = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasSupabaseConfig.mockReturnValue(true);
    mocks.requireUser.mockResolvedValue({ id: "owner-1", email: "Owner@Example.com" });
    mocks.requireWorkspaceId.mockResolvedValue("workspace-1");
    mocks.createServerSupabase.mockReturnValue({ rpc });
  });

  it("normalizes invite data and delegates owner authorization to the atomic invite RPC", async () => {
    rpc.mockResolvedValue({ data: { id: "invite-1", workspaceId: "workspace-1", email: "reviewer@example.com", role: "reviewer", expiresAt: "2026-10-12T00:00:00.000Z" }, error: null });

    const invite = await createWorkspaceInvite({ email: " Reviewer@Example.com ", role: "reviewer" });

    expect(invite).toMatchObject({ id: "invite-1", email: "reviewer@example.com", role: "reviewer" });
    expect(invite.token).toEqual(expect.any(String));
    expect(rpc).toHaveBeenCalledWith("invite_workspace_member", expect.objectContaining({
      p_workspace_id: "workspace-1",
      p_actor_user_id: "owner-1",
      p_actor_email: "Owner@Example.com",
      p_email: "reviewer@example.com",
      p_role: "reviewer"
    }));
  });

  it("rejects malformed invitations before a database mutation", async () => {
    await expect(createWorkspaceInvite({ email: "not-an-email", role: "viewer" })).rejects.toThrow("valid email");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("uses the accepting account identity for the single-use invitation RPC", async () => {
    rpc.mockResolvedValue({ data: { inviteId: "invite-1", workspaceId: "workspace-1", role: "editor" }, error: null });

    await expect(acceptWorkspaceInvite(" invitation-token ")).resolves.toMatchObject({ role: "editor" });
    expect(rpc).toHaveBeenCalledWith("accept_workspace_invite", {
      p_token_hash: expect.any(String),
      p_actor_user_id: "owner-1",
      p_actor_email: "Owner@Example.com"
    });
  });

  it("sends workspace renames through the owner-authorized RPC", async () => {
    rpc.mockResolvedValue({ data: { id: "workspace-1", name: "Product" }, error: null });

    await expect(renameWorkspace("Product")).resolves.toEqual({ id: "workspace-1", name: "Product" });
    expect(rpc).toHaveBeenCalledWith("rename_workspace", {
      p_workspace_id: "workspace-1",
      p_actor_user_id: "owner-1",
      p_actor_email: "Owner@Example.com",
      p_name: "Product"
    });
  });
});
