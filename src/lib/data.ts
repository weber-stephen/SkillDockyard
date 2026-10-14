import { sampleArtifacts, sampleDetails } from "@/lib/sample-data";
import { computeArtifactPermission, getViewerContext } from "@/lib/access";
import { getArtifactShares } from "@/lib/shares";
import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";
import { getProductMode } from "@/lib/product-mode";
import { isMissingSupabaseSchemaError } from "@/lib/supabase/errors";
import type { Artifact, ArtifactDetail, ArtifactShare, ArtifactVersion, GovernanceExportRow, Proposal, RiskFlag } from "@/lib/types";

export async function listArtifacts(): Promise<Artifact[]> {
  if ((await getProductMode()) === "demo") return sampleArtifacts;
  if (!hasSupabaseConfig()) throw new Error("The live app is not configured.");

  const supabase = createServerSupabase();
  const { user, memberships, workspaces } = await getViewerContext();
  const workspaceIds = [...new Set(memberships.map((item) => item.workspace_id))];
  const { data: sharedRows, error: sharedError } = await supabase
    .from("artifact_shares")
    .select("*")
    .eq("status", "active")
    .or(`target_user_id.eq.${user.id},target_workspace_id.in.(${workspaceIds.length ? workspaceIds.join(",") : "00000000-0000-0000-0000-000000000000"})`);
  if (sharedError && !isMissingSupabaseSchemaError(sharedError)) throw sharedError;

  const sharedArtifactIds = [...new Set((sharedRows ?? []).map((row) => row.artifact_id as string))];
  const filters: string[] = [];
  if (workspaceIds.length) filters.push(`workspace_id.in.(${workspaceIds.join(",")})`);
  if (sharedArtifactIds.length) filters.push(`id.in.(${sharedArtifactIds.join(",")})`);
  if (!filters.length) return [];

  const { data, error } = await supabase
    .from("artifact_catalog")
    .select("*")
    .or(filters.join(","))
    .order("updated_at", { ascending: false });

  if (error) throw error;
  const sharesByArtifact = groupSharesByArtifact((sharedRows ?? []) as ArtifactShare[]);
  const sourceWorkspaceIds = [...new Set((data ?? []).map((artifact) => artifact.workspace_id as string))];
  const { data: sourceWorkspaces, error: sourceWorkspaceError } = sourceWorkspaceIds.length
    ? await supabase.from("workspaces").select("id, name").in("id", sourceWorkspaceIds)
    : { data: [], error: null };
  if (sourceWorkspaceError) throw sourceWorkspaceError;
  const sourceNames = new Map((sourceWorkspaces ?? []).map((workspace) => [workspace.id as string, workspace.name as string]));
  return (data as Artifact[]).flatMap((artifact) => {
    const permission = computeArtifactPermission({
      artifact,
      memberships,
      workspaces,
      shares: sharesByArtifact.get(artifact.id) ?? [],
      userId: user.id
    });
    if (!permission) return [];
    return [{
      ...artifact,
      access_scope: permission.accessScope,
      can_propose_update: permission.canProposeUpdate,
      can_publish: permission.canPublish,
      can_manage_shares: permission.canManageShares,
      can_edit_private: permission.canEditPrivate,
      source_workspace_name: permission.sourceWorkspaceName ?? sourceNames.get(artifact.workspace_id) ?? null,
      created_by_viewer: artifact.created_by_user_id === user.id,
      source_share_id: permission.share?.id ?? null
    }];
  });
}

