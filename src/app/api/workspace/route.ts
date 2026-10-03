import { NextResponse } from "next/server";
import { renameWorkspace } from "@/lib/workspace-admin";
import { getSupabaseErrorStatus } from "@/lib/supabase/errors";
import { z } from "zod";
import { readJsonSchema } from "@/lib/request-body";
const renameSchema = z.object({ name: z.string().trim().min(1).max(120) }).strict();
export async function PATCH(request: Request) {
  try { const body = await readJsonSchema(request, renameSchema, 2048); return NextResponse.json({ ok: true, workspace: await renameWorkspace(body.name) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "We could not rename the workspace." }, { status: getSupabaseErrorStatus(error) }); }
}
