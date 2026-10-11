import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getArtifactDetail: vi.fn(),
  getDemoArtifactDetail: vi.fn(),
  hasSupabaseConfig: vi.fn(),
  createServerSupabase: vi.fn(),
  getPortableSkillStatus: vi.fn(),
  getPortableSkillContent: vi.fn(),
  createSkillDownload: vi.fn(),
  getArtifactForCli: vi.fn(),
  resolveCliToken: vi.fn(),
  getCurrentUser: vi.fn()
}));

vi.mock("@/lib/data", () => ({ getArtifactDetail: mocks.getArtifactDetail, getDemoArtifactDetail: mocks.getDemoArtifactDetail }));
vi.mock("@/lib/supabase/server", () => ({ hasSupabaseConfig: mocks.hasSupabaseConfig, createServerSupabase: mocks.createServerSupabase }));
vi.mock("@/lib/skill-download", () => ({ getPortableSkillStatus: mocks.getPortableSkillStatus, getPortableSkillContent: mocks.getPortableSkillContent }));
vi.mock("@/lib/skill-download-server", () => ({ createSkillDownload: mocks.createSkillDownload }));
vi.mock("@/lib/cli-auth", () => ({ getArtifactForCli: mocks.getArtifactForCli, resolveCliToken: mocks.resolveCliToken }));
vi.mock("@/lib/supabase/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));

import { GET } from "@/app/api/artifacts/[id]/download/route";

function artifact(visibility: "private" | "workspace") {
  return {
    id: "artifact-1",
    workspace_id: "workspace-1",
    slug: "release-safety",
    name: "Release Safety",
    visibility,
    current_version: { id: "version-current", content_hash: "sha256:current", content_snapshot: "CURRENT" },
    approved_version: { id: "version-approved", content_hash: "sha256:approved", content_snapshot: "PUBLISHED" }
  };
}

async function download() {
  return GET(new Request("http://localhost/api/artifacts/artifact-1/download?target=codex&os=mac"), { params: Promise.resolve({ id: "artifact-1" }) });
}

describe("skill download version selection", () => {
  const rpc = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveCliToken.mockResolvedValue(null);
    mocks.getPortableSkillStatus.mockReturnValue({ eligible: true, reason: null });
    mocks.getPortableSkillContent.mockReturnValue(null);
    mocks.createSkillDownload.mockImplementation(({ version }) => ({ filename: `${version.id}.zip`, content: Buffer.from(version.content_snapshot) }));
    mocks.hasSupabaseConfig.mockReturnValue(true);
    mocks.getCurrentUser.mockResolvedValue({ id: "creator-1" });
    rpc.mockResolvedValue({ error: null });
    mocks.createServerSupabase.mockReturnValue({ rpc });
  });

  it("downloads the approved version for a workspace skill with a newer candidate", async () => {
    mocks.getArtifactDetail.mockResolvedValue(artifact("workspace"));

    const response = await download();

    expect(response.status).toBe(200);
    expect(mocks.createSkillDownload).toHaveBeenCalledWith(expect.objectContaining({ version: expect.objectContaining({ id: "version-approved", content_snapshot: "PUBLISHED" }) }));
    expect(rpc).toHaveBeenCalledWith("record_skill_download", expect.objectContaining({ p_artifact_version_id: "version-approved" }));
    expect(await response.text()).toBe("PUBLISHED");
  });

  it("downloads the approved version for a shared recipient rather than an unpublished candidate", async () => {
    mocks.getArtifactDetail.mockResolvedValue({ ...artifact("workspace"), access_scope: "shared_user", source_share_id: "share-1" });

    const response = await download();

    expect(response.status).toBe(200);
    expect(mocks.createSkillDownload).toHaveBeenCalledWith(expect.objectContaining({ version: expect.objectContaining({ id: "version-approved" }) }));
    expect(await response.text()).toBe("PUBLISHED");
  });

  it("downloads the creator's current private draft version", async () => {
    mocks.getArtifactDetail.mockResolvedValue(artifact("private"));

    const response = await download();

    expect(response.status).toBe(200);
    expect(mocks.createSkillDownload).toHaveBeenCalledWith(expect.objectContaining({ version: expect.objectContaining({ id: "version-current", content_snapshot: "CURRENT" }) }));
    expect(rpc).toHaveBeenCalledWith("record_skill_download", expect.objectContaining({ p_artifact_version_id: "version-current" }));
    expect(await response.text()).toBe("CURRENT");
  });

  it("does not expose a download when artifact authorization returns no skill", async () => {
    mocks.getArtifactDetail.mockResolvedValue(null);

    const response = await download();

    expect(response.status).toBe(404);
    expect(mocks.createSkillDownload).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });
});
