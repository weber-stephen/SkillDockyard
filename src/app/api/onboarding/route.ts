import { NextResponse } from "next/server";
import { onboardingPaths, updateOnboarding, getOnboardingState } from "@/lib/onboarding";
import { getSupabaseErrorStatus } from "@/lib/supabase/errors";

export async function GET() {
  try { return NextResponse.json(await getOnboardingState()); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load setup progress." }, { status: getSupabaseErrorStatus(error, 500) }); }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as { path?: string; exploredDemo?: boolean; dismissed?: boolean };
    if (body.path && !onboardingPaths.includes(body.path as (typeof onboardingPaths)[number])) return NextResponse.json({ error: "Unknown setup path." }, { status: 400 });
    return NextResponse.json(await updateOnboarding({ path: body.path as (typeof onboardingPaths)[number] | undefined, exploredDemo: body.exploredDemo === true, dismissed: typeof body.dismissed === "boolean" ? body.dismissed : undefined }));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save setup progress." }, { status: getSupabaseErrorStatus(error) }); }
}
