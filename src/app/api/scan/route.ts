import { NextResponse } from "next/server";
import { ingestArtifacts } from "@/lib/ingest";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import type { ScanArtifactInput } from "@/lib/types";
import { resolveWorkspaceForScanToken } from "@/lib/scan-tokens";
import { recordOnboardingMilestone } from "@/lib/onboarding";
import { readJsonBody, RequestBodyError } from "@/lib/request-body";
import { consumeRateLimit, fingerprintRateLimitKey } from "@/lib/rate-limit";
import { validateIngestBatch } from "@/lib/ingest-limits";
import { resolveCliToken } from "@/lib/cli-auth";

export async function POST(request: Request) {
  let body: { artifacts?: ScanArtifactInput[] };
  try {
    body = await readJsonBody<{ artifacts?: ScanArtifactInput[] }>(request);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request body must contain valid JSON." }, { status });
  }
  const artifacts = body && Array.isArray(body.artifacts) ? body.artifacts : null;
  if (!artifacts || !validateIngestBatch(artifacts)) {
    return NextResponse.json({ error: "The request must include a bounded artifacts array with valid items." }, { status: 400 });
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ accepted: artifacts.length, mode: "demo" });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const cliIdentity = await resolveCliToken(request);
  const tokenWorkspaceId = cliIdentity?.workspaceId ?? await resolveWorkspaceForScanToken(token ?? "");
  const workspaceId = tokenWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: "A valid ingest token is required." }, { status: 401 });

  const workspaceRate = consumeRateLimit(`scan-workspace:${workspaceId}`, 20, 60_000);
  const tokenRate = consumeRateLimit(`scan-token:${fingerprintRateLimitKey(token ?? "")}`, 10, 60_000);
  if (!workspaceRate.allowed || !tokenRate.allowed) {
    const retryAfter = Math.max(workspaceRate.retryAfterSeconds, tokenRate.retryAfterSeconds);
    return NextResponse.json({ error: "Too many scan requests. Try again later." }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
  }

  try {
    const result = await ingestArtifacts(artifacts, workspaceId);
    await recordOnboardingMilestone(workspaceId, "scan");
    return NextResponse.json({ accepted: artifacts.length, workspaceId: result.workspaceId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scan ingest failed." }, { status: 400 });
  }
}
