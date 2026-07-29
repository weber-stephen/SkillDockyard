import { sampleArtifacts, sampleDetails } from "@/lib/sample-data";
import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";
import type { Artifact, ArtifactDetail, GovernanceExportRow } from "@/lib/types";

export async function listArtifacts(): Promise<Artifact[]> {
  if (!hasSupabaseConfig()) return sampleArtifacts;

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("artifact_catalog")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data as Artifact[];
}

export async function getArtifactDetail(id: string): Promise<ArtifactDetail | null> {
  if (!hasSupabaseConfig()) return sampleDetails[id] ?? null;

  const supabase = createServerSupabase();
  const { data: artifact, error } = await supabase
    .from("artifact_catalog")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;

  const [{ data: versions }, { data: risks }, { data: approvals }] = await Promise.all([
    supabase.from("artifact_versions").select("*").eq("artifact_id", id).order("created_at", { ascending: false }),
    supabase.from("risk_flags").select("*").eq("artifact_id", id).order("created_at", { ascending: false }),
    supabase.from("approvals").select("*").eq("artifact_id", id).order("created_at", { ascending: false })
  ]);

  const current = versions?.find((version) => version.id === artifact.current_version_id) ?? versions?.[0] ?? null;
  const approved = versions?.find((version) => version.id === artifact.approved_version_id) ?? null;

  return {
    ...(artifact as Artifact),
    current_version: current,
    approved_version: approved,
    risks: risks ?? [],
    approvals: approvals ?? []
  } as ArtifactDetail;
}

export async function listGovernanceExportRows(): Promise<GovernanceExportRow[]> {
  const artifacts = await listArtifacts();
  const details = await Promise.all(artifacts.map((artifact) => getArtifactDetail(artifact.id)));

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
