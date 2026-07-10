import { sampleArtifacts, sampleDetails } from "@/lib/sample-data";
import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";
import type { Artifact, ArtifactDetail } from "@/lib/types";

export async function listArtifacts(): Promise<Artifact[]> {
  if (!hasSupabaseConfig()) return sampleArtifacts;

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("artifact_catalog")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data as Artifact[];
}

export async function getArtifactDetail(id: string): Promise<ArtifactDetail | null> {
  if (!hasSupabaseConfig()) return sampleDetails[id] ?? null;

  const supabase = createServerSupabase();
  const { data: artifact, error } = await supabase
    .from("artifact_catalog")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;

  const [{ data: versions }, { data: risks }, { data: approvals }] = await Promise.all([
    supabase.from("artifact_versions").select("*").eq("artifact_id", id).order("created_at", { ascending: false }),
    supabase.from("risk_flags").select("*").eq("artifact_id", id).order("created_at", { ascending: false }),
    supabase.from("approvals").select("*").eq("artifact_id", id).order("created_at", { ascending: false })
  ]);

  const current = versions?.find((version) => version.id === artifact.current_version_id) ?? versions?.[0] ?? null;
  const approved = versions?.find((version) => version.id === artifact.approved_version_id) ?? null;

  return {
    ...(artifact as Artifact),
    current_version: current,
    approved_version: approved,
    risks: risks ?? [],
    approvals: approvals ?? []
  } as ArtifactDetail;
}
