import { createHash, randomBytes } from "node:crypto";
import { requireUser, requireWorkspaceId } from "@/lib/supabase/auth";
import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";
import { isMissingSupabaseSchemaError } from "@/lib/supabase/errors";
import type { WorkspaceInvite, WorkspaceInviteStatus, WorkspaceMembership, WorkspaceRole } from "@/lib/types";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function getWorkspaceAdminData() {
  if (!hasSupabaseConfig()) return null;
  const user = await requireUser();
  const workspaceId = await requireWorkspaceId();
  const supabase = createServerSupabase();
  const [{ data: workspace, error: workspaceError }, { data: members, error: membersError }, { data: invites, error: invitesError }] = await Promise.all([
    supabase.from("workspaces").select("id, name, owner_user_id").eq("id", workspaceId).single(),
    supabase.from("workspace_members").select("id, workspace_id, user_id, email, role, created_at").eq("workspace_id", workspaceId).order("created_at", { ascending: true }),
    supabase.from("workspace_invites").select("id, workspace_id, email, role, status, expires_at, invited_by_user_id, created_at").eq("workspace_id", workspaceId).eq("status", "pending").order("created_at", { ascending: false })
  ]);
  if (workspaceError) throw workspaceError;
  if (membersError) throw membersError;
  if (invitesError && !isMissingSupabaseSchemaError(invitesError)) throw invitesError;

  const memberships = (members ?? []) as WorkspaceMembership[];
  const ownerMemberships = memberships.filter((member) => member.role === "owner");
  const currentMembership = memberships.find((member) => member.user_id === user.id) ?? null;
  const consistent = Boolean(workspace.owner_user_id && ownerMemberships.length === 1 && ownerMemberships[0]?.user_id === workspace.owner_user_id);

  return {
    workspace: { id: workspace.id as string, name: workspace.name as string, owner_user_id: workspace.owner_user_id as string | null },
    members: memberships,
    invites: invitesError ? [] : (invites ?? []) as WorkspaceInvite[],
    currentMembership,
    isOwner: consistent && currentMembership?.role === "owner",
    consistent
  };
}

export async function createWorkspaceInvite(input: { email: string; role: Exclude<WorkspaceRole, "owner"> }) {
  if (!hasSupabaseConfig()) throw new Error("Supabase is not configured.");
  const user = await requireUser();
  const workspaceId = await requireWorkspaceId();
  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) throw new Error("Enter a valid email address.");
  const rawToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();
  const { data, error } = await createServerSupabase().rpc("invite_workspace_member", {
    p_workspace_id: workspaceId,
    p_actor_user_id: user.id,
    p_actor_email: user.email ?? "",
    p_email: email,
    p_role: input.role,
    p_token_hash: hashToken(rawToken),
    p_expires_at: expiresAt
  });
  if (error) throw error;
  const result = data as { id: string; workspaceId: string; email: string; role: Exclude<WorkspaceRole, "owner">; expiresAt: string };
  return { ...result, token: rawToken };
}

export async function getWorkspaceInviteByToken(token: string) {
  if (!hasSupabaseConfig() || !token.trim()) return null;
  const { data, error } = await createServerSupabase().from("workspace_invites").select("id, workspace_id, email, role, status, expires_at, invited_by_user_id, created_at").eq("token_hash", hashToken(token.trim())).maybeSingle();
  if (error) {
    if (isMissingSupabaseSchemaError(error)) return null;
    throw error;
  }
  if (!data) return null;
  const { data: workspace, error: workspaceError } = await createServerSupabase().from("workspaces").select("name").eq("id", data.workspace_id).single();
  if (workspaceError) throw workspaceError;
  return { ...(data as WorkspaceInvite), workspace_name: workspace.name as string };
}

export async function getPendingWorkspaceInvites() {
  if (!hasSupabaseConfig()) return [];
  const user = await requireUser();
  const email = normalizeEmail(user.email ?? "");
  const { data, error } = await createServerSupabase().from("workspace_invites").select("id, workspace_id, email, role, status, expires_at, invited_by_user_id, created_at").eq("email", email).eq("status", "pending").order("created_at", { ascending: false });
  if (error) {
    if (isMissingSupabaseSchemaError(error)) return [];
    throw error;
  }
  const invites = (data ?? []) as WorkspaceInvite[];
  if (!invites.length) return [];
  const workspaceIds = [...new Set(invites.map((invite) => invite.workspace_id))];
  const { data: workspaces, error: workspaceError } = await createServerSupabase().from("workspaces").select("id, name").in("id", workspaceIds);
  if (workspaceError) throw workspaceError;
  const names = new Map((workspaces ?? []).map((workspace) => [workspace.id as string, workspace.name as string]));
  return invites.map((invite) => ({ ...invite, workspace_name: names.get(invite.workspace_id) ?? "Workspace" }));
}

export async function acceptWorkspaceInvite(token: string) {
  if (!hasSupabaseConfig()) throw new Error("Supabase is not configured.");
  const user = await requireUser();
  if (!token.trim()) throw new Error("Invitation token is required.");
  const { data, error } = await createServerSupabase().rpc("accept_workspace_invite", { p_token_hash: hashToken(token.trim()), p_actor_user_id: user.id, p_actor_email: user.email ?? "" });
  if (error) throw error;
  return data as { inviteId: string; workspaceId: string; role: Exclude<WorkspaceRole, "owner"> };
}

export async function acceptWorkspaceInviteById(inviteId: string) {
  if (!hasSupabaseConfig()) throw new Error("Supabase is not configured.");
  const user = await requireUser();
  const { data, error } = await createServerSupabase().rpc("accept_workspace_invite_by_id", { p_invite_id: inviteId, p_actor_user_id: user.id, p_actor_email: user.email ?? "" });
  if (error) throw error;
  return data as { inviteId: string; workspaceId: string; role: Exclude<WorkspaceRole, "owner"> };
}

export async function declineWorkspaceInvite(inviteId: string) {
  if (!hasSupabaseConfig()) throw new Error("Supabase is not configured.");
  const user = await requireUser();
  const { data, error } = await createServerSupabase().rpc("decline_workspace_invite", { p_invite_id: inviteId, p_actor_user_id: user.id, p_actor_email: user.email ?? "" });
  if (error) throw error;
  return data as { id: string; status: WorkspaceInviteStatus };
}

export async function revokeWorkspaceInvite(inviteId: string) {
  if (!hasSupabaseConfig()) throw new Error("Supabase is not configured.");
  const user = await requireUser();
  const { data, error } = await createServerSupabase().rpc("revoke_workspace_invite", { p_invite_id: inviteId, p_actor_user_id: user.id, p_actor_email: user.email ?? "" });
  if (error) throw error;
  return data as { id: string; status: WorkspaceInviteStatus };
}

export async function renameWorkspace(name: string) {
  if (!hasSupabaseConfig()) throw new Error("Supabase is not configured.");
  const user = await requireUser();
  const workspaceId = await requireWorkspaceId();
  const { data, error } = await createServerSupabase().rpc("rename_workspace", { p_workspace_id: workspaceId, p_actor_user_id: user.id, p_actor_email: user.email ?? "", p_name: name });
  if (error) throw error;
  return data as { id: string; name: string };
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
