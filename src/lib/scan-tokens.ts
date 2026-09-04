import crypto from "node:crypto";
import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";
import { requireWorkspaceId } from "@/lib/supabase/auth";
import { isMissingSupabaseSchemaError, schemaUnavailableMessage, SchemaUnavailableError } from "@/lib/supabase/errors";

function hashToken(token: string) { return crypto.createHash("sha256").update(token).digest("hex"); }

export async function createWorkspaceScanToken() {
  if (!hasSupabaseConfig()) throw new Error("Supabase is not configured.");
  const workspaceId = await requireWorkspaceId();
  const token = `sdw_${crypto.randomBytes(24).toString("base64url")}`;
  const { data, error } = await createServerSupabase().from("workspace_scan_tokens").insert({ workspace_id: workspaceId, token_hash: hashToken(token), token_hint: token.slice(-6) }).select("id, token_hint, created_at").single();
  if (error && isMissingSupabaseSchemaError(error)) throw new SchemaUnavailableError(schemaUnavailableMessage("Scan token creation"));
  if (error) throw error;
  return { ...data, token };
}

export async function listWorkspaceScanTokens() {
  if (!hasSupabaseConfig()) return [];
  const workspaceId = await requireWorkspaceId();
  const { data, error } = await createServerSupabase().from("workspace_scan_tokens").select("id, token_hint, created_at, revoked_at").eq("workspace_id", workspaceId).order("created_at", { ascending: false });
  if (error && isMissingSupabaseSchemaError(error)) return [];
  if (error) throw error;
  return data ?? [];
}

export async function revokeWorkspaceScanToken(id: string) {
  const workspaceId = await requireWorkspaceId();
  const { error } = await createServerSupabase().from("workspace_scan_tokens").update({ revoked_at: new Date().toISOString() }).eq("id", id).eq("workspace_id", workspaceId).is("revoked_at", null);
  if (error && isMissingSupabaseSchemaError(error)) throw new SchemaUnavailableError(schemaUnavailableMessage("Scan token revocation"));
  if (error) throw error;
}

export async function resolveWorkspaceForScanToken(token: string) {
  if (!hasSupabaseConfig() || !token) return null;
  const { data, error } = await createServerSupabase().from("workspace_scan_tokens").select("workspace_id").eq("token_hash", hashToken(token)).is("revoked_at", null).maybeSingle();
  if (error && isMissingSupabaseSchemaError(error)) return null;
  if (error) throw error;
  return data?.workspace_id ?? null;
}
