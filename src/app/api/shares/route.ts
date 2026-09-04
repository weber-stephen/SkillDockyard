import { NextResponse } from "next/server";
import { createShare } from "@/lib/shares";
import { getSupabaseErrorStatus } from "@/lib/supabase/errors";

export async function POST(request: Request) {
  const body = await request.json();
  if (body.permission !== "view" && body.permission !== "propose") {
    return NextResponse.json({ error: "Choose whether the recipient can propose updates or view only." }, { status: 400 });
  }
  try {
    const share = await createShare({
      artifactId: String(body.artifactId ?? ""),
      targetType: body.targetType === "workspace" ? "workspace" : "user",
      targetEmail: typeof body.targetEmail === "string" ? body.targetEmail : undefined,
      targetWorkspaceId: typeof body.targetWorkspaceId === "string" && body.targetWorkspaceId ? body.targetWorkspaceId : undefined,
      targetWorkspaceName: typeof body.targetWorkspaceName === "string" ? body.targetWorkspaceName : undefined,
      permission: body.permission
    });
    return NextResponse.json({ ok: true, share });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "We could not create that share." }, { status: getSupabaseErrorStatus(error) });
  }
}
