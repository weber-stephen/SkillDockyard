import { NextResponse } from "next/server";
import { z } from "zod";
import { recordCurrentLegalAcceptance } from "@/lib/legal-acceptance";
import { readJsonSchema } from "@/lib/request-body";
import { requireUser } from "@/lib/supabase/auth";

const acceptanceSchema = z.object({ acceptedTerms: z.literal(true), acceptedPrivacy: z.literal(true) }).strict();

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await readJsonSchema(request, acceptanceSchema, 1024);
    await recordCurrentLegalAcceptance(user.id, "reacceptance");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "We could not save your acknowledgement. Please try again." }, { status: 400 });
  }
}
