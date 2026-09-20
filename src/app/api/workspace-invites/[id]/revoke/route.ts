import { NextResponse } from "next/server";
import { revokeWorkspaceInvite } from "@/lib/workspace-admin";
import { getSupabaseErrorStatus } from "@/lib/supabase/errors";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { return NextResponse.json({ ok: true, result: await revokeWorkspaceInvite((await params).id) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "We could not revoke that invitation." }, { status: getSupabaseErrorStatus(error) }); }
}
