import { NextResponse } from "next/server";
import { getArtifactDetail, getDemoArtifactDetail } from "@/lib/data";
import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";
import { createSkillDownload, getPortableSkillStatus, type DownloadOs, type DownloadTarget } from "@/lib/skill-download";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const demo = new URL(request.url).searchParams.get("demo") === "1";
  const artifact = demo ? getDemoArtifactDetail(id) : await getArtifactDetail(id);
  if (!artifact) return NextResponse.json({ error: "Skill not found" }, { status: 404 });

  const target = new URL(request.url).searchParams.get("target");
  const os = new URL(request.url).searchParams.get("os");
  if ((target !== "codex" && target !== "claude-code") || (os !== "mac" && os !== "windows")) {
    return NextResponse.json({ error: "Choose Codex or Claude Code, and Mac or Windows." }, { status: 400 });
  }

  const portable = getPortableSkillStatus(artifact);
  if (!portable.eligible || !artifact.approved_version) {
    return NextResponse.json({ error: portable.reason ?? "This skill cannot be downloaded." }, { status: 409 });
  }

  const download = createSkillDownload({
    slug: artifact.slug,
    name: artifact.name,
    version: artifact.approved_version,
    target: target as DownloadTarget,
    os: os as DownloadOs
  });

  if (hasSupabaseConfig() && !demo) {
    try {
      const supabase = createServerSupabase();
      await supabase.from("audit_events").insert({
        workspace_id: artifact.workspace_id,
        artifact_id: artifact.id,
        event_type: "skill_downloaded",
        metadata: { artifact_version_id: artifact.approved_version.id, target, os }
      });
    } catch {
      // An audit failure should never prevent an approved skill download.
    }
  }

  return new Response(download.content, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${download.filename}"`,
      "Cache-Control": "no-store"
    }
  });
}
