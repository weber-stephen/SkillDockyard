import { NextResponse } from "next/server";
import { acceptShareInvite } from "@/lib/shares";
import { getSupabaseErrorStatus } from "@/lib/supabase/errors";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const share = await acceptShareInvite(id);
    return NextResponse.json({ ok: true, share });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "We could not accept that invite." }, { status: getSupabaseErrorStatus(error) });
  }
}
