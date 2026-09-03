import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";
import { requireWorkspaceId } from "@/lib/supabase/auth";

export const onboardingPaths = ["share", "explore", "scan"] as const;
export type OnboardingPath = (typeof onboardingPaths)[number];

export interface OnboardingState {
  selectedPath: OnboardingPath | null;
  exploredDemoAt: string | null;
  firstSubmissionAt: string | null;
  firstScanAt: string | null;
  dismissedAt: string | null;
}

type OnboardingRow = {
  selected_path: OnboardingPath | null;
  explored_demo_at: string | null;
  first_submission_at: string | null;
  first_scan_at: string | null;
  dismissed_at: string | null;
};

const emptyState: OnboardingState = { selectedPath: null, exploredDemoAt: null, firstSubmissionAt: null, firstScanAt: null, dismissedAt: null };

function present(row: OnboardingRow | null): OnboardingState {
  if (!row) return emptyState;
  return { selectedPath: row.selected_path, exploredDemoAt: row.explored_demo_at, firstSubmissionAt: row.first_submission_at, firstScanAt: row.first_scan_at, dismissedAt: row.dismissed_at };
}

export function onboardingComplete(state: OnboardingState) {
  return Boolean(state.firstSubmissionAt || state.exploredDemoAt || state.firstScanAt);
}

export async function getOnboardingState(): Promise<OnboardingState> {
  if (!hasSupabaseConfig()) return emptyState;
  const workspaceId = await requireWorkspaceId();
  const { data, error } = await createServerSupabase().from("workspace_onboarding").select("selected_path, explored_demo_at, first_submission_at, first_scan_at, dismissed_at").eq("workspace_id", workspaceId).maybeSingle();
  if (error) throw error;
  return present(data as OnboardingRow | null);
}

export async function updateOnboarding(input: { path?: OnboardingPath; exploredDemo?: boolean; dismissed?: boolean }) {
  if (!hasSupabaseConfig()) return emptyState;
  const workspaceId = await requireWorkspaceId();
  const now = new Date().toISOString();
  const payload = {
    workspace_id: workspaceId,
    ...(input.path ? { selected_path: input.path } : {}),
    ...(input.exploredDemo ? { explored_demo_at: now } : {}),
    ...(typeof input.dismissed === "boolean" ? { dismissed_at: input.dismissed ? now : null } : {}),
    updated_at: now
  };
  const { data, error } = await createServerSupabase().from("workspace_onboarding").upsert(payload, { onConflict: "workspace_id" }).select("selected_path, explored_demo_at, first_submission_at, first_scan_at, dismissed_at").single();
  if (error) throw error;
  return present(data as OnboardingRow);
}

export async function recordOnboardingMilestone(workspaceId: string, milestone: "submission" | "scan") {
  if (!hasSupabaseConfig()) return;
  const now = new Date().toISOString();
  const field = milestone === "submission" ? "first_submission_at" : "first_scan_at";
  const { error } = await createServerSupabase().from("workspace_onboarding").upsert({ workspace_id: workspaceId, [field]: now, updated_at: now }, { onConflict: "workspace_id", ignoreDuplicates: false });
  if (error) throw error;
}
