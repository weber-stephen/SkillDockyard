import { sampleArtifacts, sampleDetails } from "@/lib/sample-data";
import { computeArtifactPermission, getViewerContext } from "@/lib/access";
import { getArtifactShares } from "@/lib/shares";
import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";
import { getProductMode } from "@/lib/product-mode";
import type { Artifact, ArtifactDetail, GovernanceExportRow } from "@/lib/types";

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
  if (sharedError) throw sharedError;

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
  const sharesByArtifact = groupSharesByArtifact(sharedRows ?? []);
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
      source_workspace_name: permission.sourceWorkspaceName
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

  const [{ data: versions }, { data: risks }, { data: approvals }] = await Promise.all([
    supabase.from("artifact_versions").select("*").eq("artifact_id", id).order("created_at", { ascending: false }),
    supabase.from("risk_flags").select("*").eq("artifact_id", id).order("created_at", { ascending: false }),
    supabase.from("approvals").select("*").eq("artifact_id", id).order("created_at", { ascending: false })
  ]);

  const current = versions?.find((version) => version.id === artifact.current_version_id) ?? versions?.[0] ?? null;
  const approved = versions?.find((version) => version.id === artifact.approved_version_id) ?? null;

  return {
    ...(artifact as Artifact),
    access_scope: permission.accessScope,
    can_propose_update: permission.canProposeUpdate,
    can_publish: permission.canPublish,
    can_manage_shares: permission.canManageShares,
    source_workspace_name: permission.sourceWorkspaceName,
    current_version: current,
    approved_version: approved,
    risks: risks ?? [],
    approvals: approvals ?? [],
    shares: permission.canManageShares ? shares : shares.filter((share) => share.status === "active")
  } as ArtifactDetail;
}

export function getDemoArtifactDetail(id: string): ArtifactDetail | null {
  return sampleDetails[id] ?? null;
}

function groupSharesByArtifact(rows: Array<{ artifact_id: string }>) {
  const result = new Map<string, any[]>();
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
