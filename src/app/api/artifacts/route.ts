import { NextResponse } from "next/server";
import { listArtifacts } from "@/lib/data";
import { getSupabaseErrorStatus } from "@/lib/supabase/errors";

export async function GET() {
  try {
    return NextResponse.json(await listArtifacts());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load skills." }, { status: getSupabaseErrorStatus(error, 500) });
  }
}
