import type { ScanArtifactInput } from "@/lib/types";

export function toCsv(items: ScanArtifactInput[]) {
  const header = ["name", "type", "repo", "path", "owner", "commit_sha", "content_hash", "risk_count"];
  const rows = items.map((item) =>
    [
      item.artifact.name,
      item.artifact.type,
      item.repo.name,
      item.artifact.path,
      item.artifact.owner ?? "",
      item.version.commit_sha ?? "",
      item.version.content_hash,
      item.risks.length
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(",")
  );
  return [header.join(","), ...rows].join("\n");
}
