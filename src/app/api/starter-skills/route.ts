import { NextResponse } from "next/server";
import { ensurePersonalWorkspace, requireUser } from "@/lib/supabase/auth";
import { installStarterSkills } from "@/lib/starter-skills";
import { recordOnboardingMilestone } from "@/lib/onboarding";
import { getSupabaseErrorStatus } from "@/lib/supabase/errors";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST() {
  try {
    const user = await requireUser();
    const workspaceId = await ensurePersonalWorkspace(user);
    const { count: existingSkillCount, error: existingSkillCountError } = await createServerSupabase().from("artifacts").select("id", { count: "exact", head: true }).eq("created_by_user_id", user.id);
    if (existingSkillCountError) throw existingSkillCountError;
    const result = await installStarterSkills(user.id, workspaceId);
    await recordOnboardingMilestone(workspaceId, "starter");
    return NextResponse.json({ ...result, firstValue: (existingSkillCount ?? 0) === 0 && result.created.length > 0 }, { status: result.created.length ? 201 : 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Starter skills could not be added." }, { status: getSupabaseErrorStatus(error) });
  }
}
