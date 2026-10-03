import { createServerSupabase } from "@/lib/supabase/server";
import { getViewerContext, computeArtifactPermission } from "@/lib/access";
import { isMissingSupabaseSchemaError, schemaUnavailableMessage, SchemaUnavailableError } from "@/lib/supabase/errors";
import type { ArtifactShare, SharePermission, ShareTargetType } from "@/lib/types";

export async function getArtifactShares(artifactId: string) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("artifact_shares")
    .select("*")
    .eq("artifact_id", artifactId)
    .order("created_at", { ascending: false });
  if (error && isMissingSupabaseSchemaError(error)) return [];
  if (error) throw error;
  return (data ?? []) as ArtifactShare[];
}

export async function getPendingInvites() {
  const { user } = await getViewerContext();
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("artifact_shares")
    .select("*")
    .eq("status", "pending")
    .eq("target_email", user.email ?? "");
  if (error && isMissingSupabaseSchemaError(error)) return [];
  if (error) throw error;
  const shares = (data ?? []) as ArtifactShare[];
  if (!shares.length) return [];

  const artifactIds = [...new Set(shares.map((share) => share.artifact_id))];
  const workspaceIds = [...new Set(shares.map((share) => share.source_workspace_id))];
  const [{ data: artifacts }, { data: workspaces }] = await Promise.all([
    supabase.from("artifacts").select("id, name").in("id", artifactIds),
    supabase.from("workspaces").select("id, name").in("id", workspaceIds)
  ]);
  const artifactMap = new Map((artifacts ?? []).map((artifact) => [artifact.id as string, artifact.name as string]));
  const workspaceMap = new Map((workspaces ?? []).map((workspace) => [workspace.id as string, workspace.name as string]));

  return shares.map((share) => ({
    ...share,
    artifact_name: artifactMap.get(share.artifact_id) ?? "Shared skill",
    source_workspace_name: workspaceMap.get(share.source_workspace_id) ?? "Another workspace"
  }));
}

export async function listSharableWorkspaces() {
  const { memberships, workspaces } = await getViewerContext();
  return workspaces
    .filter((workspace) => memberships.some((membership) => membership.workspace_id === workspace.id))
    .map((workspace) => ({
      id: workspace.id,
      name: workspace.name
    }));
}

