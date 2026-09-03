import { createServerSupabase } from "@/lib/supabase/server";
import { ensureWorkspaceId } from "@/lib/settings";
import type { ScanArtifactInput } from "@/lib/types";

export interface IngestedArtifact {
  artifactId: string;
  versionId: string;
  status: "unreviewed" | "needs_reapproval";
}

export async function ingestArtifacts(
  artifacts: ScanArtifactInput[],
  workspaceId?: string,
  options?: {
    createdByUserId?: string | null;
    sourceShareId?: string | null;
  }
): Promise<{ workspaceId: string; artifacts: IngestedArtifact[] }> {
  const resolvedWorkspaceId = workspaceId ?? await ensureWorkspaceId();
  const supabase = createServerSupabase();
  const { data: scanRun, error: scanError } = await supabase
    .from("scan_runs")
    .insert({ workspace_id: resolvedWorkspaceId, status: "running", artifact_count: artifacts.length })
    .select("id")
    .single();
  if (scanError) throw scanError;

  const ingested: IngestedArtifact[] = [];
  try {
    for (const item of artifacts) {
      const validationError = validateScanItem(item);
      if (validationError) throw new Error(validationError);

      const { data: existingRepo, error: existingRepoError } = await supabase
        .from("repos")
        .select("id")
        .eq("workspace_id", resolvedWorkspaceId)
        .eq("name", item.repo.name)
        .maybeSingle();
      if (existingRepoError) throw existingRepoError;

      const repo = existingRepo ?? (await createRepo(resolvedWorkspaceId, item));

      const { data: existing, error: existingError } = await supabase
        .from("artifacts")
        .select("id, approved_version_id")
        .eq("workspace_id", resolvedWorkspaceId)
        .eq("repo_id", repo.id)
        .eq("path", item.artifact.path)
        .maybeSingle();
      if (existingError) throw existingError;

      const status = existing?.approved_version_id ? "needs_reapproval" : "unreviewed";
      const { data: artifact, error: artifactError } = await supabase
        .from("artifacts")
        .upsert(
          {
            id: existing?.id,
            workspace_id: resolvedWorkspaceId,
            repo_id: repo.id,
            name: item.artifact.name,
            slug: item.artifact.slug,
            type: item.artifact.type,
            path: item.artifact.path,
            description: item.artifact.description,
            owner: item.artifact.owner,
            status
          },
          { onConflict: "workspace_id,repo_id,path" }
        )
        .select("id")
        .single();
      if (artifactError) throw artifactError;

      const { data: version, error: versionError } = await supabase
        .from("artifact_versions")
        .upsert(
          {
            artifact_id: artifact.id,
            scan_run_id: scanRun.id,
            commit_sha: item.version.commit_sha,
            branch_ref: item.repo.branch_ref,
            content_hash: item.version.content_hash,
            content_snapshot: item.version.content_snapshot,
            summary: item.version.summary,
            tools: item.version.tools,
            mcp_servers: item.version.mcp_servers,
            tags: item.version.tags,
            status,
            created_by_user_id: options?.createdByUserId ?? null,
            source_share_id: options?.sourceShareId ?? null
          },
          { onConflict: "artifact_id,content_hash" }
        )
        .select("id")
        .single();
      if (versionError) throw versionError;

      const { error: updateArtifactError } = await supabase.from("artifacts").update({ current_version_id: version.id }).eq("id", artifact.id);
      if (updateArtifactError) throw updateArtifactError;

      const { error: riskDeleteError } = await supabase.from("risk_flags").delete().eq("artifact_version_id", version.id);
      if (riskDeleteError) throw riskDeleteError;

      if (item.risks.length) {
        const { error: riskInsertError } = await supabase.from("risk_flags").insert(
          item.risks.map((risk) => ({
            artifact_id: artifact.id,
            artifact_version_id: version.id,
            kind: risk.kind,
            severity: risk.severity,
            message: risk.message,
            evidence: redactEvidence(risk.evidence)
          }))
        );
        if (riskInsertError) throw riskInsertError;
      }

      ingested.push({ artifactId: artifact.id, versionId: version.id, status });
    }

    const { error: completedError } = await supabase.from("scan_runs").update({ status: "completed" }).eq("id", scanRun.id);
    if (completedError) throw completedError;
    return { workspaceId: resolvedWorkspaceId, artifacts: ingested };
  } catch (error) {
    await supabase.from("scan_runs").update({ status: "failed" }).eq("id", scanRun.id);
    throw error;
  }
}

async function createRepo(workspaceId: string, item: ScanArtifactInput) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("repos")
    .insert({
      workspace_id: workspaceId,
      name: item.repo.name,
      root_path: item.repo.root_path,
      default_branch: item.repo.branch_ref
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export function validateScanItem(item: ScanArtifactInput) {
  if (!item?.repo?.name) return "Each skill must include a repo name.";
  if (!item.repo.root_path) return "Each skill must include a source location.";
  if (!item?.artifact?.name) return "Each skill needs a name.";
  if (!item.artifact.path) return "Each skill needs a path.";
  if (!item.artifact.type) return "Each skill needs a type.";
  if (!item?.version?.content_hash) return "Each submitted version needs a content hash.";
  if (!item.version.content_snapshot) return "Paste the skill instructions before submitting.";
  return null;
}

export function redactEvidence(evidence: string | null) {
  if (!evidence) return null;
  return evidence.replace(/(sk-|ghp_|token\s*[:=]\s*|secret\s*[:=]\s*|password\s*[:=]\s*)([A-Za-z0-9_\-]{6})[A-Za-z0-9_\-]+/gi, "$1$2...");
}
