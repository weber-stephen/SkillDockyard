import { NextResponse } from "next/server";
import { ingestArtifacts } from "@/lib/ingest";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import type { ScanArtifactInput } from "@/lib/types";
import { resolveWorkspaceForScanToken } from "@/lib/scan-tokens";
import { recordOnboardingMilestone } from "@/lib/onboarding";

export async function POST(request: Request) {
  const body = (await request.json()) as { artifacts?: ScanArtifactInput[] };
  const artifacts = Array.isArray(body.artifacts) ? body.artifacts : null;
  if (!artifacts) {
    return NextResponse.json({ error: "Request body must include an artifacts array." }, { status: 400 });
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ accepted: artifacts.length, mode: "demo" });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const tokenWorkspaceId = await resolveWorkspaceForScanToken(token ?? "");
  const workspaceId = tokenWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: "A valid ingest token is required." }, { status: 401 });

  try {
    const result = await ingestArtifacts(artifacts, workspaceId);
    await recordOnboardingMilestone(workspaceId, "scan");
    return NextResponse.json({ accepted: artifacts.length, workspaceId: result.workspaceId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scan ingest failed." }, { status: 400 });
  }
}
