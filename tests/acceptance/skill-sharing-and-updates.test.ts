import crypto from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { computeArtifactPermission } from "@/lib/access";
import type { Artifact, ArtifactShare, WorkspaceMembership } from "@/lib/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("test:acceptance requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from `npx supabase status --output env`.");
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

type TestUser = { id: string; email: string };
type Fixture = {
  sourceOwner: TestUser;
  reviewer: TestUser;
  individualRecipient: TestUser;
  workspaceMember: TestUser;
  outsider: TestUser;
  sourceWorkspaceId: string;
  targetWorkspaceId: string;
  artifact: Artifact;
  publishedVersionId: string;
};

function suffix() {
  return crypto.randomUUID().slice(0, 8);
}

async function must<T>(result: { data: unknown; error: { message: string } | null }): Promise<T> {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error("Expected Supabase to return data.");
  return result.data as T;
}

async function createUser(label: string, id: string): Promise<TestUser> {
  const email = `${label}-${id}@example.com`;
  const { data, error } = await supabase.auth.admin.createUser({ email, password: "SkillDockyard-acceptance-2026", email_confirm: true });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Acceptance user creation did not return a user.");
  return { id: data.user.id, email };
}

async function addMembership(workspaceId: string, user: TestUser, role: WorkspaceMembership["role"]) {
  await must<{ id: string }>(await supabase.from("workspace_members").insert({ workspace_id: workspaceId, user_id: user.id, email: user.email, role }).select("id").single());
}

async function createFixture(): Promise<Fixture> {
  const id = suffix();
  const [sourceOwner, reviewer, individualRecipient, workspaceMember, outsider] = await Promise.all([
    createUser("source-owner", id),
    createUser("reviewer", id),
    createUser("individual-recipient", id),
    createUser("workspace-member", id),
    createUser("outsider", id)
  ]);
  const source = await must<{ id: string }>(await supabase.from("workspaces").insert({ name: `Source ${id}`, owner_user_id: sourceOwner.id }).select("id").single());
  const target = await must<{ id: string }>(await supabase.from("workspaces").insert({ name: `Target ${id}`, owner_user_id: workspaceMember.id }).select("id").single());
  await Promise.all([
    addMembership(source.id, sourceOwner, "owner"),
    addMembership(source.id, reviewer, "reviewer"),
    addMembership(target.id, workspaceMember, "owner")
  ]);
  const repo = await must<{ id: string }>(await supabase.from("repos").insert({ workspace_id: source.id, name: `skills-${id}`, root_path: `/fixtures/${id}`, default_branch: "main" }).select("id").single());
  const artifactRow = await must<{ id: string }>(await supabase.from("artifacts").insert({
    workspace_id: source.id,
    repo_id: repo.id,
    name: "Release Safety",
    slug: `release-safety-${id}`,
    type: "claude_skill",
    path: `skills/release-safety-${id}/SKILL.md`,
    description: "Acceptance fixture",
    owner: "Source workspace",
    status: "approved",
    visibility: "workspace",
    created_by_user_id: sourceOwner.id
  }).select("id").single());
  const version = await must<{ id: string }>(await supabase.from("artifact_versions").insert({
    artifact_id: artifactRow.id,
    content_hash: `sha256:published-${id}`,
    content_snapshot: "---\nname: Release Safety\n---\nVerify rollback before deployment.",
    summary: "Published fixture",
    status: "approved",
    tools: [],
    mcp_servers: [],
    tags: ["acceptance"]
  }).select("id").single());
  const persisted = await must<Artifact>(await supabase.from("artifacts").update({ current_version_id: version.id, approved_version_id: version.id }).eq("id", artifactRow.id).select("*").single());
  const artifact: Artifact = { ...persisted, repo_name: repo.id, risk_count: 0 };
  return { sourceOwner, reviewer, individualRecipient, workspaceMember, outsider, sourceWorkspaceId: source.id, targetWorkspaceId: target.id, artifact, publishedVersionId: version.id };
}

