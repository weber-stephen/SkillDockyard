import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hasSupabaseConfig: vi.fn(),
  getArtifactDetail: vi.fn(),
  getSettings: vi.fn(),
  buildManualSubmission: vi.fn(),
  validateManualSubmissionInput: vi.fn(),
  getViewerContext: vi.fn(),
  ingestArtifacts: vi.fn(),
  recordOnboardingMilestone: vi.fn(),
  createServerSupabase: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({ hasSupabaseConfig: mocks.hasSupabaseConfig, createServerSupabase: mocks.createServerSupabase }));
vi.mock("@/lib/data", () => ({ getArtifactDetail: mocks.getArtifactDetail }));
vi.mock("@/lib/settings", () => ({ getSettings: mocks.getSettings }));
vi.mock("@/lib/submissions", () => ({ buildManualSubmission: mocks.buildManualSubmission, validateManualSubmissionInput: mocks.validateManualSubmissionInput }));
vi.mock("@/lib/access", () => ({ getViewerContext: mocks.getViewerContext }));
vi.mock("@/lib/ingest", () => ({ ingestArtifacts: mocks.ingestArtifacts }));
vi.mock("@/lib/onboarding", () => ({ recordOnboardingMilestone: mocks.recordOnboardingMilestone }));

import { POST } from "@/app/api/submissions/route";

function request(body: Record<string, unknown>, query = "") {
  return new Request(`http://localhost/api/submissions${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("submission API persistence modes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasSupabaseConfig.mockReturnValue(false);
    mocks.validateManualSubmissionInput.mockReturnValue(null);
  });

  it("keeps explicit demo submissions local", async () => {
    const response = await POST(request({ mode: "new" }, "?demo=1"));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ mode: "demo", saved: false });
    expect(mocks.ingestArtifacts).not.toHaveBeenCalled();
  });

  it("rejects live submissions when the workspace is not configured", async () => {
    const response = await POST(request({ mode: "new" }));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "The live workspace is not configured.", code: "live_app_not_configured" });
    expect(mocks.buildManualSubmission).not.toHaveBeenCalled();
  });

  it("rejects oversized live request bodies before application processing", async () => {
    mocks.hasSupabaseConfig.mockReturnValue(true);
    const response = await POST(new Request("http://localhost/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "new", skillText: "x".repeat(2 * 1024 * 1024) })
    }));

    expect(response.status).toBe(413);
    expect(mocks.getArtifactDetail).not.toHaveBeenCalled();
    expect(mocks.buildManualSubmission).not.toHaveBeenCalled();
    expect(mocks.ingestArtifacts).not.toHaveBeenCalled();
  });

  it("persists a configured live submission as a pending proposal", async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: { id: "proposal-1" }, error: null }),
      then: (resolve: (value: unknown) => unknown) => resolve({ data: [], error: null })
    };

    mocks.hasSupabaseConfig.mockReturnValue(true);
    mocks.getArtifactDetail.mockResolvedValue(null);
    mocks.getSettings.mockResolvedValue({ approvedMcpServers: [], highImpactTools: [] });
    mocks.buildManualSubmission.mockReturnValue({
      targetArtifactId: null,
      compareHref: "/artifacts/artifact-1/review",
      successMessage: "Submitted.",
      artifact: { artifact: { name: "Support Triage" }, version: { content_hash: "hash-1" }, risks: [] }
    });
    mocks.getViewerContext.mockResolvedValue({ user: { id: "user-1", email: "user@example.com" } });
    mocks.ingestArtifacts.mockResolvedValue({ workspaceId: "workspace-1", artifacts: [{ artifactId: "artifact-1", versionId: "version-1" }] });
    mocks.createServerSupabase.mockReturnValue({ from: vi.fn().mockReturnValue(builder) });

    const response = await POST(request({ mode: "new" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ mode: "supabase", saved: true, proposalId: "proposal-1", proposalStatus: "pending_review" });
    expect(mocks.ingestArtifacts).toHaveBeenCalledOnce();
    expect(builder.insert).toHaveBeenCalled();
  });

  it("persists private submissions without creating a proposal", async () => {
    const builder = {
      from: vi.fn(),
      insert: vi.fn()
    };
    mocks.hasSupabaseConfig.mockReturnValue(true);
    mocks.getArtifactDetail.mockResolvedValue(null);
    mocks.getSettings.mockResolvedValue({ approvedMcpServers: [], highImpactTools: [] });
    mocks.buildManualSubmission.mockReturnValue({
      targetArtifactId: null,
      compareHref: null,
      successMessage: "Saved.",
      artifact: { artifact: { name: "Private Triage", path: "submitted/private-triage.md" }, version: { content_hash: "hash-private" }, risks: [] }
    });
    mocks.getViewerContext.mockResolvedValue({ user: { id: "user-1", email: "user@example.com" } });
    mocks.ingestArtifacts.mockResolvedValue({ workspaceId: "workspace-1", artifacts: [{ artifactId: "artifact-private", versionId: "version-private" }] });
    mocks.createServerSupabase.mockReturnValue(builder);

    const response = await POST(request({ mode: "new", visibility: "private" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ mode: "supabase", saved: true, visibility: "private", proposalId: null });
    expect(mocks.ingestArtifacts).toHaveBeenCalledWith(expect.any(Array), undefined, expect.objectContaining({ visibility: "private", createdByUserId: "user-1" }));
    expect(builder.from).not.toHaveBeenCalled();
  });
});
