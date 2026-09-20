import { createServerSupabase } from "@/lib/supabase/server";
import { getViewerContext } from "@/lib/access";

export async function listNotifications() {
  const { user } = await getViewerContext();
  const supabase = createServerSupabase();
  const { data, error } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return data ?? [];
}