async function createCandidateProposal(fixture: Fixture, id: string, supersedesProposalId: string | null = null) {
  const version = await must<{ id: string }>(await supabase.from("artifact_versions").insert({
    artifact_id: fixture.artifact.id,
    content_hash: `sha256:update-${id}`,
    content_snapshot: "---\nname: Release Safety\n---\nVerify rollback and owner approval before deployment.",
    summary: "Candidate update",
    status: "needs_reapproval",
    tools: [],
    mcp_servers: [],
    tags: ["acceptance", "update"],
    created_by_user_id: fixture.individualRecipient.id
  }).select("id").single());
  await must<{ id: string }>(await supabase.from("artifacts").update({ current_version_id: version.id, status: "needs_reapproval" }).eq("id", fixture.artifact.id).select("id").single());
  const proposal = await must<{ id: string }>(await supabase.from("proposals").insert({
    artifact_id: fixture.artifact.id,
    candidate_version_id: version.id,
    base_version_id: fixture.publishedVersionId,
    workspace_id: fixture.sourceWorkspaceId,
    submitted_by_user_id: fixture.individualRecipient.id,
    submitter_email: fixture.individualRecipient.email,
    kind: "update",
    status: "pending_review",
    supersedes_proposal_id: supersedesProposalId
  }).select("id").single());
  return { proposalId: proposal.id, candidateVersionId: version.id };
}

beforeAll(async () => {
  const { error } = await supabase.from("workspaces").select("id").limit(1);
  if (error) throw new Error(`Local Supabase is not migrated for acceptance tests: ${error.message}`);
});

