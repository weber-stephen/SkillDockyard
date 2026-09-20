import { NextResponse } from "next/server";
import { getArtifactDetail, getDemoArtifactDetail } from "@/lib/data";
import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";
import { getPortableSkillContent, getPortableSkillStatus, type DownloadOs, type DownloadTarget } from "@/lib/skill-download";
import { createSkillDownload } from "@/lib/skill-download-server";
import { getArtifactForCli, resolveCliToken } from "@/lib/cli-auth";
import { getCurrentUser } from "@/lib/supabase/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const demo = new URL(request.url).searchParams.get("demo") === "1";
  const cliIdentity = demo ? null : await resolveCliToken(request);
  const artifact = demo ? getDemoArtifactDetail(id) : cliIdentity ? await getArtifactForCli(id, cliIdentity) : await getArtifactDetail(id);
  if (!artifact) return NextResponse.json({ error: "Skill not found" }, { status: 404 });

  const target = new URL(request.url).searchParams.get("target");
  const os = new URL(request.url).searchParams.get("os");
  if ((target !== "codex" && target !== "claude-code") || (os !== "mac" && os !== "windows")) {
    return NextResponse.json({ error: "Choose Codex or Claude Code, and Mac or Windows." }, { status: 400 });
  }

  const portable = getPortableSkillStatus(artifact);
  const downloadVersion = artifact.visibility === "private" ? artifact.current_version : artifact.approved_version;
  if (!portable.eligible || !downloadVersion) {
    return NextResponse.json({ error: portable.reason ?? "This skill cannot be downloaded." }, { status: 409 });
  }

  const download = createSkillDownload({
    slug: artifact.slug,
    name: artifact.name,
    version: { ...downloadVersion, content_snapshot: getPortableSkillContent(artifact) ?? downloadVersion.content_snapshot },
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
        metadata: { artifact_version_id: downloadVersion.id, target, os }
      });
      const userId = cliIdentity?.userId ?? (await getCurrentUser())?.id ?? null;
      await supabase.from("skill_downloads").insert({ artifact_id: artifact.id, artifact_version_id: downloadVersion.id, user_id: userId, target, source: cliIdentity ? "cli" : "browser" });
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