export async function getArtifactDetail(id: string): Promise<ArtifactDetail | null> {
  if ((await getProductMode()) === "demo") return sampleDetails[id] ?? null;
  if (!hasSupabaseConfig()) throw new Error("The live app is not configured.");

  const supabase = createServerSupabase();
  const { data: artifact, error } = await supabase
    .from("artifact_catalog")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  const { user, memberships, workspaces } = await getViewerContext();
  const shares = await getArtifactShares(id);
  const permission = computeArtifactPermission({
    artifact: artifact as Artifact,
    memberships,
    workspaces,
    shares,
    userId: user.id
  });
  if (!permission) return null;
  const { data: sourceWorkspace } = await supabase.from("workspaces").select("name").eq("id", artifact.workspace_id).maybeSingle();

  const [versionsResult, risksResult, approvalsResult, proposalsResult] = await Promise.all([
    supabase.from("artifact_versions").select("*").eq("artifact_id", id).order("created_at", { ascending: false }),
    supabase.from("risk_flags").select("*").eq("artifact_id", id).order("created_at", { ascending: false }),
    supabase.from("approvals").select("*").eq("artifact_id", id).order("created_at", { ascending: false }),
    supabase.from("proposals").select("*").eq("artifact_id", id).order("created_at", { ascending: false })
  ]);
  for (const result of [versionsResult, risksResult, approvalsResult, proposalsResult]) {
    if (result.error && !isMissingSupabaseSchemaError(result.error)) throw result.error;
  }
  const versions = (versionsResult.data ?? []) as ArtifactVersion[];
  const risks = (risksResult.data ?? []) as RiskFlag[];
  const approvals = approvalsResult.data;

  const proposalRows = (proposalsResult.data ?? []) as Proposal[];
  const proposalVersionIds = [...new Set(proposalRows.flatMap((proposal) => [proposal.candidate_version_id, proposal.base_version_id].filter((id): id is string => Boolean(id))))];
  const proposalVersions = new Map(versions.filter((version) => proposalVersionIds.includes(version.id)).map((version) => [version.id, version]));
  const proposals = proposalRows.map((proposal) => ({
    ...proposal,
    candidate_version: proposalVersions.get(proposal.candidate_version_id) ?? null,
    base_version: proposal.base_version_id ? proposalVersions.get(proposal.base_version_id) ?? null : null
  }));
  const visible = selectVisibleArtifactData({
    artifact: artifact as Artifact,
    userId: user.id,
    canPublish: permission.canPublish,
    versions,
    risks,
    proposals
  });

  return {
    ...(artifact as Artifact),
    access_scope: permission.accessScope,
    can_propose_update: permission.canProposeUpdate,
    can_publish: permission.canPublish,
    can_manage_shares: permission.canManageShares,
    can_edit_private: permission.canEditPrivate,
    source_workspace_name: permission.sourceWorkspaceName ?? sourceWorkspace?.name ?? null,
    created_by_viewer: (artifact as Artifact).created_by_user_id === user.id,
    source_share_id: permission.share?.id ?? null,
    current_version_id: visible.currentVersion?.id ?? null,
    risk_count: visible.risks.length,
    current_version: visible.currentVersion,
    approved_version: visible.approvedVersion,
    risks: visible.risks,
    approvals: approvals ?? [],
    current_proposal: visible.currentProposal,
    proposals: visible.proposals,
    shares: permission.canManageShares ? shares : shares.filter((share) => share.status === "active")
  } as ArtifactDetail;
}

export function selectVisibleArtifactData(input: {
  artifact: Pick<Artifact, "visibility" | "current_version_id" | "approved_version_id">;
  userId: string;
  canPublish: boolean;
  versions: ArtifactVersion[];
  risks: RiskFlag[];
  proposals: Proposal[];
}) {
  const submittedVersion = input.versions.find((version) => version.id === input.artifact.current_version_id) ?? input.versions[0] ?? null;
  const approvedVersion = input.versions.find((version) => version.id === input.artifact.approved_version_id) ?? null;
  const pendingProposal = input.proposals.find((proposal) => proposal.status === "pending_review") ?? null;
  const canViewSubmittedVersion = input.artifact.visibility === "private"
    || input.canPublish
    || pendingProposal?.submitted_by_user_id === input.userId;
  const currentVersion = canViewSubmittedVersion ? submittedVersion : approvedVersion;
  const currentProposal = canViewSubmittedVersion ? pendingProposal : null;
  const proposals = input.canPublish
    ? input.proposals
    : currentProposal ? [currentProposal] : [];
  const visibleVersionId = currentVersion?.id ?? null;

  return {
    currentVersion,
    approvedVersion,
    risks: visibleVersionId ? input.risks.filter((risk) => risk.artifact_version_id === visibleVersionId) : [],
    currentProposal,
    proposals
  };
}

export function getDemoArtifactDetail(id: string): ArtifactDetail | null {
  return sampleDetails[id] ?? null;
}

function groupSharesByArtifact(rows: ArtifactShare[]) {
  const result = new Map<string, ArtifactShare[]>();
  for (const row of rows) {
    const current = result.get(row.artifact_id) ?? [];
    current.push(row);
    result.set(row.artifact_id, current);
  }
  return result;
}

export async function listGovernanceExportRows(demo = false): Promise<GovernanceExportRow[]> {
  const artifacts = demo ? sampleArtifacts : await listArtifacts();
  const details = demo ? artifacts.map((artifact) => sampleDetails[artifact.id] ?? null) : await Promise.all(artifacts.map((artifact) => getArtifactDetail(artifact.id)));

  return details.filter(Boolean).map((artifact) => {
    const detail = artifact as ArtifactDetail;
    const lastApproval = detail.approvals[0] ?? null;
    return {
      id: detail.id,
      name: detail.name,
      type: detail.type,
      repo_name: detail.repo_name,
      path: detail.path,
      owner: detail.owner,
      status: detail.status,
      risk_count: detail.risk_count,
      current_content_hash: detail.current_version?.content_hash ?? null,
      approved_content_hash: detail.approved_version?.content_hash ?? null,
      current_commit_sha: detail.current_version?.commit_sha ?? null,
      tools: detail.current_version?.tools ?? [],
      mcp_servers: detail.current_version?.mcp_servers ?? [],
      risk_kinds: [...new Set(detail.risks.map((risk) => risk.kind))],
      risk_severities: [...new Set(detail.risks.map((risk) => risk.severity))],
      last_reviewer: lastApproval?.reviewer_name ?? null,
      last_decision: lastApproval?.decision ?? null,
      updated_at: detail.updated_at
    };
  });
}