describe("local Supabase skill sharing and update lifecycle", () => {
  /** Scenario: APP-001; a verified user is provisioned exactly one personal workspace. */
  it("keeps personal-workspace provisioning idempotent with one owner membership and audit event", async () => {
    const user = await createUser("personal-workspace", suffix());
    const first = await must<string>(await supabase.rpc("ensure_personal_workspace", {
      p_user_id: user.id,
      p_user_email: user.email,
      p_workspace_name: "Personal acceptance workspace"
    }));
    const second = await must<string>(await supabase.rpc("ensure_personal_workspace", {
      p_user_id: user.id,
      p_user_email: user.email,
      p_workspace_name: "A later name must not create another workspace"
    }));
    const workspaces = await must<Array<{ id: string }>>(await supabase.from("workspaces").select("id").eq("owner_user_id", user.id));
    const memberships = await must<Array<{ role: string }>>(await supabase.from("workspace_members").select("role").eq("workspace_id", first).eq("user_id", user.id));
    const audits = await must<Array<{ event_type: string }>>(await supabase.from("audit_events").select("event_type").eq("workspace_id", first).eq("event_type", "personal_workspace_created"));

    expect(second).toBe(first);
    expect(workspaces).toEqual([{ id: first }]);
    expect(memberships).toEqual([{ role: "owner" }]);
    expect(audits).toHaveLength(1);
  });

  /** Scenario: SC-001; Requirement: REQ-1 individual sharing and access. */
  it("activates an individual share only after the named verified recipient accepts it", async () => {
    const fixture = await createFixture();
    const share = await must<ArtifactShare>(await supabase.rpc("create_artifact_share", {
      p_artifact_id: fixture.artifact.id,
      p_actor_user_id: fixture.sourceOwner.id,
      p_actor_email: fixture.sourceOwner.email,
      p_target_type: "user",
      p_target_email: fixture.individualRecipient.email,
      p_target_workspace_id: null,
      p_target_workspace_name: null,
      p_permission: "propose",
      p_activate: false
    }));
    expect(share).toMatchObject({ status: "pending", target_user_id: null, target_type: "user" });

    const active = await must<ArtifactShare>(await supabase.rpc("respond_to_artifact_share", { p_share_id: share.id, p_actor_user_id: fixture.individualRecipient.id, p_actor_email: fixture.individualRecipient.email, p_accept: true }));
    const permission = computeArtifactPermission({ artifact: fixture.artifact, memberships: [], workspaces: [], shares: [active], userId: fixture.individualRecipient.id });
    expect(active).toMatchObject({ status: "active", target_user_id: fixture.individualRecipient.id });
    expect(permission).toMatchObject({ accessScope: "shared_user", canProposeUpdate: true, canPublish: false, canManageShares: false });
    expect(computeArtifactPermission({ artifact: fixture.artifact, memberships: [], workspaces: [], shares: [active], userId: fixture.outsider.id })).toBeNull();
    const audits = await must<Array<{ event_type: string }>>(await supabase.from("audit_events").select("event_type").eq("artifact_id", fixture.artifact.id));
    expect(audits.map((item: { event_type: string }) => item.event_type)).toEqual(expect.arrayContaining(["skill_shared", "share_accepted"]));
  });

  /** Scenario: SC-002; Requirement: REQ-2 workspace sharing and membership isolation. */
  it("makes an active workspace share available to target members without adding them to the source workspace", async () => {
    const fixture = await createFixture();
    const share = await must<ArtifactShare>(await supabase.rpc("create_artifact_share", {
      p_artifact_id: fixture.artifact.id,
      p_actor_user_id: fixture.sourceOwner.id,
      p_actor_email: fixture.sourceOwner.email,
      p_target_type: "workspace",
      p_target_email: null,
      p_target_workspace_id: fixture.targetWorkspaceId,
      p_target_workspace_name: "Target workspace",
      p_permission: "view",
      p_activate: true
    }));
    const targetMembership = [{ id: "target-member", workspace_id: fixture.targetWorkspaceId, user_id: fixture.workspaceMember.id, email: fixture.workspaceMember.email, role: "owner" as const, created_at: new Date().toISOString() }];
    const permission = computeArtifactPermission({ artifact: fixture.artifact, memberships: targetMembership, workspaces: [], shares: [share], userId: fixture.workspaceMember.id });
    expect(share).toMatchObject({ status: "active", target_workspace_id: fixture.targetWorkspaceId, target_user_id: null });
    expect(permission).toMatchObject({ accessScope: "shared_workspace", canProposeUpdate: false, canPublish: false });
    const { data: sourceMembership, error } = await supabase.from("workspace_members").select("id").eq("workspace_id", fixture.sourceWorkspaceId).eq("user_id", fixture.workspaceMember.id).maybeSingle();
    expect(error).toBeNull();
    expect(sourceMembership).toBeNull();
  });

  /** Scenario: APP-008 / APP-009; revocation removes access but retains canonical records. */
  it("revokes an accepted individual share without changing ownership or deleting its audit history", async () => {
    const fixture = await createFixture();
    const created = await must<ArtifactShare>(await supabase.rpc("create_artifact_share", {
      p_artifact_id: fixture.artifact.id,
      p_actor_user_id: fixture.sourceOwner.id,
      p_actor_email: fixture.sourceOwner.email,
      p_target_type: "user",
      p_target_email: fixture.individualRecipient.email,
      p_target_workspace_id: null,
      p_target_workspace_name: null,
      p_permission: "view",
      p_activate: false
    }));
    const active = await must<ArtifactShare>(await supabase.rpc("respond_to_artifact_share", {
      p_share_id: created.id,
      p_actor_user_id: fixture.individualRecipient.id,
      p_actor_email: fixture.individualRecipient.email,
      p_accept: true
    }));
    expect(computeArtifactPermission({ artifact: fixture.artifact, memberships: [], workspaces: [], shares: [active], userId: fixture.individualRecipient.id })).not.toBeNull();

    const revoked = await must<ArtifactShare>(await supabase.rpc("revoke_artifact_share", {
      p_share_id: created.id,
      p_actor_user_id: fixture.sourceOwner.id,
      p_actor_email: fixture.sourceOwner.email
    }));
    const artifact = await must<Pick<Artifact, "workspace_id" | "created_by_user_id" | "approved_version_id">>(await supabase.from("artifacts").select("workspace_id, created_by_user_id, approved_version_id").eq("id", fixture.artifact.id).single());
    const audits = await must<Array<{ event_type: string }>>(await supabase.from("audit_events").select("event_type").eq("artifact_id", fixture.artifact.id));

    expect(revoked).toMatchObject({ status: "revoked" });
    expect(computeArtifactPermission({ artifact: fixture.artifact, memberships: [], workspaces: [], shares: [revoked], userId: fixture.individualRecipient.id })).toBeNull();
    expect(artifact).toMatchObject({ workspace_id: fixture.sourceWorkspaceId, created_by_user_id: fixture.sourceOwner.id, approved_version_id: fixture.publishedVersionId });
    expect(audits.map((audit) => audit.event_type)).toEqual(expect.arrayContaining(["skill_shared", "share_accepted", "share_revoked"]));
  });

  /** Scenario: APP-004; a reviewer can publish but cannot perform owner-only administration. */
  it("rejects owner-only workspace administration by a reviewer without side effects", async () => {
    const fixture = await createFixture();
    const [inviteResult, renameResult] = await Promise.all([
      supabase.rpc("invite_workspace_member", {
        p_workspace_id: fixture.sourceWorkspaceId,
        p_actor_user_id: fixture.reviewer.id,
        p_actor_email: fixture.reviewer.email,
        p_email: `candidate-${suffix()}@example.com`,
        p_role: "viewer",
        p_token_hash: crypto.randomUUID().replaceAll("-", ""),
        p_expires_at: new Date(Date.now() + 60_000).toISOString()
      }),
      supabase.rpc("rename_workspace", {
        p_workspace_id: fixture.sourceWorkspaceId,
        p_actor_user_id: fixture.reviewer.id,
        p_actor_email: fixture.reviewer.email,
        p_name: "Reviewer must not rename this"
      })
    ]);
    const workspace = await must<{ name: string }>(await supabase.from("workspaces").select("name").eq("id", fixture.sourceWorkspaceId).single());
    const invites = await must<Array<{ id: string }>>(await supabase.from("workspace_invites").select("id").eq("workspace_id", fixture.sourceWorkspaceId));
    const audits = await must<Array<{ event_type: string }>>(await supabase.from("audit_events").select("event_type").eq("workspace_id", fixture.sourceWorkspaceId));

    expect(inviteResult.error?.message).toContain("owner");
    expect(renameResult.error?.message).toContain("owner");
    expect(workspace.name).toMatch(/^Source /);
    expect(invites).toEqual([]);
    expect(audits.map((audit) => audit.event_type)).not.toContain("workspace_invite_created");
    expect(audits.map((audit) => audit.event_type)).not.toContain("workspace_renamed");
  });

  /** Scenario: SC-003; Requirement: REQ-3 unshared skills deny access. */
  it("does not grant an unshared user skill access or update permission", async () => {
    const fixture = await createFixture();
    expect(computeArtifactPermission({ artifact: fixture.artifact, memberships: [], workspaces: [], shares: [], userId: fixture.outsider.id })).toBeNull();
  });

  /** Scenario: APP-007; a shared recipient's update stays unpublished until review. */
  it("keeps the approved version available while an update-capable shared recipient has a submission awaiting review", async () => {
    const fixture = await createFixture();
    const share = await must<ArtifactShare>(await supabase.rpc("create_artifact_share", {
      p_artifact_id: fixture.artifact.id,
      p_actor_user_id: fixture.sourceOwner.id,
      p_actor_email: fixture.sourceOwner.email,
      p_target_type: "user",
      p_target_email: fixture.individualRecipient.email,
      p_target_workspace_id: null,
      p_target_workspace_name: null,
      p_permission: "propose",
      p_activate: false
    }));
    const active = await must<ArtifactShare>(await supabase.rpc("respond_to_artifact_share", {
      p_share_id: share.id,
      p_actor_user_id: fixture.individualRecipient.id,
      p_actor_email: fixture.individualRecipient.email,
      p_accept: true
    }));
    const candidate = await createCandidateProposal(fixture, suffix());
    const artifact = await must<Pick<Artifact, "current_version_id" | "approved_version_id">>(await supabase.from("artifacts").select("current_version_id, approved_version_id").eq("id", fixture.artifact.id).single());
    const proposal = await must<{ status: string; candidate_version_id: string }>(await supabase.from("proposals").select("status, candidate_version_id").eq("id", candidate.proposalId).single());

    expect(computeArtifactPermission({ artifact: fixture.artifact, memberships: [], workspaces: [], shares: [active], userId: fixture.individualRecipient.id })).toMatchObject({ canProposeUpdate: true, canPublish: false });
    expect(proposal).toMatchObject({ status: "pending_review", candidate_version_id: candidate.candidateVersionId });
    expect(artifact).toMatchObject({ current_version_id: candidate.candidateVersionId, approved_version_id: fixture.publishedVersionId });
  });

  /** Scenario: SC-004; Requirement: REQ-4 accepted skill update. */
  it("publishes a submitted update only through the reviewer decision and records its audit history", async () => {
    const fixture = await createFixture();
    const candidate = await createCandidateProposal(fixture, suffix());
    const decision = await must<{ proposalId: string; status: string }>(await supabase.rpc("decide_proposal", { p_proposal_id: candidate.proposalId, p_reviewer_user_id: fixture.reviewer.id, p_reviewer_name: fixture.reviewer.email, p_decision: "published", p_note: "Ready to publish." }));
    const artifact = await must<Pick<Artifact, "current_version_id" | "approved_version_id" | "status">>(await supabase.from("artifacts").select("current_version_id, approved_version_id, status").eq("id", fixture.artifact.id).single());
    const review = await must<{ decision: string; note: string | null }>(await supabase.from("proposal_reviews").select("decision, note").eq("proposal_id", candidate.proposalId).single());
    expect(decision).toMatchObject({ proposalId: candidate.proposalId, status: "published" });
    expect(artifact).toMatchObject({ current_version_id: candidate.candidateVersionId, approved_version_id: candidate.candidateVersionId, status: "approved" });
    expect(review).toMatchObject({ decision: "published", note: "Ready to publish." });
  });

  /** Scenario: SC-005; Requirement: REQ-4 denied and changes-requested skill updates. */
  it.each(["rejected", "changes_requested"] as const)("keeps the published version active when an update is %s", async (decision) => {
    const fixture = await createFixture();
    const candidate = await createCandidateProposal(fixture, suffix());
    await must<{ proposalId: string; status: string }>(await supabase.rpc("decide_proposal", { p_proposal_id: candidate.proposalId, p_reviewer_user_id: fixture.reviewer.id, p_reviewer_name: fixture.reviewer.email, p_decision: decision, p_note: "Revise the rollout guidance." }));
    const artifact = await must<Pick<Artifact, "approved_version_id">>(await supabase.from("artifacts").select("approved_version_id").eq("id", fixture.artifact.id).single());
    const proposal = await must<{ status: string; resolution_note: string | null }>(await supabase.from("proposals").select("status, resolution_note").eq("id", candidate.proposalId).single());
    expect(artifact.approved_version_id).toBe(fixture.publishedVersionId);
    expect(proposal).toMatchObject({ status: decision, resolution_note: "Revise the rollout guidance." });
  });

  /** Scenario: APP-010 withdrawal; withdrawing a submission never promotes its candidate. */
  it("keeps the published version active after the submitter withdraws an awaiting-review update", async () => {
    const fixture = await createFixture();
    const candidate = await createCandidateProposal(fixture, suffix());
    await must<{ id: string }>(await supabase
      .from("proposals")
      .update({ status: "withdrawn", resolved_by_user_id: fixture.individualRecipient.id, resolved_at: new Date().toISOString(), resolution_note: "Withdrawn by submitter." })
      .eq("id", candidate.proposalId)
      .eq("submitted_by_user_id", fixture.individualRecipient.id)
      .eq("status", "pending_review")
      .select("id")
      .single());

    const artifact = await must<Pick<Artifact, "approved_version_id">>(await supabase.from("artifacts").select("approved_version_id").eq("id", fixture.artifact.id).single());
    const proposal = await must<{ status: string; resolution_note: string | null }>(await supabase.from("proposals").select("status, resolution_note").eq("id", candidate.proposalId).single());

    expect(artifact.approved_version_id).toBe(fixture.publishedVersionId);
    expect(proposal).toMatchObject({ status: "withdrawn", resolution_note: "Withdrawn by submitter." });
  });

  /** Scenario: APP-010 replacement; a newer submission supersedes the older one without publishing either candidate. */
  it("keeps the published version active when a newer update replaces an awaiting-review submission", async () => {
    const fixture = await createFixture();
    const first = await createCandidateProposal(fixture, suffix());
    await must<{ id: string }>(await supabase
      .from("proposals")
      .update({ status: "superseded", resolved_by_user_id: fixture.individualRecipient.id, resolved_at: new Date().toISOString(), resolution_note: "Superseded by a newer submission." })
      .eq("id", first.proposalId)
      .eq("status", "pending_review")
      .select("id")
      .single());
    const replacement = await createCandidateProposal(fixture, suffix(), first.proposalId);

    const artifact = await must<Pick<Artifact, "current_version_id" | "approved_version_id">>(await supabase.from("artifacts").select("current_version_id, approved_version_id").eq("id", fixture.artifact.id).single());
    const [older, newer] = await Promise.all([
      supabase.from("proposals").select("status").eq("id", first.proposalId).single(),
      supabase.from("proposals").select("status, supersedes_proposal_id").eq("id", replacement.proposalId).single()
    ]);

    expect(artifact).toMatchObject({ current_version_id: replacement.candidateVersionId, approved_version_id: fixture.publishedVersionId });
    expect((await must<{ status: string }>(older)).status).toBe("superseded");
    expect(await must<{ status: string; supersedes_proposal_id: string | null }>(newer)).toMatchObject({ status: "pending_review", supersedes_proposal_id: first.proposalId });
  });
});
