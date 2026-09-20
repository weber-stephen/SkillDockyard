import { NextResponse } from "next/server";
import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";
import { getViewerContext } from "@/lib/access";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseConfig()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { id } = await params;
  const { user } = await getViewerContext();
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("proposals")
    .update({ status: "withdrawn", resolved_by_user_id: user.id, resolved_at: new Date().toISOString(), resolution_note: "Withdrawn by submitter." })
    .eq("id", id)
    .eq("submitted_by_user_id", user.id)
    .eq("status", "pending_review")
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Only pending proposals you submitted can be withdrawn." }, { status: 409 });
  return NextResponse.json({ ok: true, proposalId: id, status: "withdrawn" });
}
