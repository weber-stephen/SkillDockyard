import { NextResponse } from "next/server";
import { ensurePersonalWorkspace, requireUser } from "@/lib/supabase/auth";
import { createCliPairingCode } from "@/lib/cli-auth";
import { getSupabaseErrorStatus } from "@/lib/supabase/errors";
import { actionRateLimit } from "@/lib/api-rate-limit";

export async function POST() {
  try {
    const user = await requireUser();
    const limited = await actionRateLimit("pairing-code", user.id, 5);
    if (limited) return limited;
    return NextResponse.json(await createCliPairingCode(user.id, await ensurePersonalWorkspace(user)), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create a pairing code." }, { status: getSupabaseErrorStatus(error) });
  }
}
