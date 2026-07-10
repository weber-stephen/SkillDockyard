import { NextResponse } from "next/server";
import { listArtifacts } from "@/lib/data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";
  const artifacts = await listArtifacts();

  if (format === "csv") {
    const header = ["name", "type", "repo", "path", "owner", "status", "risk_count", "updated_at"];
    const rows = artifacts.map((artifact) =>
      [artifact.name, artifact.type, artifact.repo_name, artifact.path, artifact.owner ?? "", artifact.status, artifact.risk_count, artifact.updated_at]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",")
    );
    return new Response([header.join(","), ...rows].join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=skill-dockyard-export.csv"
      }
    });
  }

  return NextResponse.json({ generatedAt: new Date().toISOString(), artifacts });
}
