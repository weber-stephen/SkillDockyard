import { NextResponse } from "next/server";
import { renameWorkspace } from "@/lib/workspace-admin";
import { getSupabaseErrorStatus } from "@/lib/supabase/errors";
export async function PATCH(request: Request) {
  try { const body = await request.json(); return NextResponse.json({ ok: true, workspace: await renameWorkspace(String(body.name ?? "")) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "We could not rename the workspace." }, { status: getSupabaseErrorStatus(error) }); }
}
