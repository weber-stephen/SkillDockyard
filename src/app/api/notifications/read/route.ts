import { NextResponse } from "next/server";
import { getViewerContext } from "@/lib/access";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST() {
  const { user } = await getViewerContext();
  const { error } = await createServerSupabase().from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
