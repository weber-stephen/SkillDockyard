import { cookies } from "next/headers";
import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication is required.");
    this.name = "AuthenticationRequiredError";
  }
}

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
  const name = `${(user.email ?? "My").split("@")[0]} workspace`;
  const { data, error } = await supabase.rpc("ensure_personal_workspace", {
    p_user_id: user.id,
    p_user_email: user.email ?? "",
    p_workspace_name: name
  });
  if (error) throw error;
  if (typeof data !== "string") throw new Error("Personal workspace provisioning returned an invalid result.");
  return data;
});

export const requireWorkspaceId = cache(async () => {
  return ensurePersonalWorkspace(await requireUser());
});
