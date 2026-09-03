import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import type { Artifact, ArtifactAccessScope, ArtifactShare, Workspace, WorkspaceMembership, WorkspaceRole } from "@/lib/types";

export interface ViewerContext {
  user: User;
  memberships: WorkspaceMembership[];
  workspaces: Workspace[];
}

export interface ArtifactPermission {
  accessScope: ArtifactAccessScope;
  canProposeUpdate: boolean;
  canPublish: boolean;
  canManageShares: boolean;
  sourceWorkspaceName: string | null;
  share: ArtifactShare | null;
}

export const getViewerContext = cache(async (): Promise<ViewerContext> => {
  const user = await requireUser();
  const supabase = createServerSupabase();
  const { data: memberships, error } = await supabase
    .from("workspace_members")
    .select("id, workspace_id, user_id, email, role, created_at")
    .eq("user_id", user.id);
  if (error) throw error;

  const workspaceIds = [...new Set((memberships ?? []).map((item) => item.workspace_id as string))];
  const workspaces = workspaceIds.length
    ? await loadWorkspaces(workspaceIds)
    : [];

  return {
    user,
    memberships: (memberships ?? []) as WorkspaceMembership[],
    workspaces
  };
});

async function loadWorkspaces(workspaceIds: string[]) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.from("workspaces").select("id, name, created_at").in("id", workspaceIds);
  if (error) throw error;
  return (data ?? []) as Workspace[];
}

export function canPublishRole(role: WorkspaceRole) {
  return role === "owner" || role === "reviewer";
}

export function computeArtifactPermission(input: {
  artifact: Artifact;
  memberships: WorkspaceMembership[];
  workspaces: Workspace[];
  shares: ArtifactShare[];
  userId: string;
}) {
  const membership = input.memberships.find((item) => item.workspace_id === input.artifact.workspace_id) ?? null;
  const sourceWorkspace = input.workspaces.find((workspace) => workspace.id === input.artifact.workspace_id) ?? null;

  if (membership) {
    return {
      accessScope: "owned_workspace",
      canProposeUpdate: true,
      canPublish: canPublishRole(membership.role),
      canManageShares: canPublishRole(membership.role),
      sourceWorkspaceName: sourceWorkspace?.name ?? null,
      share: null
    } satisfies ArtifactPermission;
  }

  const membershipWorkspaceIds = new Set(input.memberships.map((item) => item.workspace_id));
  const activeShare =
    input.shares.find((share) => share.status === "active" && share.target_user_id === input.userId) ??
    input.shares.find((share) => share.status === "active" && share.target_workspace_id && membershipWorkspaceIds.has(share.target_workspace_id));

  if (!activeShare) return null;

  return {
    accessScope: activeShare.target_type === "user" ? "shared_user" : "shared_workspace",
    canProposeUpdate: activeShare.permission === "propose",
    canPublish: false,
    canManageShares: false,
    sourceWorkspaceName: sourceWorkspace?.name ?? null,
    share: activeShare
  } satisfies ArtifactPermission;
}
