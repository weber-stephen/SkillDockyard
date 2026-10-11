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

  it("allows an Editor to submit a new workspace skill as an awaiting-review proposal", async () => {
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
    mocks.getSettings.mockResolvedValue({ approvedMcpServers: [], highImpactTools: [], workspaceId: "workspace-1" });
    mocks.buildManualSubmission.mockReturnValue({
      targetArtifactId: null,
      compareHref: "/artifacts/artifact-1/review",
      successMessage: "Submitted.",
      artifact: { artifact: { name: "Support Triage" }, version: { content_hash: "hash-1" }, risks: [] }
    });
    mocks.getViewerContext.mockResolvedValue({ user: { id: "user-1", email: "user@example.com" }, memberships: [{ workspace_id: "workspace-1", role: "editor" }] });
    mocks.ingestArtifacts.mockResolvedValue({ workspaceId: "workspace-1", artifacts: [{ artifactId: "artifact-1", versionId: "version-1" }] });
    mocks.createServerSupabase.mockReturnValue({ from: vi.fn().mockReturnValue(builder) });

    const response = await POST(request({ mode: "new" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ mode: "supabase", saved: true, proposalId: "proposal-1", proposalStatus: "pending_review" });
    expect(mocks.ingestArtifacts).toHaveBeenCalledOnce();
    expect(builder.insert).toHaveBeenCalled();
  });

  it("denies a viewer before a new workspace skill can be ingested or submitted", async () => {
    mocks.hasSupabaseConfig.mockReturnValue(true);
    mocks.getArtifactDetail.mockResolvedValue(null);
    mocks.getSettings.mockResolvedValue({ approvedMcpServers: [], highImpactTools: [], workspaceId: "workspace-1" });
    mocks.buildManualSubmission.mockReturnValue({
      targetArtifactId: null,
      compareHref: "/artifacts/artifact-1/review",
      successMessage: "Submitted.",
      artifact: { artifact: { name: "Viewer must not submit" }, version: { content_hash: "hash-viewer" }, risks: [] }
    });
    mocks.getViewerContext.mockResolvedValue({
      user: { id: "viewer-1", email: "viewer@example.com" },
      memberships: [{ workspace_id: "workspace-1", role: "viewer" }]
    });

    const response = await POST(request({ mode: "new" }));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "You can view this workspace, but you cannot submit skills for review." });
    expect(mocks.ingestArtifacts).not.toHaveBeenCalled();
    expect(mocks.createServerSupabase).not.toHaveBeenCalled();
  });

  it("replaces an older awaiting-review update without publishing either candidate", async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "proposal-old", candidate_version_id: "version-old", status: "pending_review" }, error: null }),
      single: vi.fn().mockResolvedValue({ data: { id: "proposal-new" }, error: null }),
      then: (resolve: (value: unknown) => unknown) => resolve({ data: [], error: null })
    };
    const existing = {
      id: "artifact-1",
      workspace_id: "workspace-source-1",
      can_propose_update: true,
      approved_version_id: "version-published-1",
      approved_version: { content_hash: "hash-published" },
      current_proposal: { id: "proposal-old" },
      source_share_id: "share-1"
    };
    mocks.hasSupabaseConfig.mockReturnValue(true);
    mocks.getArtifactDetail.mockResolvedValue(existing);
    mocks.getSettings.mockResolvedValue({ approvedMcpServers: [], highImpactTools: [], workspaceId: "workspace-recipient-1" });
    mocks.buildManualSubmission.mockReturnValue({
      targetArtifactId: existing.id,
      compareHref: "/artifacts/artifact-1/review",
      successMessage: "Submitted.",
      artifact: { artifact: { name: "Support Triage" }, version: { content_hash: "hash-new" }, risks: [] }
    });
    mocks.getViewerContext.mockResolvedValue({ user: { id: "recipient-1", email: "recipient@example.com" }, memberships: [] });
    mocks.ingestArtifacts.mockResolvedValue({ workspaceId: existing.workspace_id, artifacts: [{ artifactId: existing.id, versionId: "version-new" }] });
    mocks.createServerSupabase.mockReturnValue({ from: vi.fn().mockReturnValue(builder) });

    const response = await POST(request({ mode: "update", artifactId: existing.id }));

    expect(response.status).toBe(200);
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ status: "superseded", resolution_note: "Superseded by a newer submission." }));
    expect(builder.insert).toHaveBeenCalledWith(expect.objectContaining({
      candidate_version_id: "version-new",
      base_version_id: "version-published-1",
      supersedes_proposal_id: "proposal-old",
      status: "pending_review"
    }));
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

  it("submits an eligible shared-skill update to the source workspace and preserves the share lineage", async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: { id: "proposal-update-1" }, error: null }),
      then: (resolve: (value: unknown) => unknown) => resolve({ data: [], error: null })
    };
    const existing = {
      id: "artifact-shared-1",
      workspace_id: "workspace-source-1",
      can_propose_update: true,
      approved_version_id: "version-published-1",
      approved_version: { content_hash: "hash-published" },
      source_share_id: "share-1"
    };
    mocks.hasSupabaseConfig.mockReturnValue(true);
    mocks.getArtifactDetail.mockResolvedValue(existing);
    mocks.getSettings.mockResolvedValue({ approvedMcpServers: [], highImpactTools: [] });
    mocks.buildManualSubmission.mockReturnValue({
      targetArtifactId: existing.id,
      compareHref: `/artifacts/${existing.id}/review`,
      successMessage: "Submitted update.",
      artifact: { artifact: { name: "Support Triage" }, version: { content_hash: "hash-update" }, risks: [] }
    });
    mocks.getViewerContext.mockResolvedValue({ user: { id: "recipient-1", email: "recipient@example.com" }, memberships: [] });
    mocks.ingestArtifacts.mockResolvedValue({ workspaceId: "workspace-source-1", artifacts: [{ artifactId: existing.id, versionId: "version-update-1" }] });
    mocks.createServerSupabase.mockReturnValue({ from: vi.fn().mockReturnValue(builder) });

    const response = await POST(request({ mode: "update", artifactId: existing.id, skillText: "updated instructions", changeSummary: "Clarified the review sequence." }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ proposalId: "proposal-update-1", proposalStatus: "pending_review", visibility: "workspace" });
    expect(mocks.ingestArtifacts).toHaveBeenCalledWith(expect.any(Array), "workspace-source-1", expect.objectContaining({ createdByUserId: "recipient-1", sourceShareId: "share-1", visibility: "workspace" }));
    expect(builder.insert).toHaveBeenCalledWith(expect.objectContaining({ artifact_id: existing.id, candidate_version_id: "version-update-1", base_version_id: "version-published-1", source_share_id: "share-1", kind: "update", status: "pending_review" }));
  });

  /** Scenario: APP-003; an Editor can submit an update but the candidate is not published. */
  it("allows an Editor to submit an update to its workspace as awaiting review", async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: { id: "proposal-editor-update-1" }, error: null }),
      then: (resolve: (value: unknown) => unknown) => resolve({ data: [], error: null })
    };
    const existing = {
      id: "artifact-editor-1",
      workspace_id: "workspace-editor-1",
      can_propose_update: true,
      approved_version_id: "version-published-1",
      approved_version: { content_hash: "hash-published" },
      source_share_id: null
    };
    mocks.hasSupabaseConfig.mockReturnValue(true);
    mocks.getArtifactDetail.mockResolvedValue(existing);
    mocks.getSettings.mockResolvedValue({ approvedMcpServers: [], highImpactTools: [], workspaceId: existing.workspace_id });
    mocks.buildManualSubmission.mockReturnValue({
      targetArtifactId: existing.id,
      compareHref: `/artifacts/${existing.id}/review`,
      successMessage: "Submitted update.",
      artifact: { artifact: { name: "Editor update" }, version: { content_hash: "hash-editor-update" }, risks: [] }
    });
    mocks.getViewerContext.mockResolvedValue({ user: { id: "editor-1", email: "editor@example.com" }, memberships: [{ workspace_id: existing.workspace_id, role: "editor" }] });
    mocks.ingestArtifacts.mockResolvedValue({ workspaceId: existing.workspace_id, artifacts: [{ artifactId: existing.id, versionId: "version-editor-update-1" }] });
    mocks.createServerSupabase.mockReturnValue({ from: vi.fn().mockReturnValue(builder) });

    const response = await POST(request({ mode: "update", artifactId: existing.id, skillText: "Updated instructions", changeSummary: "Clarified escalation criteria." }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ proposalId: "proposal-editor-update-1", proposalStatus: "pending_review", visibility: "workspace" });
    expect(mocks.ingestArtifacts).toHaveBeenCalledWith(expect.any(Array), existing.workspace_id, expect.objectContaining({ createdByUserId: "editor-1", sourceShareId: null, visibility: "workspace" }));
    expect(builder.insert).toHaveBeenCalledWith(expect.objectContaining({ artifact_id: existing.id, candidate_version_id: "version-editor-update-1", base_version_id: "version-published-1", kind: "update", status: "pending_review" }));
  });

  it("denies a view-only recipient before creating an update version or proposal", async () => {
    mocks.hasSupabaseConfig.mockReturnValue(true);
    mocks.getArtifactDetail.mockResolvedValue({ id: "artifact-view-1", can_propose_update: false });
    mocks.getSettings.mockResolvedValue({ approvedMcpServers: [], highImpactTools: [] });

    const response = await POST(request({ mode: "update", artifactId: "artifact-view-1", skillText: "updated instructions", changeSummary: "Clarified the review sequence." }));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "You can view this skill, but you cannot propose updates to it." });
    expect(mocks.buildManualSubmission).not.toHaveBeenCalled();
    expect(mocks.ingestArtifacts).not.toHaveBeenCalled();
  });
});
