import { NextResponse } from "next/server";
import { createWorkspaceInvite } from "@/lib/workspace-admin";
import { getSupabaseErrorStatus } from "@/lib/supabase/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const role = body.role === "editor" || body.role === "reviewer" ? body.role : "viewer";
    const invite = await createWorkspaceInvite({ email: String(body.email ?? ""), role });
    return NextResponse.json({ ok: true, invite, inviteUrl: `/invite/${invite.token}` });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "We could not create that invitation." }, { status: getSupabaseErrorStatus(error) });
  }
}
