import { NextResponse } from "next/server";
import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";
import { getArtifactDetail } from "@/lib/data";

export async function POST(request: Request) {
  if (new URL(request.url).searchParams.get("demo") === "1") return NextResponse.json({ ok: true, demo: true });
  const body = await request.json();
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const supabase = createServerSupabase();
  const { artifactId, versionId, decision, note, reviewerName } = body;
  if (!artifactId || !versionId) {
    return NextResponse.json({ error: "artifactId and versionId are required." }, { status: 400 });
  }
  if (decision !== "approved" && decision !== "deprecated") {
    return NextResponse.json({ error: "decision must be approved or deprecated." }, { status: 400 });
  }
  if (typeof reviewerName !== "string" || !reviewerName.trim()) {
    return NextResponse.json({ error: "reviewerName is required." }, { status: 400 });
  }

  const detail = await getArtifactDetail(artifactId);
  if (!detail) return NextResponse.json({ error: "Artifact not found." }, { status: 404 });
  if (!detail.can_publish) {
    return NextResponse.json({ error: "Only source workspace owners or reviewers can publish this skill." }, { status: 403 });
  }

  const { data: artifact, error: artifactLookupError } = await supabase
    .from("artifacts")
    .select("id, workspace_id")
    .eq("id", artifactId)
    .single();
  if (artifactLookupError) return NextResponse.json({ error: artifactLookupError.message }, { status: 404 });

  const { data: version, error: versionLookupError } = await supabase
    .from("artifact_versions")
    .select("id")
    .eq("id", versionId)
    .eq("artifact_id", artifactId)
    .maybeSingle();
  if (versionLookupError) return NextResponse.json({ error: versionLookupError.message }, { status: 400 });
  if (!version) return NextResponse.json({ error: "That version does not belong to this skill." }, { status: 404 });

  const { error: approvalError } = await supabase.from("approvals").insert({
    artifact_id: artifactId,
    artifact_version_id: versionId,
    reviewer_name: reviewerName.trim(),
    decision,
    note: typeof note === "string" && note.trim() ? note.trim() : null
  });

  if (approvalError) return NextResponse.json({ error: approvalError.message }, { status: 400 });

  const nextStatus = decision === "approved" ? "approved" : "deprecated";
  const updatePayload = {
    status: nextStatus,
    current_version_id: versionId,
    ...(decision === "approved" ? { approved_version_id: versionId } : {})
  };
  const { error: artifactError } = await supabase
    .from("artifacts")
    .update(updatePayload)
    .eq("id", artifactId);

  if (artifactError) return NextResponse.json({ error: artifactError.message }, { status: 400 });
  const { error: versionError } = await supabase.from("artifact_versions").update({ status: nextStatus }).eq("id", versionId).eq("artifact_id", artifactId);
  if (versionError) return NextResponse.json({ error: versionError.message }, { status: 400 });

  await supabase.from("audit_events").insert({
    workspace_id: artifact.workspace_id,
    artifact_id: artifactId,
    actor_name: reviewerName.trim(),
    event_type: decision,
    metadata: { versionId, note: typeof note === "string" ? note : null }
  });

  return NextResponse.json({ ok: true });
}
