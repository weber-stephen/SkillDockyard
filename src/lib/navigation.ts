import { createServerSupabase } from "@/lib/supabase/server";
import { getViewerContext } from "@/lib/access";
import { isMissingSupabaseSchemaError } from "@/lib/supabase/errors";

export interface AppNavigationState {
  canReview: boolean;
  pendingReviewCount: number;
  pendingInviteCount: number;
  unreadNotificationCount: number;
  workspaceName: string | null;
}

export async function getAppNavigationState(): Promise<AppNavigationState> {
  const { user, memberships, workspaces } = await getViewerContext();
  const workspaceIds = memberships.map((membership) => membership.workspace_id);
  const canReview = memberships.some((membership) => membership.role === "owner" || membership.role === "reviewer");
  const supabase = createServerSupabase();

  const [pendingReviewCount, artifactInviteCount, workspaceInviteCount, unreadNotificationCount] = await Promise.all([
    countRows(canReview && workspaceIds.length ? supabase.from("proposals").select("id", { count: "exact", head: true }).in("workspace_id", workspaceIds).eq("status", "pending_review") : null),
    countRows(supabase.from("artifact_shares").select("id", { count: "exact", head: true }).eq("status", "pending").eq("target_email", user.email ?? "")),
    countRows(supabase.from("workspace_invites").select("id", { count: "exact", head: true }).eq("status", "pending").eq("email", (user.email ?? "").trim().toLowerCase())),
    countRows(supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null))
  ]);

  return {
    canReview,
    pendingReviewCount,
    pendingInviteCount: artifactInviteCount + workspaceInviteCount,
    unreadNotificationCount,
    workspaceName: workspaces[0]?.name ?? null
  };
}

async function countRows(query: PromiseLike<{ count: number | null; error: { code?: string } | null }> | null) {
  if (!query) return 0;
  const result = await query;
  if (result.error && !isMissingSupabaseSchemaError(result.error)) throw result.error;
  return result.count ?? 0;
}
