import { NextResponse } from "next/server";
import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";
import type { ScanArtifactInput } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { artifacts: ScanArtifactInput[] };
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ accepted: body.artifacts.length, mode: "demo" });
  }

  const supabase = createServerSupabase();
  const workspaceId = process.env.SKILL_DOCKYARD_WORKSPACE_ID;
  if (!workspaceId) return NextResponse.json({ error: "SKILL_DOCKYARD_WORKSPACE_ID is required." }, { status: 400 });

  const { data: scanRun, error: scanError } = await supabase
    .from("scan_runs")
    .insert({ workspace_id: workspaceId, status: "completed", artifact_count: body.artifacts.length })
    .select("id")
    .single();
  if (scanError) return NextResponse.json({ error: scanError.message }, { status: 400 });

  for (const item of body.artifacts) {
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

    const { data: existing } = await supabase
      .from("artifacts")
      .select("id, approved_version_id")
      .eq("workspace_id", workspaceId)
      .eq("repo_id", repo.id)
      .eq("path", item.artifact.path)
      .maybeSingle();

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
      .insert({
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
      })
      .select("id")
      .single();
    if (versionError) throw versionError;

    await supabase.from("artifacts").update({ current_version_id: version.id }).eq("id", artifact.id);

    if (item.risks.length) {
      await supabase.from("risk_flags").insert(
        item.risks.map((risk) => ({
          artifact_id: artifact.id,
          artifact_version_id: version.id,
          kind: risk.kind,
          severity: risk.severity,
          message: risk.message,
          evidence: risk.evidence
        }))
      );
    }
  }

  return NextResponse.json({ accepted: body.artifacts.length });
}
