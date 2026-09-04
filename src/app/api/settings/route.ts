import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/settings";
import { getSupabaseErrorStatus } from "@/lib/supabase/errors";

export async function GET() {
  try {
    return NextResponse.json(await getSettings());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load settings." }, { status: getSupabaseErrorStatus(error, 500) });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json(await updateSettings(body));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save settings." }, { status: getSupabaseErrorStatus(error) });
  }
}
