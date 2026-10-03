import { NextResponse } from "next/server";
import { createShare } from "@/lib/shares";
import { getSupabaseErrorStatus } from "@/lib/supabase/errors";
import { z } from "zod";
import { readJsonSchema } from "@/lib/request-body";
import { requireUser } from "@/lib/supabase/auth";
import { actionRateLimit } from "@/lib/api-rate-limit";

const shareSchema = z.object({ artifactId: z.uuid(), targetType: z.enum(["user", "workspace"]), targetEmail: z.email().max(320).optional(), targetWorkspaceId: z.uuid().optional(), targetWorkspaceName: z.string().trim().max(120).optional(), permission: z.enum(["view", "propose"]) }).strict();

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const limited = await actionRateLimit("share", user.id, 15);
    if (limited) return limited;
    const body = await readJsonSchema(request, shareSchema, 4096);
    const share = await createShare({
      artifactId: body.artifactId,
      targetType: body.targetType,
      targetEmail: body.targetEmail,
      targetWorkspaceId: body.targetWorkspaceId,
      targetWorkspaceName: body.targetWorkspaceName,
      permission: body.permission
    });
    return NextResponse.json({ ok: true, share });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "We could not create that share." }, { status: getSupabaseErrorStatus(error) });
  }
}
