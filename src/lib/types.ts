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
export type WorkspaceRole = "owner" | "reviewer" | "editor" | "viewer";
export type ShareTargetType = "user" | "workspace";
export type ShareStatus = "pending" | "active" | "revoked" | "declined";
export type SharePermission = "propose";
export type ArtifactAccessScope = "owned_workspace" | "shared_user" | "shared_workspace";

export interface Workspace {
  id: string;
  name: string;
  created_at: string;
}

export interface WorkspaceMembership {
  id: string;
  workspace_id: string;
  user_id: string | null;
  email: string | null;
  role: WorkspaceRole;
  created_at: string;
}

export interface WorkspaceSettings {
  id: string;
  workspace_id: string;
  config_file: string;
  approved_mcp_servers: string[];
  high_impact_tools: string[];
  created_at: string;
  updated_at: string;
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
  access_scope?: ArtifactAccessScope;
  can_propose_update?: boolean;
  can_publish?: boolean;
  can_manage_shares?: boolean;
  source_workspace_name?: string | null;
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
  created_by_user_id?: string | null;
  source_share_id?: string | null;
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
  shares?: ArtifactShare[];
}

export interface ArtifactShare {
  id: string;
  artifact_id: string;
  source_workspace_id: string;
  target_type: ShareTargetType;
  target_user_id: string | null;
  target_workspace_id: string | null;
  target_email: string | null;
  target_workspace_name: string | null;
  permission: SharePermission;
  status: ShareStatus;
  created_by_user_id: string | null;
  created_at: string;
  activated_at: string | null;
  revoked_at: string | null;
  declined_at: string | null;
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

export interface GovernanceExportRow {
  id: string;
  name: string;
  type: ArtifactType;
  repo_name: string;
  path: string;
  owner: string | null;
  status: ArtifactStatus;
  risk_count: number;
  current_content_hash: string | null;
  approved_content_hash: string | null;
  current_commit_sha: string | null;
  tools: string[];
  mcp_servers: string[];
  risk_kinds: RiskFlagKind[];
  risk_severities: RiskSeverity[];
  last_reviewer: string | null;
  last_decision: Approval["decision"] | null;
  updated_at: string;
}
