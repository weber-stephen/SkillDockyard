import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabase: vi.fn(),
  getViewerContext: vi.fn(),
  getArtifactDetail: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({ createServerSupabase: mocks.createServerSupabase }));
vi.mock("@/lib/access", () => ({ getViewerContext: mocks.getViewerContext }));
vi.mock("@/lib/data", () => ({ getArtifactDetail: mocks.getArtifactDetail }));

import { getProposal } from "@/lib/proposals";

describe("proposal detail authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getViewerContext.mockResolvedValue({ user: { id: "viewer-1" } });
    mocks.getArtifactDetail.mockResolvedValue({ id: "artifact-1", can_publish: false });
  });

  it("does not load candidate content for a non-reviewer who did not submit it", async () => {
    const proposalQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "proposal-1", artifact_id: "artifact-1", submitted_by_user_id: "submitter-1", candidate_version_id: "candidate-1", base_version_id: null },
        error: null
      })
    };
    const from = vi.fn().mockReturnValue(proposalQuery);
    mocks.createServerSupabase.mockReturnValue({ from });

    await expect(getProposal("proposal-1")).resolves.toBeNull();
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("proposals");
  });
});
