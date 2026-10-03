import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/auth";
import { listCliTokens, revokeCliToken } from "@/lib/cli-auth";
import { z } from "zod";
import { readJsonSchema } from "@/lib/request-body";
const tokenIdSchema = z.object({ id: z.uuid() }).strict();

export async function GET() {
  const user = await requireUser();
  return NextResponse.json({ tokens: await listCliTokens(user.id) });
}

export async function DELETE(request: Request) {
  const user = await requireUser();
  const body = await readJsonSchema(request, tokenIdSchema, 1024);
  await revokeCliToken(user.id, body.id);
  return NextResponse.json({ ok: true });
}
