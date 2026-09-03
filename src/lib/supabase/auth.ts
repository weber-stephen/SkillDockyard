import { cookies } from "next/headers";
import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";

export class AuthenticationRequiredError extends Error {}

function getPublicKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export async function createAuthSupabase() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getPublicKey();
  if (!url || !key) throw new Error("Supabase authentication is not configured.");
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try { items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Proxy refreshes cookies. */ }
      }
    }
  });
}

export const requireUser = cache(async (): Promise<User> => {
  const supabase = await createAuthSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new AuthenticationRequiredError();
  return data.user;
});

export const getCurrentUser = cache(async () => {
  try { return await requireUser(); } catch { return null; }
});

export const ensurePersonalWorkspace = cache(async (user: User) => {
  if (!hasSupabaseConfig()) throw new Error("Supabase data is not configured.");
  const supabase = createServerSupabase();
  const { data: existing, error: existingError } = await supabase.from("workspaces").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (existingError) throw existingError;
  if (existing?.id) return existing.id as string;

  const name = `${(user.email ?? "My").split("@")[0]} workspace`;
  const { data: created, error: createError } = await supabase.from("workspaces").insert({ name, owner_user_id: user.id }).select("id").single();
  if (createError) {
    const { data: raced, error: racedError } = await supabase.from("workspaces").select("id").eq("owner_user_id", user.id).single();
    if (racedError || !raced) throw createError;
    return raced.id as string;
  }
  const workspaceId = created.id as string;
  const { error: memberError } = await supabase.from("workspace_members").upsert({ workspace_id: workspaceId, user_id: user.id, email: user.email, role: "owner" }, { onConflict: "workspace_id,user_id" });
  if (memberError) throw memberError;
  return workspaceId;
});

export const requireWorkspaceId = cache(async () => {
  return ensurePersonalWorkspace(await requireUser());
});
