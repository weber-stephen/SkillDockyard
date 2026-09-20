import { NextResponse } from "next/server";
import { ensurePersonalWorkspace, requireUser } from "@/lib/supabase/auth";
import { installStarterSkills } from "@/lib/starter-skills";
import { recordOnboardingMilestone } from "@/lib/onboarding";
import { getSupabaseErrorStatus } from "@/lib/supabase/errors";

export async function POST() {
  try {
    const user = await requireUser();
    const workspaceId = await ensurePersonalWorkspace(user);
    const result = await installStarterSkills(user.id, workspaceId);
    await recordOnboardingMilestone(workspaceId, "starter");
    return NextResponse.json(result, { status: result.created.length ? 201 : 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Starter skills could not be added." }, { status: getSupabaseErrorStatus(error) });
  }
}
