import crypto from "node:crypto";
import { computeArtifactPermission } from "@/lib/access";
import { createServerSupabase } from "@/lib/supabase/server";
import { getArtifactShares } from "@/lib/shares";
import type { Artifact, ArtifactDetail, Workspace, WorkspaceMembership } from "@/lib/types";

const hash = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export interface CliIdentity { tokenId: string; userId: string; workspaceId: string }

export async function createCliPairingCode(userId: string, workspaceId: string) {
  const code = crypto.randomBytes(6).toString("hex").toUpperCase();
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
  const { error } = await createServerSupabase().from("cli_pairing_codes").insert({ user_id: userId, workspace_id: workspaceId, code_hash: hash(code), expires_at: expiresAt });
  if (error) throw error;
  return { code, expiresAt };
}

export async function exchangeCliPairingCode(code: string) {
  const supabase = createServerSupabase();
  const now = new Date().toISOString();
  const { data: pairing, error } = await supabase.from("cli_pairing_codes").update({ used_at: now }).eq("code_hash", hash(code.trim().toUpperCase())).is("used_at", null).gt("expires_at", now).select("user_id, workspace_id").maybeSingle();
  if (error) throw error;
  if (!pairing) return null;
  const token = `sdc_${crypto.randomBytes(32).toString("base64url")}`;
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60_000).toISOString();
  const { data, error: tokenError } = await supabase.from("cli_tokens").insert({ user_id: pairing.user_id, workspace_id: pairing.workspace_id, token_hash: hash(token), token_hint: token.slice(-6), expires_at: expiresAt }).select("id").single();
  if (tokenError) throw tokenError;
  return { token, tokenId: data.id as string, expiresAt };
}

export async function resolveCliToken(request: Request): Promise<CliIdentity | null> {
  const raw = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!raw?.startsWith("sdc_")) return null;
  const supabase = createServerSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("cli_tokens").select("id, user_id, workspace_id").eq("token_hash", hash(raw)).is("revoked_at", null).gt("expires_at", now).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  await supabase.from("cli_tokens").update({ last_used_at: now }).eq("id", data.id);
  return { tokenId: data.id, userId: data.user_id, workspaceId: data.workspace_id };
}

export async function listCliTokens(userId: string) {
  const { data, error } = await createServerSupabase().from("cli_tokens").select("id, token_hint, expires_at, last_used_at, revoked_at, created_at").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function revokeCliToken(userId: string, tokenId: string) {
  const { error } = await createServerSupabase().from("cli_tokens").update({ revoked_at: new Date().toISOString() }).eq("id", tokenId).eq("user_id", userId).is("revoked_at", null);
  if (error) throw error;
}

export async function getArtifactForCli(id: string, identity: CliIdentity): Promise<ArtifactDetail | null> {
  const supabase = createServerSupabase();
  const [{ data: artifact }, { data: memberships }, { data: workspaces }] = await Promise.all([
    supabase.from("artifact_catalog").select("*").eq("id", id).maybeSingle(),
    supabase.from("workspace_members").select("id, workspace_id, user_id, email, role, created_at").eq("user_id", identity.userId),
    supabase.from("workspaces").select("id, name, created_at")
  ]);
  if (!artifact) return null;
  const shares = await getArtifactShares(id);
  const permission = computeArtifactPermission({ artifact: artifact as Artifact, memberships: (memberships ?? []) as WorkspaceMembership[], workspaces: (workspaces ?? []) as Workspace[], shares, userId: identity.userId });
  if (!permission) return null;
  const { data: versions, error } = await supabase.from("artifact_versions").select("*").eq("artifact_id", id).order("created_at", { ascending: false });
  if (error) throw error;
  return {
    ...(artifact as Artifact),
    access_scope: permission.accessScope,
    can_propose_update: permission.canProposeUpdate,
    can_publish: false,
    can_manage_shares: false,
    can_edit_private: permission.canEditPrivate,
    source_workspace_name: permission.sourceWorkspaceName,
    source_share_id: permission.share?.id ?? null,
    current_version: versions?.find((item) => item.id === artifact.current_version_id) ?? null,
    approved_version: versions?.find((item) => item.id === artifact.approved_version_id) ?? null,
    risks: [], approvals: [], proposals: [], shares: []
  } as ArtifactDetail;
}
