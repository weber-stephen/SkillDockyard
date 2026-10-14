import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getViewerContext: vi.fn(),
  buildBrowserImportArtifacts: vi.fn(),
  validateBrowserSkillImport: vi.fn(),
  ingestArtifacts: vi.fn(),
  recordOnboardingMilestone: vi.fn(),
  consumeRateLimit: vi.fn(),
  recordRateLimitFailure: vi.fn(),
  getSettings: vi.fn(),
  createServerSupabase: vi.fn(),
  hasSupabaseConfig: vi.fn()
}));

vi.mock("@/lib/access", () => ({ getViewerContext: mocks.getViewerContext }));
vi.mock("@/lib/browser-skill-import", () => ({ buildBrowserImportArtifacts: mocks.buildBrowserImportArtifacts, validateBrowserSkillImport: mocks.validateBrowserSkillImport }));
vi.mock("@/lib/ingest", () => ({ ingestArtifacts: mocks.ingestArtifacts }));
vi.mock("@/lib/onboarding", () => ({ recordOnboardingMilestone: mocks.recordOnboardingMilestone }));
vi.mock("@/lib/rate-limit", () => ({ consumeRateLimit: mocks.consumeRateLimit, recordRateLimitFailure: mocks.recordRateLimitFailure, RateLimitConfigurationError: class RateLimitConfigurationError extends Error {} }));
vi.mock("@/lib/settings", () => ({ getSettings: mocks.getSettings }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabase: mocks.createServerSupabase, hasSupabaseConfig: mocks.hasSupabaseConfig }));

import { POST } from "@/app/api/imports/skills/route";

describe("browser workspace imports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasSupabaseConfig.mockReturnValue(true);
    mocks.validateBrowserSkillImport.mockReturnValue(null);
    mocks.getSettings.mockResolvedValue({ workspaceId: "workspace-1", approvedMcpServers: [], highImpactTools: [] });
    mocks.getViewerContext.mockResolvedValue({ user: { id: "editor-1", email: "editor@example.com" }, memberships: [{ workspace_id: "workspace-1", role: "editor" }] });
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.buildBrowserImportArtifacts.mockReturnValue([{ artifact: { name: "Imported skill" } }]);
    mocks.ingestArtifacts.mockResolvedValue({ workspaceId: "workspace-1", artifacts: [{ artifactId: "artifact-1", versionId: "version-1", status: "unreviewed" }] });
    mocks.recordOnboardingMilestone.mockResolvedValue(undefined);
  });

  it("uses the transactional submission RPC so imports create an audit record", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { proposalId: "proposal-1" }, error: null });
    const reviewerQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      then: (resolve: (value: unknown) => unknown) => resolve({ data: [], error: null })
    };
    mocks.createServerSupabase.mockReturnValue({ rpc, from: vi.fn().mockReturnValue(reviewerQuery) });

    const response = await POST(new Request("http://localhost/api/imports/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: "workspace", summary: "Import this skill", skills: [{ path: "skill/SKILL.md", content: "# Skill" }] })
    }));

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("submit_artifact_proposal", {
      p_artifact_id: "artifact-1",
      p_candidate_version_id: "version-1",
      p_actor_user_id: "editor-1",
      p_actor_email: "editor@example.com",
      p_kind: "new",
      p_source_share_id: null
    });
    expect(await response.json()).toMatchObject({ proposalIds: ["proposal-1"] });
  });
});
