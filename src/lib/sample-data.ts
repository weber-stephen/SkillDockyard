import type { Artifact, ArtifactDetail } from "@/lib/types";

const now = new Date().toISOString();

export const sampleArtifacts: Artifact[] = [
  {
    id: "art_release_captain",
    workspace_id: "local",
    repo_id: "repo_sample",
    name: "Campaign Brief Builder",
    slug: "campaign-brief-builder",
    type: "claude_skill",
    repo_name: "growth-marketing",
    path: "skills/campaign-brief-builder/SKILL.md",
    description: "A shared campaign-planning workflow for clear messages, audience insights, and sales handoff.",
    owner: "@growth",
    status: "needs_reapproval",
    current_version_id: "ver_release_captain_current",
    approved_version_id: "ver_release_captain_previous",
    risk_count: 1,
    updated_at: now
  },
  {
    id: "art_security_agent",
    workspace_id: "local",
    repo_id: "repo_sample",
    name: "Sales Discovery Prep",
    slug: "sales-discovery-prep",
    type: "claude_skill",
    repo_name: "sales-enablement",
    path: "skills/sales-discovery-prep/SKILL.md",
    description: "Turns account research into a focused call plan with thoughtful discovery questions.",
    owner: "@revenue",
    status: "approved",
    current_version_id: "ver_security_current",
    approved_version_id: "ver_security_current",
    risk_count: 0,
    updated_at: now
  },
  {
    id: "art_agents_md",
    workspace_id: "local",
    repo_id: "repo_sample",
    name: "Customer Voice Digest",
    slug: "customer-voice-digest",
    type: "claude_skill",
    repo_name: "customer-marketing",
    path: "skills/customer-voice-digest/SKILL.md",
    description: "Turns customer feedback into themes marketing and sales can act on.",
    owner: "@customer-marketing",
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
      content_hash: "sha256:current-campaign-brief",
      content_snapshot: "---\nname: campaign-brief-builder\ndescription: Turn a campaign idea into an audience-first brief with messages, channel ideas, and a sales handoff.\n---\n\nStart by naming the audience, the problem they want solved, and the evidence that makes the message believable. Draft a single campaign promise, then offer three supporting message angles in the customer’s language. Suggest channel ideas that match where this audience already pays attention. End with a short sales handoff: the talking points, likely questions, and one clear next step.\n\nIf the brief depends on a customer claim or performance number, mark it as something to confirm before publishing.",
      summary: "Marketing improvement worth preserving: adds audience insights, message variations, and a practical sales handoff.",
      tools: ["web research"],
      mcp_servers: [],
      tags: ["marketing", "campaigns"],
      status: "needs_reapproval",
      created_at: now
    },
    approved_version: {
      id: "ver_release_captain_previous",
      artifact_id: "art_release_captain",
      commit_sha: "9012abc",
      branch_ref: "main",
      content_hash: "sha256:previous-campaign-brief",
      content_snapshot: "---\nname: campaign-brief-builder\ndescription: Turn a campaign idea into an audience-first brief with messages and channel ideas.\n---\n\nName the audience, the problem they want solved, and one clear campaign promise. Suggest messages and channel ideas in the customer’s language.",
      summary: "Published shared version with a simple audience, message, and channel-planning workflow.",
      tools: [],
      mcp_servers: [],
      tags: ["marketing", "campaigns"],
      status: "approved",
      created_at: now
    },
    risks: [
      {
        id: "risk_research",
        artifact_id: "art_release_captain",
        artifact_version_id: "ver_release_captain_current",
        kind: "high_impact_tool",
        severity: "low",
        message: "Check any research sources before publishing customer claims for the team.",
        evidence: "web research",
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
        note: "Published as the shared campaign-planning baseline.",
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
      content_hash: "sha256:sales-discovery-current",
      content_snapshot: "---\nname: sales-discovery-prep\ndescription: Prepare a thoughtful account brief and discovery questions before a sales conversation.\n---\n\nSummarize what the account appears to care about, suggest five open discovery questions, and offer a simple call agenda. Avoid inventing facts; label assumptions for the seller to confirm.",
      summary: "Published sales-preparation workflow for clearer, more customer-focused conversations.",
      tools: [],
      mcp_servers: [],
      tags: ["sales", "discovery"],
      status: "approved",
      created_at: now
    },
    approved_version: {
      id: "ver_security_current",
      artifact_id: "art_security_agent",
      commit_sha: "37ff901",
      branch_ref: "main",
      content_hash: "sha256:sales-discovery-current",
      content_snapshot: "---\nname: sales-discovery-prep\ndescription: Prepare a thoughtful account brief and discovery questions before a sales conversation.\n---\n\nSummarize what the account appears to care about, suggest five open discovery questions, and offer a simple call agenda. Avoid inventing facts; label assumptions for the seller to confirm.",
      summary: "Published sales-preparation workflow for clearer, more customer-focused conversations.",
      tools: [],
      mcp_servers: [],
      tags: ["sales", "discovery"],
      status: "approved",
      created_at: now
    },
    risks: [],
    approvals: []
  },
  art_agents_md: {
    ...sampleArtifacts[2],
    current_version: {
      id: "ver_agents_current",
      artifact_id: "art_agents_md",
      commit_sha: "55d0e12",
      branch_ref: "main",
      content_hash: "sha256:customer-voice-current",
      content_snapshot: "---\nname: customer-voice-digest\ndescription: Turn customer feedback into themes and practical next steps for marketing and sales.\n---\n\nGroup feedback by theme, quote the customer’s language, and suggest one message or enablement action for each theme.",
      summary: "A proposed workflow for turning customer feedback into useful marketing and sales insights.",
      tools: [],
      mcp_servers: [],
      tags: ["customer-feedback", "marketing"],
      status: "unreviewed",
      created_at: now
    },
    approved_version: null,
    risks: [
      {
        id: "risk_customer_voice_owner",
        artifact_id: "art_agents_md",
        artifact_version_id: "ver_agents_current",
        kind: "missing_owner",
        severity: "low",
        message: "Assign a marketing or sales owner before publishing this skill.",
        evidence: null,
        created_at: now
      }
    ],
    approvals: []
  }
};
