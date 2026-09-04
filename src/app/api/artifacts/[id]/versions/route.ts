import { NextResponse } from "next/server";
import { getArtifactDetail } from "@/lib/data";
import { getSupabaseErrorStatus } from "@/lib/supabase/errors";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const artifact = await getArtifactDetail(id);
    if (!artifact) return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
    return NextResponse.json({
      current: artifact.current_version,
      approved: artifact.approved_version,
      approvals: artifact.approvals
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load skill versions." }, { status: getSupabaseErrorStatus(error, 500) });
  }
}
