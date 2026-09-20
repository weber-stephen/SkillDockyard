import { createServerSupabase } from "@/lib/supabase/server";
import { getViewerContext } from "@/lib/access";
import type { ArtifactDetail, Proposal, ProposalReviewDecision, ProposalStatus } from "@/lib/types";

export type ProposalListItem = Proposal & {
  artifact_name: string;
  artifact_path: string;
  artifact_slug: string;
};

export async function listMyProposals(): Promise<ProposalListItem[]> {
  const { user } = await getViewerContext();
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("submitted_by_user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return enrichProposalList(supabase, (data ?? []) as Proposal[]);
}

export async function listReviewQueue(): Promise<ProposalListItem[]> {
  const { memberships } = await getViewerContext();
  const workspaceIds = memberships.filter((membership) => membership.role === "owner" || membership.role === "reviewer").map((membership) => membership.workspace_id);
  if (!workspaceIds.length) return [];
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .in("workspace_id", workspaceIds)
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return enrichProposalList(supabase, (data ?? []) as Proposal[]);
}

async function enrichProposalList(supabase: ReturnType<typeof createServerSupabase>, proposals: Proposal[]): Promise<ProposalListItem[]> {
  if (!proposals.length) return [];
  const { data, error } = await supabase.from("artifact_catalog").select("id, name, path, slug").in("id", [...new Set(proposals.map((proposal) => proposal.artifact_id))]);
  if (error) throw error;
  const artifacts = new Map((data ?? []).map((artifact) => [artifact.id as string, artifact]));
  return proposals.flatMap((proposal) => {
    const artifact = artifacts.get(proposal.artifact_id);
    return artifact ? [{ ...proposal, artifact_name: artifact.name, artifact_path: artifact.path, artifact_slug: artifact.slug }] : [];
  });
}

export async function getProposal(id: string): Promise<(Proposal & { artifact: ArtifactDetail }) | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.from("proposals").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { getArtifactDetail } = await import("@/lib/data");
  const artifact = await getArtifactDetail(data.artifact_id as string);
  if (!artifact) return null;
  const { data: reviews, error: reviewsError } = await supabase.from("proposal_reviews").select("*").eq("proposal_id", id).order("created_at", { ascending: false });
  if (reviewsError) throw reviewsError;
  const versionIds = [data.candidate_version_id, data.base_version_id].filter(Boolean);
  const { data: versions, error: versionsError } = await supabase.from("artifact_versions").select("*").in("id", versionIds);
  if (versionsError) throw versionsError;
  const versionMap = new Map((versions ?? []).map((version) => [version.id, version]));
  return {
    ...(data as Proposal),
    candidate_version: versionMap.get(data.candidate_version_id) ?? null,
    base_version: data.base_version_id ? versionMap.get(data.base_version_id) ?? null : null,
    reviews: reviews ?? [],
    artifact
  };
}

export function proposalStatusLabel(status: ProposalStatus) {
  const labels: Record<ProposalStatus, string> = {
    pending_review: "Awaiting review",
    changes_requested: "Changes requested",
    rejected: "Rejected",
    published: "Published",
    superseded: "Superseded",
    withdrawn: "Withdrawn"
  };
  return labels[status];
}

export function proposalStatusVariant(status: ProposalStatus): "success" | "risk" | "muted" | "outline" {
  if (status === "published") return "success";
  if (status === "pending_review" || status === "changes_requested") return "risk";
  return "muted";
}

export function validateProposalDecision(decision: unknown): decision is ProposalReviewDecision {
  return decision === "published" || decision === "changes_requested" || decision === "rejected";
}
