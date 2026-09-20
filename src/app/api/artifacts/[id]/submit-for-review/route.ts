import { NextResponse } from "next/server";
import { getArtifactDetail } from "@/lib/data";
import { getViewerContext } from "@/lib/access";
import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";
import { recordOnboardingMilestone } from "@/lib/onboarding";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseConfig()) return NextResponse.json({ error: "The live workspace is not configured." }, { status: 503 });
  const { id } = await params;
  const artifact = await getArtifactDetail(id);
  if (!artifact) return NextResponse.json({ error: "Skill not found." }, { status: 404 });
  if (!artifact.can_edit_private || artifact.visibility !== "private") {
    return NextResponse.json({ error: "Only the owner of a private draft can submit it for review." }, { status: 403 });
  }

  const { user } = await getViewerContext();
  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc("promote_private_artifact", {
    p_artifact_id: id,
    p_user_id: user.id,
    p_submitter_email: user.email ?? null
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });

  const result = (data ?? {}) as { proposalId?: string; workspaceId?: string; artifactId?: string; versionId?: string };
  if (!result.proposalId || !result.workspaceId || !result.artifactId || !result.versionId) {
    return NextResponse.json({ error: "The private draft could not be submitted for review." }, { status: 500 });
  }

  const reviewers = await supabase
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", result.workspaceId)
    .in("role", ["owner", "reviewer"]);
  const recipients = (reviewers.data ?? []).map((reviewer) => reviewer.user_id).filter((userId): userId is string => Boolean(userId && userId !== user.id));
  if (recipients.length) {
    await supabase.from("notifications").insert(recipients.map((userId) => ({
      user_id: userId,
      proposal_id: result.proposalId,
      type: "proposal_submitted",
      title: "A skill proposal needs review",
      body: `${artifact.name} was submitted for review.`
    })));
  }
  await recordOnboardingMilestone(result.workspaceId, "submission");

  return NextResponse.json({
    mode: "supabase",
    saved: true,
    visibility: "workspace",
    message: "Submitted for review. A workspace owner or reviewer must approve it before teammates can use it.",
    artifactId: result.artifactId,
    versionId: result.versionId,
    proposalId: result.proposalId,
    proposalStatus: "pending_review",
    compareHref: `/artifacts/${result.artifactId}/review`,
    trustNotes: artifact.risks.length
  });
}
