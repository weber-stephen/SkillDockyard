import type { Artifact, ArtifactDetail } from "@/lib/types";

const now = new Date().toISOString();

export const sampleArtifacts: Artifact[] = [
  {
    id: "art_release_captain",
    workspace_id: "local",
    repo_id: "repo_sample",
    name: "Release Captain",
    slug: "release-captain",
    type: "claude_skill",
    repo_name: "platform-tools",
    path: "skills/release-captain/SKILL.md",
    description: "Prepares release notes, verifies deployment checklists, and opens follow-up tickets.",
    owner: "@platform",
    status: "needs_reapproval",
    current_version_id: "ver_release_captain_current",
    approved_version_id: "ver_release_captain_previous",
    risk_count: 2,
    updated_at: now
  },
  {
    id: "art_security_agent",
    workspace_id: "local",
    repo_id: "repo_sample",
    name: "Security Review Agent",
    slug: "security-review-agent",
    type: "copilot_agent",
    repo_name: "app-monorepo",
    path: ".github/agents/security-review.md",
    description: "Reviews auth changes, dependency upgrades, and database migrations.",
    owner: "@security",
    status: "approved",
    current_version_id: "ver_security_current",
    approved_version_id: "ver_security_current",
    risk_count: 1,
    updated_at: now
  },
  {
    id: "art_agents_md",
    workspace_id: "local",
    repo_id: "repo_sample",
    name: "Repository Agent Instructions",
    slug: "repository-agent-instructions",
    type: "agent_doc",
    repo_name: "web-product",
    path: "AGENTS.md",
    description: "Shared coding-agent conventions for the web product repository.",
    owner: null,
    status: "unreviewed",
    current_version_id: "ver_agents_current",
    approved_version_id: null,
    risk_count: 1,
    updated_at: now
  }
];

export const sampleDetails: Record<string, ArtifactDetail> = {
  art_release_captain: {
    ...sampleArtifacts[0],
    current_version: {
      id: "ver_release_captain_current",
      artifact_id: "art_release_captain",
      commit_sha: "a18f3c9",
      branch_ref: "main",
      content_hash: "sha256:current-release",
      content_snapshot:
        "# Release Captain\n\nUse shell to inspect release files, call stripe when billing changes are included, and prepare deployment notes.",
      summary: "Adds billing-release handling and expands tool access for deployment checks.",
      tools: ["shell", "stripe"],
      mcp_servers: ["github", "localhost:3333"],
      tags: ["release", "platform"],
      status: "needs_reapproval",
      created_at: now
    },
    approved_version: {
      id: "ver_release_captain_previous",
      artifact_id: "art_release_captain",
      commit_sha: "9012abc",
      branch_ref: "main",
      content_hash: "sha256:previous-release",
      content_snapshot: "# Release Captain\n\nPrepare deployment notes and verify checklist status.",
      summary: "Initial approved release-support workflow.",
      tools: ["github"],
      mcp_servers: ["github"],
      tags: ["release", "platform"],
      status: "approved",
      created_at: now
    },
    risks: [
      {
        id: "risk_shell",
        artifact_id: "art_release_captain",
        artifact_version_id: "ver_release_captain_current",
        kind: "high_impact_tool",
        severity: "high",
        message: "References a high-impact tool: shell.",
        evidence: "shell",
        created_at: now
      },
      {
        id: "risk_local_mcp",
        artifact_id: "art_release_captain",
        artifact_version_id: "ver_release_captain_current",
        kind: "local_mcp",
        severity: "medium",
        message: "References a local MCP endpoint that may not be centrally governed.",
        evidence: "localhost:3333",
        created_at: now
      }
    ],
    approvals: [
      {
        id: "approval_previous",
        artifact_id: "art_release_captain",
        artifact_version_id: "ver_release_captain_previous",
        reviewer_name: "Mara Patel",
        decision: "approved",
        note: "Approved for platform release workflow.",
        created_at: now
      }
    ]
  },
  art_security_agent: {
    ...sampleArtifacts[1],
    current_version: {
      id: "ver_security_current",
      artifact_id: "art_security_agent",
      commit_sha: "37ff901",
      branch_ref: "main",
      content_hash: "sha256:security-current",
      content_snapshot: "---\nname: Security Review Agent\ntools: [github]\n---\nReview risky application changes.",
      summary: "Approved security review instructions.",
      tools: ["github"],
      mcp_servers: [],
      tags: ["security"],
      status: "approved",
      created_at: now
    },
    approved_version: null,
    risks: [
      {
        id: "risk_security_tool",
        artifact_id: "art_security_agent",
        artifact_version_id: "ver_security_current",
        kind: "high_impact_tool",
        severity: "medium",
        message: "GitHub tool access should be reviewed for write permissions.",
        evidence: "github",
        created_at: now
      }
    ],
    approvals: []
  },
  art_agents_md: {
    ...sampleArtifacts[2],
    current_version: {
      id: "ver_agents_current",
      artifact_id: "art_agents_md",
      commit_sha: "55d0e12",
      branch_ref: "main",
      content_hash: "sha256:agents-current",
      content_snapshot: "# AGENTS.md\n\nFollow repository conventions and ask before destructive changes.",
      summary: "Repository-wide coding-agent instructions.",
      tools: [],
      mcp_servers: [],
      tags: ["repo"],
      status: "unreviewed",
      created_at: now
    },
    approved_version: null,
    risks: [
      {
        id: "risk_missing_owner",
        artifact_id: "art_agents_md",
        artifact_version_id: "ver_agents_current",
        kind: "missing_owner",
        severity: "low",
        message: "No owner could be resolved from CODEOWNERS or Git history.",
        evidence: null,
        created_at: now
      }
    ],
    approvals: []
  }
};
