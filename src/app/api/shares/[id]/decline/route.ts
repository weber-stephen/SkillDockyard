import { NextResponse } from "next/server";
import { declineShareInvite } from "@/lib/shares";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const share = await declineShareInvite(id);
    return NextResponse.json({ ok: true, share });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "We could not decline that invite." }, { status: 400 });
  }
}
