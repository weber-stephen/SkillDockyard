import { NextResponse } from "next/server";
import { listArtifacts } from "@/lib/data";

export async function GET() {
  return NextResponse.json(await listArtifacts());
}
