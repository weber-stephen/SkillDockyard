import { createServerSupabase } from "@/lib/supabase/server";
import { getViewerContext, computeArtifactPermission } from "@/lib/access";
import { isMissingSupabaseSchemaError, schemaUnavailableMessage, SchemaUnavailableError } from "@/lib/supabase/errors";
import type { ArtifactShare, SharePermission, ShareTargetType, Workspace } from "@/lib/types";

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

  const payload: Record<string, string | null> = {
    artifact_id: input.artifactId,
    source_workspace_id: artifact.workspace_id,
    target_type: input.targetType,
    target_email: normalizeEmail(input.targetEmail),
    permission: input.permission,
    status: input.targetType === "workspace" && input.targetWorkspaceId ? "active" : "pending",
    created_by_user_id: user.id,
    target_user_id: null,
    target_workspace_id: input.targetType === "workspace" ? input.targetWorkspaceId ?? null : null,
    target_workspace_name: input.targetType === "workspace" ? stringOrNull(input.targetWorkspaceName) : null,
    activated_at: input.targetType === "workspace" && input.targetWorkspaceId ? new Date().toISOString() : null
  };

  if (input.targetType === "user" && !payload.target_email) throw new Error("Recipient email is required.");
  if (input.targetType === "workspace" && !payload.target_workspace_id && !payload.target_email) throw new Error("Choose a workspace or enter the workspace owner email.");

  const { data, error } = await supabase.from("artifact_shares").insert(payload).select("*").single();
  if (error && isMissingSupabaseSchemaError(error)) throw new SchemaUnavailableError(schemaUnavailableMessage("Sharing"));
  if (error) throw error;
  await recordShareAudit(artifact.workspace_id, input.artifactId, user.email ?? "Unknown", "skill_shared", {
    shareId: data.id,
    targetType: input.targetType,
    targetEmail: "target_email" in payload ? payload.target_email : null,
    targetWorkspaceId: "target_workspace_id" in payload ? payload.target_workspace_id : null
  });
  return data as ArtifactShare;
}

export async function acceptShareInvite(shareId: string) {
  const { user, memberships } = await getViewerContext();
  const supabase = createServerSupabase();
  const { data: share, error } = await supabase.from("artifact_shares").select("*").eq("id", shareId).single();
  if (error || !share) throw new Error("Invite not found.");
  if (share.status !== "pending") throw new Error("This invite is no longer pending.");
  if ((share.target_email ?? "").toLowerCase() !== (user.email ?? "").toLowerCase()) throw new Error("This invite is not addressed to your account.");

  const updatePayload =
    share.target_type === "user"
      ? { status: "active", target_user_id: user.id, activated_at: new Date().toISOString() }
      : {
          status: "active",
          target_workspace_id: memberships[0]?.workspace_id ?? null,
          activated_at: new Date().toISOString()
        };

  if (share.target_type === "workspace" && !updatePayload.target_workspace_id) {
    throw new Error("You need a workspace before accepting this workspace share.");
  }

  const { data: updated, error: updateError } = await supabase.from("artifact_shares").update(updatePayload).eq("id", shareId).select("*").single();
  if (updateError) throw updateError;
  await recordShareAudit(share.source_workspace_id, share.artifact_id, user.email ?? "Unknown", "share_accepted", {
    shareId
  });
  return updated as ArtifactShare;
}

export async function declineShareInvite(shareId: string) {
  const { user } = await getViewerContext();
  const supabase = createServerSupabase();
  const { data: share, error } = await supabase.from("artifact_shares").select("*").eq("id", shareId).single();
  if (error || !share) throw new Error("Invite not found.");
  if ((share.target_email ?? "").toLowerCase() !== (user.email ?? "").toLowerCase()) throw new Error("This invite is not addressed to your account.");
  const { data: updated, error: updateError } = await supabase
    .from("artifact_shares")
    .update({ status: "declined", declined_at: new Date().toISOString() })
    .eq("id", shareId)
    .select("*")
    .single();
  if (updateError) throw updateError;
  await recordShareAudit(share.source_workspace_id, share.artifact_id, user.email ?? "Unknown", "share_declined", {
    shareId
  });
  return updated as ArtifactShare;
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

  const { data: updated, error: updateError } = await supabase
    .from("artifact_shares")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", shareId)
    .select("*")
    .single();
  if (updateError) throw updateError;
  await recordShareAudit(share.source_workspace_id, share.artifact_id, user.email ?? "Unknown", "share_revoked", {
    shareId
  });
  return updated as ArtifactShare;
}

async function recordShareAudit(workspaceId: string, artifactId: string, actorName: string, eventType: string, metadata: Record<string, unknown>) {
  await createServerSupabase().from("audit_events").insert({
    workspace_id: workspaceId,
    artifact_id: artifactId,
    actor_name: actorName,
    event_type: eventType,
    metadata
  });
}

function normalizeEmail(value: string | undefined) {
  const email = value?.trim().toLowerCase();
  return email || null;
}

function stringOrNull(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}
