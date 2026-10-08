import { NextResponse } from "next/server";
import { getViewerContext } from "@/lib/access";
import { buildBrowserImportArtifacts, type BrowserSkillImportInput, validateBrowserSkillImport } from "@/lib/browser-skill-import";
import { ingestArtifacts } from "@/lib/ingest";
import { recordOnboardingMilestone } from "@/lib/onboarding";
import { readJsonBody, RequestBodyError } from "@/lib/request-body";
import { consumeRateLimit, recordRateLimitFailure, RateLimitConfigurationError } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) return NextResponse.json({ error: "Browser import is available after you create a workspace." }, { status: 503 });
  let input: BrowserSkillImportInput;
  try { input = await readJsonBody<BrowserSkillImportInput>(request); } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request body must contain valid JSON." }, { status });
  }
  const inputError = validateBrowserSkillImport(input);
  if (inputError) return NextResponse.json({ error: inputError }, { status: 400 });

  try {
    const settings = await getSettings();
    const viewer = await getViewerContext();
    const workspaceMembership = viewer.memberships.find((membership) => membership.workspace_id === settings.workspaceId) ?? null;
    if (input.visibility === "workspace" && (!workspaceMembership || workspaceMembership.role === "viewer")) {
      return NextResponse.json({ error: "You can view this workspace, but you cannot submit skills for review." }, { status: 403 });
    }
    const rate = await consumeRateLimit(`browser-import-user:${viewer.user.id}`, 10, 60_000);
    if (!rate.allowed) {
      recordRateLimitFailure("browser-import-user");
      return NextResponse.json({ error: "Too many imports. Try again later." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
    }
    const artifacts = buildBrowserImportArtifacts(input.skills as Array<{ path: string; content: string }>, {
      approvedMcpServers: settings.approvedMcpServers,
      highImpactTools: settings.highImpactTools
    }, typeof input.summary === "string" ? input.summary : undefined);
    const items = input.visibility === "private"
      ? artifacts.map((item) => ({ ...item, artifact: { ...item.artifact, path: `private/${viewer.user.id}/${item.artifact.path}` } }))
      : artifacts;
    const result = await ingestArtifacts(items, settings.workspaceId ?? undefined, { createdByUserId: viewer.user.id, visibility: input.visibility });
    const supabase = createServerSupabase();
    const proposalIds: string[] = [];
    if (input.visibility === "workspace") {
      for (const item of result.artifacts) {
        const { data: proposal, error } = await supabase.from("proposals").insert({
          artifact_id: item.artifactId,
          candidate_version_id: item.versionId,
          workspace_id: result.workspaceId,
          submitted_by_user_id: viewer.user.id,
          submitter_email: viewer.user.email ?? null,
          kind: "new",
          status: "pending_review"
        }).select("id").single();
        if (error) throw error;
        proposalIds.push(proposal.id);
      }
      const { data: reviewers } = await supabase.from("workspace_members").select("user_id").eq("workspace_id", result.workspaceId).in("role", ["owner", "reviewer"]);
      const recipients = (reviewers ?? []).map((reviewer) => reviewer.user_id).filter((id): id is string => Boolean(id && id !== viewer.user.id));
      if (recipients.length) await supabase.from("notifications").insert(recipients.map((userId) => ({
        user_id: userId,
        proposal_id: proposalIds[0] ?? null,
        type: "proposal_submitted",
        title: `${result.artifacts.length} skill${result.artifacts.length === 1 ? "" : "s"} submitted for review`,
        body: typeof input.summary === "string" ? input.summary.trim() : "Skills imported from a connected computer are ready for review."
      })));
    }
    await recordOnboardingMilestone(result.workspaceId, "scan");
    return NextResponse.json({ imported: result.artifacts.length, visibility: input.visibility, artifactIds: result.artifacts.map((item) => item.artifactId), proposalIds });
  } catch (error) {
    if (error instanceof RateLimitConfigurationError) return NextResponse.json({ error: "This service is temporarily unavailable." }, { status: 503 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "We could not import these skills." }, { status: 400 });
  }
}
