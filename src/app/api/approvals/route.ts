import { NextResponse } from "next/server";
import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";
import { getArtifactDetail } from "@/lib/data";
import { getViewerContext } from "@/lib/access";
import { z } from "zod";
import { readJsonSchema } from "@/lib/request-body";

const approvalSchema = z.object({ artifactId: z.uuid(), versionId: z.uuid(), decision: z.enum(["approved", "deprecated"]), note: z.string().trim().max(4000).optional() }).strict();

export async function POST(request: Request) {
  if (new URL(request.url).searchParams.get("demo") === "1") return NextResponse.json({ ok: true, demo: true });
  const body = await readJsonSchema(request, approvalSchema, 8 * 1024);
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "The service is temporarily unavailable." }, { status: 503 });
  }

  const supabase = createServerSupabase();
  const { artifactId, versionId, decision, note } = body;
  const detail = await getArtifactDetail(artifactId);
  if (!detail) return NextResponse.json({ error: "Skill not found." }, { status: 404 });
  if (!detail.can_publish) {
    return NextResponse.json({ error: "Only the workspace owner or a reviewer can publish this skill." }, { status: 403 });
  }
  if (detail.current_version_id !== versionId) return NextResponse.json({ error: "That version is no longer the current submission. Refresh before deciding." }, { status: 409 });
  const { user } = await getViewerContext();
  const reviewerName = user.email ?? "Workspace reviewer";

  const { data, error } = await supabase.rpc("decide_legacy_artifact", {
    p_artifact_id: artifactId,
    p_version_id: versionId,
    p_actor_user_id: user.id,
    p_actor_email: reviewerName,
    p_decision: decision,
    p_note: note ?? null
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json({ ok: true, result: data });
}
