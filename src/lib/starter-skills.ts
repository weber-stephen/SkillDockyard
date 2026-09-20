import crypto from "node:crypto";
import { ingestArtifacts } from "@/lib/ingest";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ScanArtifactInput } from "@/lib/types";

const templates = [
  {
    key: "campaign-brief-builder-v1",
    slug: "campaign-brief-builder",
    name: "Campaign Brief Builder",
    description: "Turn a campaign idea into an audience-first brief with messages, channel ideas, and a sales handoff.",
    body: `---
name: Campaign Brief Builder
description: Turn a campaign idea into an audience-first brief with messages, channel ideas, and a sales handoff.
---

# Campaign Brief Builder

Start by naming the audience, the problem they want solved, and the evidence that makes the message believable. Draft one clear campaign promise, then offer three supporting message angles in the customer's language.

Suggest channel ideas that match where this audience already pays attention. End with a short sales handoff: the talking points, likely questions, and one clear next step.

If the brief depends on a customer claim or performance number, mark it as something to confirm before publishing.
`
  },
  {
    key: "customer-voice-digest-v1",
    slug: "customer-voice-digest",
    name: "Customer Voice Digest",
    description: "Turn customer feedback into themes and practical next steps for marketing and sales.",
    body: `---
name: Customer Voice Digest
description: Turn customer feedback into themes and practical next steps for marketing and sales.
---

# Customer Voice Digest

Group the feedback by theme and preserve the customer's own language when it explains a need, objection, or outcome.

For each theme, suggest one message, campaign, or sales-enablement action. Separate what customers said from the team's interpretation, and call out questions that need more research.
`
  },
  {
    key: "sales-discovery-prep-v1",
    slug: "sales-discovery-prep",
    name: "Sales Discovery Prep",
    description: "Prepare a thoughtful account brief and discovery questions before a sales conversation.",
    body: `---
name: Sales Discovery Prep
description: Prepare a thoughtful account brief and discovery questions before a sales conversation.
---

# Sales Discovery Prep

Summarize what the account appears to care about, the problems it may be trying to solve, and the people likely involved in the decision.

Suggest five open discovery questions and a simple call agenda. Avoid inventing facts; clearly label assumptions for the seller to confirm during the conversation.
`
  }
] as const;

export async function installStarterSkills(userId: string, workspaceId: string) {
  const supabase = createServerSupabase();
  const { data: existing, error } = await supabase.from("artifacts").select("source_template_key").eq("created_by_user_id", userId).in("source_template_key", templates.map((item) => item.key));
  if (error) throw error;
  const installed = new Set((existing ?? []).map((item) => item.source_template_key));
  const created: string[] = [];
  for (const template of templates) {
    if (installed.has(template.key)) continue;
    const item = toArtifact(template);
    const result = await ingestArtifacts([item], workspaceId, { createdByUserId: userId, visibility: "private", sourceTemplateKey: template.key });
    created.push(result.artifacts[0].artifactId);
  }
  return { created, skipped: templates.length - created.length };
}

function toArtifact(template: (typeof templates)[number]): ScanArtifactInput {
  return {
    repo: { name: "Starter skills", root_path: "starter-skills", branch_ref: null },
    artifact: { name: template.name, slug: template.slug, type: "claude_skill", path: `skills/${template.slug}/SKILL.md`, description: template.description, owner: null },
    version: { commit_sha: null, content_hash: `sha256:${crypto.createHash("sha256").update(template.body).digest("hex")}`, content_snapshot: template.body, summary: "Added from the Skill Dockyard starter collection.", tools: [], mcp_servers: [], tags: ["starter-template"] },
    risks: []
  };
}
