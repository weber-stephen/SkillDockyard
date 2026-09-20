import { NextResponse } from "next/server";
import { acceptWorkspaceInvite } from "@/lib/workspace-admin";
import { getSupabaseErrorStatus } from "@/lib/supabase/errors";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    return NextResponse.json({ ok: true, result: await acceptWorkspaceInvite(String(token ?? "")) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "We could not accept that invitation." }, { status: getSupabaseErrorStatus(error) });
  }
}
