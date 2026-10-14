import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ hasSupabaseConfig: vi.fn(), getViewerContext: vi.fn(), createServerSupabase: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ hasSupabaseConfig: mocks.hasSupabaseConfig, createServerSupabase: mocks.createServerSupabase }));
vi.mock("@/lib/access", () => ({ getViewerContext: mocks.getViewerContext }));

import { POST } from "@/app/api/proposals/[id]/withdraw/route";

describe("proposal withdrawal API", () => {
  const rpc = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasSupabaseConfig.mockReturnValue(true);
    mocks.getViewerContext.mockResolvedValue({ user: { id: "submitter-1", email: "submitter@example.com" } });
    mocks.createServerSupabase.mockReturnValue({ rpc });
  });

  it("withdraws through the atomic server RPC before returning success", async () => {
    rpc.mockResolvedValue({ data: { proposalId: "proposal-1", status: "withdrawn" }, error: null });

    const response = await POST(new Request("http://localhost/api/proposals/proposal-1/withdraw", { method: "POST" }), { params: Promise.resolve({ id: "proposal-1" }) });

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("withdraw_proposal", expect.objectContaining({ p_proposal_id: "proposal-1", p_actor_user_id: "submitter-1", p_actor_email: "submitter@example.com" }));
    expect(await response.json()).toMatchObject({ proposalId: "proposal-1", status: "withdrawn" });
  });

  it("does not report success when the transactional mutation, including its audit write, fails", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "audit insert failed" } });

    const response = await POST(new Request("http://localhost/api/proposals/proposal-1/withdraw", { method: "POST" }), { params: Promise.resolve({ id: "proposal-1" }) });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "audit insert failed" });
  });
});
