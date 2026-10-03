import { NextResponse } from "next/server";
import { createWorkspaceInvite } from "@/lib/workspace-admin";
import { getSupabaseErrorStatus } from "@/lib/supabase/errors";
import { z } from "zod";
import { readJsonSchema } from "@/lib/request-body";
import { requireUser } from "@/lib/supabase/auth";
import { actionRateLimit } from "@/lib/api-rate-limit";
const inviteSchema = z.object({ email: z.email().max(320), role: z.enum(["viewer", "editor", "reviewer"]).default("viewer") }).strict();

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const limited = await actionRateLimit("workspace-invite", user.id, 10);
    if (limited) return limited;
    const body = await readJsonSchema(request, inviteSchema, 2048);
    const invite = await createWorkspaceInvite(body);
    return NextResponse.json({ ok: true, invite, inviteUrl: `/invite/${invite.token}` });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "We could not create that invitation." }, { status: getSupabaseErrorStatus(error) });
  }
}
