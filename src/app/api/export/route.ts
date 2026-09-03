import { NextResponse } from "next/server";
import { listGovernanceExportRows } from "@/lib/data";
import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";
import { ensureWorkspaceId } from "@/lib/settings";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";
  const demo = url.searchParams.get("demo") === "1";
  const rows = await listGovernanceExportRows(demo);

  if (hasSupabaseConfig() && !demo) {
    try {
      const supabase = createServerSupabase();
      await supabase.from("export_runs").insert({
        workspace_id: await ensureWorkspaceId(),
        format,
        artifact_count: rows.length
      });
    } catch {
      // Export downloads should not fail because bookkeeping failed.
    }
  }

  if (format === "csv") {
    const header = [
      "name",
      "type",
      "repo",
      "path",
      "owner",
      "status",
      "risk_count",
      "current_content_hash",
      "approved_content_hash",
      "current_commit_sha",
      "tools",
      "mcp_servers",
      "risk_kinds",
      "risk_severities",
      "last_reviewer",
      "last_decision",
      "updated_at"
    ];
    const csvRows = rows.map((artifact) =>
      [
        artifact.name,
        artifact.type,
        artifact.repo_name,
        artifact.path,
        artifact.owner ?? "",
        artifact.status,
        artifact.risk_count,
        artifact.current_content_hash ?? "",
        artifact.approved_content_hash ?? "",
        artifact.current_commit_sha ?? "",
        artifact.tools.join(";"),
        artifact.mcp_servers.join(";"),
        artifact.risk_kinds.join(";"),
        artifact.risk_severities.join(";"),
        artifact.last_reviewer ?? "",
        artifact.last_decision ?? "",
        artifact.updated_at
      ]
        .map(csvCell)
        .join(",")
    );
    return new Response([header.join(","), ...csvRows].join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=skill-dockyard-export.csv"
      }
    });
  }

  return NextResponse.json({ generatedAt: new Date().toISOString(), artifacts: rows });
}

function csvCell(value: unknown) {
  return `"${String(value).replaceAll('"', '""')}"`;
}
