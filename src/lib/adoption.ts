import { getViewerContext } from "@/lib/access";
import { createServerSupabase } from "@/lib/supabase/server";
import { isMissingSupabaseSchemaError } from "@/lib/supabase/errors";

export interface SkillAdoption {
  personal: Array<{ target: string; contentHash: string; checkedAt: string; updateAvailable: boolean }>;
  aggregate: { downloads: number; managedInstalls: number; outdatedInstalls: number } | null;
}

export async function getSkillAdoption(artifactId: string, approvedVersionId: string | null, canViewAggregate: boolean): Promise<SkillAdoption> {
  const { user } = await getViewerContext();
  const supabase = createServerSupabase();
  const { data: personal, error } = await supabase.from("skill_installations").select("target, content_hash, artifact_version_id, checked_at").eq("artifact_id", artifactId).eq("user_id", user.id).order("checked_at", { ascending: false });
  if (error && isMissingSupabaseSchemaError(error)) return { personal: [], aggregate: null };
  if (error) throw error;
  let aggregate: SkillAdoption["aggregate"] = null;
  if (canViewAggregate) {
    const [downloads, installs, outdated] = await Promise.all([
      supabase.from("skill_downloads").select("id", { count: "exact", head: true }).eq("artifact_id", artifactId),
      supabase.from("skill_installations").select("id", { count: "exact", head: true }).eq("artifact_id", artifactId),
      approvedVersionId ? supabase.from("skill_installations").select("id", { count: "exact", head: true }).eq("artifact_id", artifactId).neq("artifact_version_id", approvedVersionId) : Promise.resolve({ count: 0, error: null })
    ]);
    if (![downloads, installs, outdated].some((result) => result.error)) aggregate = { downloads: downloads.count ?? 0, managedInstalls: installs.count ?? 0, outdatedInstalls: outdated.count ?? 0 };
  }
  return { personal: (personal ?? []).map((item) => ({ target: item.target, contentHash: item.content_hash, checkedAt: item.checked_at, updateAvailable: Boolean(approvedVersionId && item.artifact_version_id !== approvedVersionId) })), aggregate };
}
