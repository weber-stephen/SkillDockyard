import { NextResponse } from "next/server";
import { getViewerContext } from "@/lib/access";
import { getArtifactDetail } from "@/lib/data";
import { ingestArtifacts } from "@/lib/ingest";
import { getSettings } from "@/lib/settings";
import { buildManualSubmission, type ManualSubmissionInput } from "@/lib/submissions";
import { validateManualSubmissionInput } from "@/lib/submissions";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { recordOnboardingMilestone } from "@/lib/onboarding";
import { readJsonBody, RequestBodyError } from "@/lib/request-body";
import { consumeRateLimit } from "@/lib/rate-limit";
import type { ArtifactVisibility } from "@/lib/types";

export async function POST(request: Request) {
  const demo = new URL(request.url).searchParams.get("demo") === "1";
  if (demo) {
    return NextResponse.json({ mode: "demo", saved: false, message: "This demo submission is ready to save in this browser.", artifactId: null, compareHref: null, trustNotes: 0 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "The live workspace is not configured.", code: "live_app_not_configured" }, { status: 503 });
  }
  let body: ManualSubmissionInput;
  try {
    body = await readJsonBody<ManualSubmissionInput>(request);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request body must contain valid JSON." }, { status });
  }
  const inputError = validateManualSubmissionInput(body);
  if (inputError) return NextResponse.json({ error: inputError }, { status: 400 });
  const visibility: ArtifactVisibility = body.mode === "new" && body.visibility === "private" ? "private" : "workspace";
  const existingArtifact = body.mode === "update" && typeof body.artifactId === "string" ? await getArtifactDetail(body.artifactId) : null;
  const settings = await getSettings();
  if (body.mode === "update" && existingArtifact && !existingArtifact.can_propose_update) {
    return NextResponse.json({ error: "You can view this skill, but you cannot propose updates to it." }, { status: 403 });
  }

  try {
    const submission = buildManualSubmission(body, {
      existingArtifact,
      riskRules: {
        approvedMcpServers: settings.approvedMcpServers,
        highImpactTools: settings.highImpactTools
      }
    });

    if (body.mode === "update" && existingArtifact?.approved_version?.content_hash === submission.artifact.version.content_hash) {
      throw new Error("This update matches the published version. Add a change before submitting.");
    }

    const viewer = await getViewerContext();
    const userRate = consumeRateLimit(`submission-user:${viewer.user.id}`, 20, 60_000);
    const workspaceIds = new Set((viewer.memberships ?? []).map((membership) => membership.workspace_id));
    if (existingArtifact?.workspace_id) workspaceIds.add(existingArtifact.workspace_id);
    const workspaceRates = [...workspaceIds].map((id) => consumeRateLimit(`submission-workspace:${id}`, 20, 60_000));
    if (!userRate.allowed || workspaceRates.some((rate) => !rate.allowed)) {
      const retryAfter = Math.max(userRate.retryAfterSeconds, ...workspaceRates.map((rate) => rate.retryAfterSeconds));
      return NextResponse.json({ error: "Too many submissions. Try again later." }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
    }
    const result = await ingestArtifacts(
      [
        visibility === "private"
          ? {
              ...submission.artifact,
              artifact: {
                ...submission.artifact.artifact,
                path: `private/${viewer.user.id}/${submission.artifact.artifact.path.replace(/[^a-zA-Z0-9._/-]/g, "-")}-${submission.artifact.version.content_hash.slice(-12)}`
              }
            }
          : submission.artifact
      ],
      body.mode === "update" && existingArtifact ? existingArtifact.workspace_id : undefined,
      {
        createdByUserId: viewer.user.id,
        sourceShareId: existingArtifact?.source_share_id ?? null,
        visibility
      }
    );
    const ingested = result.artifacts[0];
    const supabase = (await import("@/lib/supabase/server")).createServerSupabase();

    if (visibility === "private") {
      await recordOnboardingMilestone(result.workspaceId, "submission");
      return NextResponse.json({
        mode: "supabase",
        saved: true,
        visibility,
        message: "Saved as a private draft. Only you can see it until you submit it for review.",
        artifactId: ingested.artifactId,
        versionId: ingested.versionId,
        proposalId: null,
        proposalStatus: null,
        compareHref: `/artifacts/${ingested.artifactId}`,
        trustNotes: submission.artifact.risks.length
      });
    }

    const { data: pendingProposal, error: pendingProposalError } = await supabase
      .from("proposals")
      .select("id, candidate_version_id, status")
      .eq("artifact_id", ingested.artifactId)
      .eq("status", "pending_review")
      .maybeSingle();
    if (pendingProposalError) throw pendingProposalError;

    // A browser retry can arrive after the proposal was persisted but before the
    // success response reached the client. Treat that retry as idempotent.
    if (pendingProposal?.candidate_version_id === ingested.versionId) {
      return NextResponse.json({
        mode: "supabase",
        saved: true,
        visibility: "workspace",
        message: "This skill is already waiting for review.",
        artifactId: ingested.artifactId,
        versionId: ingested.versionId,
        proposalId: pendingProposal.id,
        proposalStatus: "pending_review",
        compareHref: `/artifacts/${ingested.artifactId}/review`,
        trustNotes: submission.artifact.risks.length
      });
    }

    if (pendingProposal?.status === "pending_review") {
      await supabase
        .from("proposals")
        .update({ status: "superseded", resolved_by_user_id: viewer.user.id, resolved_at: new Date().toISOString(), resolution_note: "Superseded by a newer submission." })
        .eq("id", pendingProposal.id)
        .eq("status", "pending_review");
    }
    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .insert({
        artifact_id: ingested.artifactId,
        candidate_version_id: ingested.versionId,
        base_version_id: existingArtifact?.approved_version_id ?? null,
        workspace_id: result.workspaceId,
        submitted_by_user_id: viewer.user.id,
        submitter_email: viewer.user.email ?? null,
        source_share_id: existingArtifact?.source_share_id ?? null,
        supersedes_proposal_id: pendingProposal?.id ?? existingArtifact?.current_proposal?.id ?? null,
        kind: body.mode === "update" ? "update" : "new",
        status: "pending_review"
      })
      .select("id")
      .single();
    if (proposalError) throw proposalError;

    await createProposalNotifications(supabase, {
      proposalId: proposal.id,
      workspaceId: result.workspaceId,
      artifactName: submission.artifact.artifact.name,
      submitterId: viewer.user.id
    });
    await recordOnboardingMilestone(result.workspaceId, "submission");
    return NextResponse.json({
      mode: "supabase",
      saved: true,
      visibility,
      message: submission.successMessage,
      artifactId: ingested.artifactId,
      versionId: ingested.versionId,
      proposalId: proposal.id,
      proposalStatus: "pending_review",
      compareHref: `/artifacts/${ingested.artifactId}/review`,
      trustNotes: submission.artifact.risks.length
    });
  } catch (error) {
    return NextResponse.json({ error: getSubmissionErrorMessage(error) }, { status: 400 });
  }
}

function getSubmissionErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return "We could not submit this skill.";
}

async function createProposalNotifications(supabase: ReturnType<typeof import("@/lib/supabase/server").createServerSupabase>, input: { proposalId: string; workspaceId: string; artifactName: string; submitterId: string }) {
  const { data: reviewers } = await supabase.from("workspace_members").select("user_id").eq("workspace_id", input.workspaceId).in("role", ["owner", "reviewer"]);
  const recipients = (reviewers ?? []).map((reviewer) => reviewer.user_id).filter((userId): userId is string => Boolean(userId && userId !== input.submitterId));
  if (!recipients.length) return;
  await supabase.from("notifications").insert(recipients.map((userId) => ({
    user_id: userId,
    proposal_id: input.proposalId,
    type: "proposal_submitted",
    title: "A skill proposal needs review",
    body: `${input.artifactName} was submitted for review.`
  })));
}
