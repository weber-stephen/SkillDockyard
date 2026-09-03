import { NextResponse } from "next/server";
import { getViewerContext } from "@/lib/access";
import { getArtifactDetail } from "@/lib/data";
import { ingestArtifacts } from "@/lib/ingest";
import { getSettings } from "@/lib/settings";
import { buildManualSubmission, type ManualSubmissionInput } from "@/lib/submissions";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { recordOnboardingMilestone } from "@/lib/onboarding";

export async function POST(request: Request) {
  const body = (await request.json()) as ManualSubmissionInput;
  const demo = new URL(request.url).searchParams.get("demo") === "1";
  if (demo) {
    return NextResponse.json({ mode: "demo", saved: false, message: "This demo submission is ready to save in this browser.", artifactId: null, compareHref: null, trustNotes: 0 });
  }
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

    if (!hasSupabaseConfig()) {
      return NextResponse.json({
        mode: "demo",
        saved: false,
        message: "Supabase is not configured. This submission is ready to save as a local browser draft.",
        artifactId: submission.targetArtifactId,
        compareHref: submission.compareHref,
        trustNotes: submission.artifact.risks.length
      });
    }

    const viewer = await getViewerContext();
    const result = await ingestArtifacts(
      [submission.artifact],
      body.mode === "update" && existingArtifact ? existingArtifact.workspace_id : undefined,
      {
        createdByUserId: viewer.user.id,
        sourceShareId: existingArtifact?.access_scope?.startsWith("shared_") ? existingArtifact.shares?.[0]?.id ?? null : null
      }
    );
    const ingested = result.artifacts[0];
    await recordOnboardingMilestone(result.workspaceId, "submission");
    return NextResponse.json({
      mode: "supabase",
      saved: true,
      message: submission.successMessage,
      artifactId: ingested.artifactId,
      versionId: ingested.versionId,
      compareHref: `/artifacts/${ingested.artifactId}/review`,
      trustNotes: submission.artifact.risks.length
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "We could not submit this skill." }, { status: 400 });
  }
}
