export type ArtifactStatus = "unreviewed" | "approved" | "needs_reapproval" | "deprecated";

export type ArtifactType =
  | "agent_doc"
  | "claude_skill"
  | "copilot_agent"
  | "cursor_rule"
  | "mcp_config"
  | "prompt_library"
  | "skill_folder";

export type RiskFlagKind =
  | "inline_credentials"
  | "local_mcp"
  | "unapproved_mcp"
  | "high_impact_tool"
  | "missing_owner";

export type RiskSeverity = "low" | "medium" | "high";

export interface Workspace {
  id: string;
  name: string;
  created_at: string;
}

export interface RepoRecord {
  id: string;
  workspace_id: string;
  name: string;
  root_path: string;
  default_branch?: string | null;
  created_at: string;
}

export interface Artifact {
  id: string;
  workspace_id: string;
  repo_id: string;
  name: string;
  slug: string;
  type: ArtifactType;
  repo_name: string;
  path: string;
  description: string | null;
  owner: string | null;
  status: ArtifactStatus;
  current_version_id: string | null;
  approved_version_id: string | null;
  risk_count: number;
  updated_at: string;
}

export interface ArtifactVersion {
  id: string;
  artifact_id: string;
  commit_sha: string | null;
  branch_ref: string | null;
  content_hash: string;
  content_snapshot: string;
  summary: string | null;
  tools: string[];
  mcp_servers: string[];
  tags: string[];
  status: ArtifactStatus;
  created_at: string;
}

export interface RiskFlag {
  id: string;
  artifact_id: string;
  artifact_version_id: string;
  kind: RiskFlagKind;
  severity: RiskSeverity;
  message: string;
  evidence: string | null;
  created_at: string;
}

export interface Approval {
  id: string;
  artifact_id: string;
  artifact_version_id: string;
  reviewer_name: string;
  decision: "approved" | "deprecated";
  note: string | null;
  created_at: string;
}

export interface ArtifactDetail extends Artifact {
  current_version: ArtifactVersion | null;
  approved_version: ArtifactVersion | null;
  risks: RiskFlag[];
  approvals: Approval[];
}

export interface ScanArtifactInput {
  repo: {
    name: string;
    root_path: string;
    branch_ref: string | null;
  };
  artifact: {
    name: string;
    slug: string;
    type: ArtifactType;
    path: string;
    description: string | null;
    owner: string | null;
  };
  version: {
    commit_sha: string | null;
    content_hash: string;
    content_snapshot: string;
    summary: string | null;
    tools: string[];
    mcp_servers: string[];
    tags: string[];
  };
  risks: Array<{
    kind: RiskFlagKind;
    severity: RiskSeverity;
    message: string;
    evidence: string | null;
  }>;
}
