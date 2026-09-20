import { NextResponse } from "next/server";
import { getArtifactForCli, resolveCliToken } from "@/lib/cli-auth";
import { createServerSupabase } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  const identity = await resolveCliToken(request);
  if (!identity) return NextResponse.json({ error: "Connect the Skill Dockyard CLI again." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { artifactId?: unknown; versionId?: unknown; contentHash?: unknown; deviceId?: unknown; target?: unknown };
  if (typeof body.artifactId !== "string" || typeof body.versionId !== "string" || typeof body.contentHash !== "string" || typeof body.deviceId !== "string" || !["codex", "claude-code"].includes(String(body.target))) return NextResponse.json({ error: "Installation details are invalid." }, { status: 400 });
  const artifact = await getArtifactForCli(body.artifactId, identity);
  const allowedVersion = artifact?.visibility === "private" ? artifact.current_version : artifact?.approved_version;
  if (!artifact || allowedVersion?.id !== body.versionId || allowedVersion.content_hash !== body.contentHash) return NextResponse.json({ error: "That version is not available to this account." }, { status: 403 });
  const now = new Date().toISOString();
  const { error } = await createServerSupabase().from("skill_installations").upsert({ user_id: identity.userId, artifact_id: artifact.id, artifact_version_id: body.versionId, device_id: body.deviceId, target: body.target, content_hash: body.contentHash, installed_at: now, checked_at: now }, { onConflict: "user_id,artifact_id,device_id,target" });
  if (error) throw error;
  return NextResponse.json({ ok: true });
}
