import { NextResponse } from "next/server";
import { getArtifactDetail } from "@/lib/data";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artifact = await getArtifactDetail(id);
  if (!artifact) return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  return NextResponse.json({
    current: artifact.current_version,
    approved: artifact.approved_version,
    approvals: artifact.approvals
  });
}
