import { createClient } from "@supabase/supabase-js";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (process.env.PILOT_INVITATIONS_ENABLED !== "true") {
    throw new Error("Pilot invitations are disabled. Obtain counsel approval, complete the checklist, then set PILOT_INVITATIONS_ENABLED=true in the controlled operator environment.");
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Usage: npm run pilot:invite -- person@example.com");
  if (!siteUrl || !url || !serviceRoleKey) throw new Error("NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY are required.");

  const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const redirectTo = new URL("/auth/confirm?next=/reset-password", siteUrl).toString();
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (error) throw error;

  console.log(`Pilot invitation sent to ${email}. Record the invitation in the private pilot register.`);
}

void main();
