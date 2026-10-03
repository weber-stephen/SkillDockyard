import { NextResponse } from "next/server";
import { onboardingPaths, updateOnboarding, getOnboardingState } from "@/lib/onboarding";
import { getSupabaseErrorStatus } from "@/lib/supabase/errors";
import { z } from "zod";
import { readJsonSchema } from "@/lib/request-body";

const onboardingSchema = z.object({ path: z.enum(onboardingPaths).optional(), exploredDemo: z.boolean().optional(), dismissed: z.boolean().optional() }).strict();

export async function GET() {
  try { return NextResponse.json(await getOnboardingState()); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load setup progress." }, { status: getSupabaseErrorStatus(error, 500) }); }
}

export async function PUT(request: Request) {
  try {
    const body = await readJsonSchema(request, onboardingSchema, 2048);
    return NextResponse.json(await updateOnboarding(body));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save setup progress." }, { status: getSupabaseErrorStatus(error) }); }
}
