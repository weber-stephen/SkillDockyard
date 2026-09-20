import { createServerSupabase } from "@/lib/supabase/server";

export async function notifyDownloadedUsersOfUpdate(input: { artifactId: string; workspaceId: string; versionId: string; artifactName: string }) {
  const supabase = createServerSupabase();
  const [{ data: downloads }, { data: installs }, { data: sourceMembers }, { data: shares }] = await Promise.all([
    supabase.from("skill_downloads").select("user_id, artifact_version_id").eq("artifact_id", input.artifactId).not("user_id", "is", null).neq("artifact_version_id", input.versionId),
    supabase.from("skill_installations").select("user_id, artifact_version_id").eq("artifact_id", input.artifactId).neq("artifact_version_id", input.versionId),
    supabase.from("workspace_members").select("user_id").eq("workspace_id", input.workspaceId).not("user_id", "is", null),
    supabase.from("artifact_shares").select("target_user_id, target_workspace_id").eq("artifact_id", input.artifactId).eq("status", "active")
  ]);
  const candidateIds = new Set([...(downloads ?? []), ...(installs ?? [])].map((row) => row.user_id as string).filter(Boolean));
  const allowed = new Set((sourceMembers ?? []).map((row) => row.user_id as string).filter(Boolean));
  for (const share of shares ?? []) if (share.target_user_id) allowed.add(share.target_user_id as string);
  const sharedWorkspaceIds = (shares ?? []).map((share) => share.target_workspace_id as string).filter(Boolean);
  if (sharedWorkspaceIds.length) {
    const { data: sharedMembers } = await supabase.from("workspace_members").select("user_id").in("workspace_id", sharedWorkspaceIds).not("user_id", "is", null);
    for (const member of sharedMembers ?? []) allowed.add(member.user_id as string);
  }
  const recipients = [...candidateIds].filter((userId) => allowed.has(userId));
  if (!recipients.length) return;
  await supabase.from("notifications").upsert(recipients.map((userId) => ({ user_id: userId, artifact_id: input.artifactId, artifact_version_id: input.versionId, type: "skill_update_available", title: `Update available: ${input.artifactName}`, body: "A newer approved version is ready to install.", href: `/artifacts/${input.artifactId}#get-this-skill` })), { onConflict: "user_id,artifact_id,artifact_version_id,type", ignoreDuplicates: true });
}
