import { NextResponse } from "next/server";
import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const supabase = createServerSupabase();
  const { artifactId, versionId, decision, note, reviewerName } = body;

  const { error: approvalError } = await supabase.from("approvals").insert({
    artifact_id: artifactId,
    artifact_version_id: versionId,
    reviewer_name: reviewerName,
    decision,
    note
  });

  if (approvalError) return NextResponse.json({ error: approvalError.message }, { status: 400 });

  const nextStatus = decision === "approved" ? "approved" : "deprecated";
  const { error: artifactError } = await supabase
    .from("artifacts")
    .update({
      status: nextStatus,
      current_version_id: versionId,
      approved_version_id: decision === "approved" ? versionId : undefined
    })
    .eq("id", artifactId);

  if (artifactError) return NextResponse.json({ error: artifactError.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
