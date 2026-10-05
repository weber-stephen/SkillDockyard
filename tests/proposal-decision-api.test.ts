import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hasSupabaseConfig: vi.fn(),
  getProposal: vi.fn(),
  getViewerContext: vi.fn(),
  createServerSupabase: vi.fn(),
  notifyDownloadedUsersOfUpdate: vi.fn()
}));

vi.mock("@/lib/proposals", () => ({
  getProposal: mocks.getProposal,
  validateProposalDecision: (decision: string) => ["published", "changes_requested", "rejected"].includes(decision)
}));
vi.mock("@/lib/access", () => ({ getViewerContext: mocks.getViewerContext }));
vi.mock("@/lib/supabase/server", () => ({ hasSupabaseConfig: mocks.hasSupabaseConfig, createServerSupabase: mocks.createServerSupabase }));
vi.mock("@/lib/update-notifications", () => ({ notifyDownloadedUsersOfUpdate: mocks.notifyDownloadedUsersOfUpdate }));

import { POST } from "@/app/api/proposals/[id]/decision/route";

function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/proposals/proposal-1/decision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

function proposal(overrides: Record<string, unknown> = {}) {
  return {
    id: "proposal-1",
    artifact_id: "artifact-1",
    workspace_id: "workspace-1",
    candidate_version_id: "version-2",
    submitted_by_user_id: "submitter-1",
    status: "pending_review",
    artifact: { name: "Support Triage", can_publish: true, current_version_id: "version-2" },
    ...overrides
  };
}

describe("proposal decision API authorization", () => {
  const rpc = vi.fn();
  const from = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasSupabaseConfig.mockReturnValue(true);
    mocks.createServerSupabase.mockReturnValue({ rpc, from });
    mocks.getViewerContext.mockResolvedValue({ user: { id: "reviewer-1", email: "reviewer@example.com" } });
  });

  it("requires a configured live service before resolving a submission", async () => {
    mocks.hasSupabaseConfig.mockReturnValue(false);

    const response = await POST(request({ decision: "published" }), { params: Promise.resolve({ id: "proposal-1" }) });

    expect(response.status).toBe(503);
    expect(mocks.getProposal).not.toHaveBeenCalled();
  });

  it("requires a review note before a rejection or change request reaches the database", async () => {
    const response = await POST(request({ decision: "changes_requested" }), { params: Promise.resolve({ id: "proposal-1" }) });

    expect(response.status).toBe(400);
    expect(mocks.getProposal).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("denies viewers before it attempts a publish decision", async () => {
    mocks.getProposal.mockResolvedValue(proposal({ artifact: { name: "Support Triage", can_publish: false, current_version_id: "version-2" } }));

    const response = await POST(request({ decision: "published" }), { params: Promise.resolve({ id: "proposal-1" }) });

    expect(response.status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects a decision when a newer submission replaced the candidate", async () => {
    mocks.getProposal.mockResolvedValue(proposal({ artifact: { name: "Support Triage", can_publish: true, current_version_id: "version-3" } }));

    const response = await POST(request({ decision: "published" }), { params: Promise.resolve({ id: "proposal-1" }) });

    expect(response.status).toBe(409);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("records an authorized publication, creates a submitter notification, and checks downloaded copies", async () => {
    mocks.getProposal.mockResolvedValue(proposal());
    rpc.mockResolvedValue({ data: { proposalId: "proposal-1", status: "published" }, error: null });
    const insert = vi.fn().mockResolvedValue({ error: null });
    from.mockReturnValue({ insert });

    const response = await POST(request({ decision: "published", note: "Ready for the workspace." }), { params: Promise.resolve({ id: "proposal-1" }) });

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("decide_proposal", {
      p_proposal_id: "proposal-1",
      p_reviewer_user_id: "reviewer-1",
      p_reviewer_name: "reviewer@example.com",
      p_decision: "published",
      p_note: "Ready for the workspace."
    });
    expect(from).toHaveBeenCalledWith("notifications");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: "submitter-1",
      proposal_id: "proposal-1",
      type: "proposal_published"
    }));
    expect(mocks.notifyDownloadedUsersOfUpdate).toHaveBeenCalledWith({
      artifactId: "artifact-1",
      workspaceId: "workspace-1",
      versionId: "version-2",
      artifactName: "Support Triage"
    });
  });
});
