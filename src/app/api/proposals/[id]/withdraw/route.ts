import { NextResponse } from "next/server";
import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";
import { getViewerContext } from "@/lib/access";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseConfig()) return NextResponse.json({ error: "The service is temporarily unavailable." }, { status: 503 });
  const { id } = await params;
  const { user } = await getViewerContext();
  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc("withdraw_proposal", {
    p_proposal_id: id,
    p_actor_user_id: user.id,
    p_actor_email: user.email ?? ""
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json({ ok: true, ...(data ?? { proposalId: id, status: "withdrawn" }) });
}
