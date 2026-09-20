import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/auth";
import { listCliTokens, revokeCliToken } from "@/lib/cli-auth";

export async function GET() {
  const user = await requireUser();
  return NextResponse.json({ tokens: await listCliTokens(user.id) });
}

export async function DELETE(request: Request) {
  const user = await requireUser();
  const body = await request.json().catch(() => ({})) as { id?: unknown };
  if (typeof body.id !== "string") return NextResponse.json({ error: "A connection id is required." }, { status: 400 });
  await revokeCliToken(user.id, body.id);
  return NextResponse.json({ ok: true });
}
