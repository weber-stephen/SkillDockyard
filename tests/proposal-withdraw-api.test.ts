import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ hasSupabaseConfig: vi.fn(), getViewerContext: vi.fn(), createServerSupabase: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ hasSupabaseConfig: mocks.hasSupabaseConfig, createServerSupabase: mocks.createServerSupabase }));
vi.mock("@/lib/access", () => ({ getViewerContext: mocks.getViewerContext }));

import { POST } from "@/app/api/proposals/[id]/withdraw/route";

describe("proposal withdrawal API", () => {
  const from = vi.fn();
  const builder = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasSupabaseConfig.mockReturnValue(true);
    mocks.getViewerContext.mockResolvedValue({ user: { id: "submitter-1" } });
    from.mockReturnValue(builder);
    mocks.createServerSupabase.mockReturnValue({ from });
  });

  it("withdraws only the submitter's awaiting-review proposal without touching the artifact", async () => {
    builder.maybeSingle.mockResolvedValue({ data: { id: "proposal-1" }, error: null });

    const response = await POST(new Request("http://localhost/api/proposals/proposal-1/withdraw", { method: "POST" }), { params: Promise.resolve({ id: "proposal-1" }) });

    expect(response.status).toBe(200);
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ status: "withdrawn", resolution_note: "Withdrawn by submitter." }));
    expect(builder.eq).toHaveBeenCalledWith("submitted_by_user_id", "submitter-1");
    expect(builder.eq).toHaveBeenCalledWith("status", "pending_review");
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("proposals");
    expect(await response.json()).toMatchObject({ proposalId: "proposal-1", status: "withdrawn" });
  });

  it("does not withdraw another user's or already-resolved proposal", async () => {
    builder.maybeSingle.mockResolvedValue({ data: null, error: null });

    const response = await POST(new Request("http://localhost/api/proposals/proposal-1/withdraw", { method: "POST" }), { params: Promise.resolve({ id: "proposal-1" }) });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Only awaiting-review submissions you created can be withdrawn." });
  });
});
