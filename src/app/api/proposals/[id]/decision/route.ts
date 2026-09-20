import { NextResponse } from "next/server";
import { getProposal, validateProposalDecision } from "@/lib/proposals";
import { getViewerContext } from "@/lib/access";
import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";
import { notifyDownloadedUsersOfUpdate } from "@/lib/update-notifications";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseConfig()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { id } = await params;
  const body = await request.json();
  if (!validateProposalDecision(body.decision)) return NextResponse.json({ error: "Choose publish, request changes, or reject." }, { status: 400 });
  if ((body.decision === "changes_requested" || body.decision === "rejected") && (typeof body.note !== "string" || !body.note.trim())) {
    return NextResponse.json({ error: "Add a note explaining what should change or why this proposal was rejected." }, { status: 400 });
  }

  const proposal = await getProposal(id);
  if (!proposal) return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  if (!proposal.artifact.can_publish) return NextResponse.json({ error: "Only source workspace owners or reviewers can decide proposals." }, { status: 403 });
  if (proposal.status !== "pending_review") return NextResponse.json({ error: "This proposal has already been resolved. Refresh to see the latest status." }, { status: 409 });
  if (proposal.artifact.current_version_id !== proposal.candidate_version_id) return NextResponse.json({ error: "A newer proposal is available. Refresh before reviewing this proposal." }, { status: 409 });

  const { user } = await getViewerContext();
  const reviewerName = user.email ?? "Workspace reviewer";
  const supabase = createServerSupabase();
  const { data: decisionResult, error: decisionError } = await supabase.rpc("decide_proposal", {
    p_proposal_id: id,
    p_reviewer_user_id: user.id,
    p_reviewer_name: reviewerName,
    p_decision: body.decision,
    p_note: typeof body.note === "string" ? body.note : null
  });
  if (decisionError) return NextResponse.json({ error: decisionError.message }, { status: 409 });

  if (proposal.submitted_by_user_id && proposal.submitted_by_user_id !== user.id) {
    const notification = body.decision === "published"
      ? { type: "proposal_published", title: "Your skill proposal was published", body: `${proposal.artifact.name} is now the published team version.` }
      : body.decision === "changes_requested"
        ? { type: "changes_requested", title: "Changes requested on your proposal", body: `A reviewer requested changes to ${proposal.artifact.name}.` }
        : { type: "proposal_rejected", title: "Your skill proposal was rejected", body: `${proposal.artifact.name} was not published.` };
    await supabase.from("notifications").insert({ user_id: proposal.submitted_by_user_id, proposal_id: id, ...notification });
  }
  if (body.decision === "published") {
    await notifyDownloadedUsersOfUpdate({ artifactId: proposal.artifact_id, workspaceId: proposal.workspace_id, versionId: proposal.candidate_version_id, artifactName: proposal.artifact.name });
  }

  return NextResponse.json({ ok: true, ...(decisionResult ?? { proposalId: id, status: body.decision }) });
}