export async function createShare(input: {
  artifactId: string;
  targetType: ShareTargetType;
  targetEmail?: string;
  targetWorkspaceId?: string;
  targetWorkspaceName?: string;
  permission: SharePermission;
}) {
  const { user, memberships, workspaces } = await getViewerContext();
  const supabase = createServerSupabase();
  const { data: artifact, error: artifactError } = await supabase
    .from("artifact_catalog")
    .select("*")
    .eq("id", input.artifactId)
    .single();
  if (artifactError || !artifact) throw new Error("Skill not found.");

  const shares = await getArtifactShares(input.artifactId);
  const permission = computeArtifactPermission({
    artifact,
    memberships,
    workspaces,
    shares,
    userId: user.id
  });
  if (!permission?.canManageShares) throw new Error("Only source workspace owners or reviewers can share this skill.");
  if (input.permission !== "propose" && input.permission !== "view") throw new Error("Choose a valid sharing permission.");

  const targetEmail = normalizeEmail(input.targetEmail);
  let resolvedTargetWorkspaceId = input.targetWorkspaceId ?? null;
  let resolvedTargetWorkspaceName = stringOrNull(input.targetWorkspaceName);
  if (input.targetType === "workspace" && resolvedTargetWorkspaceId) {
    const { data: targetWorkspace, error: targetWorkspaceError } = await supabase
      .from("workspaces")
      .select("id, name")
      .eq("id", resolvedTargetWorkspaceId)
      .maybeSingle();
    if (targetWorkspaceError) throw targetWorkspaceError;
    if (!targetWorkspace) throw new Error("That workspace could not be found.");
    resolvedTargetWorkspaceName = targetWorkspace.name as string;
  }
  if (input.targetType === "workspace" && !resolvedTargetWorkspaceId && targetEmail) {
    const { data: ownerMemberships, error: ownerMembershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .ilike("email", targetEmail)
      .eq("role", "owner");
    if (ownerMembershipError) throw ownerMembershipError;
    const workspaceIds = [...new Set((ownerMemberships ?? []).map((membership) => membership.workspace_id as string))];
    if (workspaceIds.length !== 1) {
      throw new Error(workspaceIds.length > 1
        ? "This owner belongs to multiple workspaces. Choose a specific workspace before inviting it."
        : "The workspace owner could not be matched to a workspace.");
    }
    resolvedTargetWorkspaceId = workspaceIds[0];
  }

  const payload: Record<string, string | null> = {
    artifact_id: input.artifactId,
    source_workspace_id: artifact.workspace_id,
    target_type: input.targetType,
    target_email: targetEmail,
    permission: input.permission,
    status: input.targetType === "workspace" && input.targetWorkspaceId ? "active" : "pending",
    created_by_user_id: user.id,
    target_user_id: null,
    target_workspace_id: input.targetType === "workspace" ? resolvedTargetWorkspaceId : null,
    target_workspace_name: input.targetType === "workspace" ? resolvedTargetWorkspaceName : null,
    activated_at: input.targetType === "workspace" && input.targetWorkspaceId ? new Date().toISOString() : null
  };

  if (input.targetType === "user" && !payload.target_email) throw new Error("Recipient email is required.");
  if (input.targetType === "workspace" && !payload.target_workspace_id && !payload.target_email) throw new Error("Choose a workspace or enter the workspace owner email.");

  const { data, error } = await supabase.rpc("create_artifact_share", {
    p_artifact_id: input.artifactId,
    p_actor_user_id: user.id,
    p_actor_email: user.email ?? "",
    p_target_type: input.targetType,
    p_target_email: payload.target_email,
    p_target_workspace_id: payload.target_workspace_id,
    p_target_workspace_name: payload.target_workspace_name,
    p_permission: input.permission,
    p_activate: payload.status === "active"
  });
  if (error && isMissingSupabaseSchemaError(error)) throw new SchemaUnavailableError(schemaUnavailableMessage("Sharing"));
  if (error) throw error;
  return data as ArtifactShare;
}

export async function acceptShareInvite(shareId: string) {
  const { user } = await getViewerContext();
  if (!user.email_confirmed_at) throw new Error("Confirm your email before accepting an invitation.");
  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc("respond_to_artifact_share", { p_share_id: shareId, p_actor_user_id: user.id, p_actor_email: user.email ?? "", p_accept: true });
  if (error) throw error;
  return data as ArtifactShare;
}

export async function declineShareInvite(shareId: string) {
  const { user } = await getViewerContext();
  if (!user.email_confirmed_at) throw new Error("Confirm your email before responding to an invitation.");
  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc("respond_to_artifact_share", { p_share_id: shareId, p_actor_user_id: user.id, p_actor_email: user.email ?? "", p_accept: false });
  if (error) throw error;
  return data as ArtifactShare;
}

export async function revokeShare(shareId: string) {
  const { user, memberships, workspaces } = await getViewerContext();
  const supabase = createServerSupabase();
  const { data: share, error } = await supabase.from("artifact_shares").select("*").eq("id", shareId).single();
  if (error || !share) throw new Error("Share not found.");
  const { data: artifact, error: artifactError } = await supabase.from("artifact_catalog").select("*").eq("id", share.artifact_id).single();
  if (artifactError || !artifact) throw new Error("Skill not found.");

  const permission = computeArtifactPermission({
    artifact,
    memberships,
    workspaces,
    shares: [share as ArtifactShare],
    userId: user.id
  });
  if (!permission?.canManageShares) throw new Error("Only source workspace owners or reviewers can revoke a share.");

  const { data, error: revokeError } = await supabase.rpc("revoke_artifact_share", { p_share_id: shareId, p_actor_user_id: user.id, p_actor_email: user.email ?? "" });
  if (revokeError) throw revokeError;
  return data as ArtifactShare;
}

function normalizeEmail(value: string | undefined) {
  const email = value?.trim().toLowerCase();
  return email || null;
}

function stringOrNull(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}
