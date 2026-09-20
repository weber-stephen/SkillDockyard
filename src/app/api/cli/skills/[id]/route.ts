import { NextResponse } from "next/server";
import { getArtifactForCli, resolveCliToken } from "@/lib/cli-auth";
import { getPortableSkillContent, getPortableSkillStatus } from "@/lib/skill-download";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await resolveCliToken(request);
  if (!identity) return NextResponse.json({ error: "Connect the Skill Dockyard CLI again." }, { status: 401 });
  const artifact = await getArtifactForCli((await params).id, identity);
  if (!artifact) return NextResponse.json({ error: "Skill not found." }, { status: 404 });
  const status = getPortableSkillStatus(artifact);
  const version = artifact.visibility === "private" ? artifact.current_version : artifact.approved_version;
  if (!status.eligible || !version) return NextResponse.json({ error: status.reason ?? "This skill cannot be installed." }, { status: 409 });
  const target = new URL(request.url).searchParams.get("target");
  if (target !== "codex" && target !== "claude-code") return NextResponse.json({ error: "Choose codex or claude-code." }, { status: 400 });
  await createServerSupabase().from("skill_downloads").insert({ artifact_id: artifact.id, artifact_version_id: version.id, user_id: identity.userId, target, source: "cli" });
  return NextResponse.json({ artifactId: artifact.id, versionId: version.id, name: artifact.name, slug: artifact.slug, contentHash: version.content_hash, content: getPortableSkillContent(artifact) ?? version.content_snapshot });
}
