import type { Artifact, ArtifactDetail } from "@/lib/types";

export interface SubmissionOptions {
  owners: string[];
  libraryAreas: string[];
  tools: string[];
  mcpServers: string[];
}

export function deriveSubmissionOptions(
  artifacts: Artifact[],
  details: Array<ArtifactDetail | null>,
  settings: {
    highImpactTools: string[];
    approvedMcpServers: string[];
  }
): SubmissionOptions {
  const owners = uniqueSorted(artifacts.map((artifact) => artifact.owner).filter(Boolean) as string[]);
  const libraryAreas = uniqueSorted([...artifacts.map((artifact) => artifact.repo_name), "General Skills"]);
  const tools = uniqueSorted([...settings.highImpactTools, ...details.flatMap((detail) => detail?.current_version?.tools ?? [])]);
  const mcpServers = uniqueSorted([...settings.approvedMcpServers, ...details.flatMap((detail) => detail?.current_version?.mcp_servers ?? [])]);

  return {
    owners,
    libraryAreas,
    tools,
    mcpServers
  };
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
