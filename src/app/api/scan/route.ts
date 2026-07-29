import { NextResponse } from "next/server";
import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";
import { ensureWorkspaceId } from "@/lib/settings";
import type { ScanArtifactInput } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { artifacts?: ScanArtifactInput[] };
  const artifacts = Array.isArray(body.artifacts) ? body.artifacts : null;
  if (!artifacts) {
    return NextResponse.json({ error: "Request body must include an artifacts array." }, { status: 400 });
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ accepted: artifacts.length, mode: "demo" });
  }

  const supabase = createServerSupabase();
  let workspaceId: string;
  try {
    workspaceId = await ensureWorkspaceId();
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to resolve workspace." }, { status: 400 });
  }

  const { data: scanRun, error: scanError } = await supabase
    .from("scan_runs")
    .insert({ workspace_id: workspaceId, status: "running", artifact_count: artifacts.length })
    .select("id")
    .single();
  if (scanError) return NextResponse.json({ error: scanError.message }, { status: 400 });

  try {
    for (const item of artifacts) {
      const validationError = validateScanItem(item);
      if (validationError) throw new Error(validationError);

      const { data: repo, error: repoError } = await supabase
        .from("repos")
        .upsert(
          {
            workspace_id: workspaceId,
            name: item.repo.name,
            root_path: item.repo.root_path,
            default_branch: item.repo.branch_ref
          },
          { onConflict: "workspace_id,name" }
        )
        .select("id")
        .single();
      if (repoError) throw repoError;

      const { data: existing, error: existingError } = await supabase
        .from("artifacts")
        .select("id, approved_version_id")
        .eq("workspace_id", workspaceId)
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
            workspace_id: workspaceId,
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
            status
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
    }

    const { error: completedError } = await supabase.from("scan_runs").update({ status: "completed" }).eq("id", scanRun.id);
    if (completedError) throw completedError;
    return NextResponse.json({ accepted: artifacts.length, workspaceId });
  } catch (error) {
    await supabase.from("scan_runs").update({ status: "failed" }).eq("id", scanRun.id);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scan ingest failed." }, { status: 400 });
  }
}

function validateScanItem(item: ScanArtifactInput) {
  if (!item?.repo?.name) return "Each artifact must include repo.name.";
  if (!item.repo.root_path) return "Each artifact must include repo.root_path.";
  if (!item?.artifact?.name) return "Each artifact must include artifact.name.";
  if (!item.artifact.path) return "Each artifact must include artifact.path.";
  if (!item.artifact.type) return "Each artifact must include artifact.type.";
  if (!item?.version?.content_hash) return "Each artifact must include version.content_hash.";
  if (!item.version.content_snapshot) return "Each artifact must include version.content_snapshot.";
  return null;
}

function redactEvidence(evidence: string | null) {
  if (!evidence) return null;
  return evidence.replace(/(sk-|ghp_|token\s*[:=]\s*|secret\s*[:=]\s*|password\s*[:=]\s*)([A-Za-z0-9_\-]{6})[A-Za-z0-9_\-]+/gi, "$1$2...");
}
