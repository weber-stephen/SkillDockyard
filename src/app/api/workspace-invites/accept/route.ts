import { NextResponse } from "next/server";
import { acceptWorkspaceInvite } from "@/lib/workspace-admin";
import { getSupabaseErrorStatus } from "@/lib/supabase/errors";
import { z } from "zod";
import { readJsonSchema } from "@/lib/request-body";
const acceptSchema = z.object({ token: z.string().trim().min(20).max(200) }).strict();

export async function POST(request: Request) {
  try {
    const { token } = await readJsonSchema(request, acceptSchema, 1024);
    return NextResponse.json({ ok: true, result: await acceptWorkspaceInvite(token) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "We could not accept that invitation." }, { status: getSupabaseErrorStatus(error) });
  }
}
