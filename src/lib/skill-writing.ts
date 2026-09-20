import matter from "gray-matter";

export const skillTemplate = `---
name: My Skill
description: Explain when this skill should be used and what outcome it creates.
---

# My Skill

## When to use this skill

Describe the request or situation that should trigger this skill.

## Instructions

1. Start with the information the user provides.
2. Complete the work in clear, repeatable steps.
3. Return the expected result.

## Boundaries

State what the skill must not assume, expose, or change.

## Example

Show a short example input and the expected output.
`;

export interface WritingCheck { label: string; complete: boolean; required: boolean }

export function getSkillWritingChecks(content: string): WritingCheck[] {
  let data: Record<string, unknown> = {};
  let body = content;
  try { const parsed = matter(content); data = parsed.data; body = parsed.content; } catch { /* Show incomplete checks for malformed frontmatter. */ }
  const headings = body.toLowerCase();
  return [
    { label: "Clear skill name", complete: typeof data.name === "string" && Boolean(data.name.trim()), required: true },
    { label: "Description explains when to use it", complete: typeof data.description === "string" && data.description.trim().length >= 20, required: true },
    { label: "Repeatable instructions", complete: /(^|\n)(##?\s+)?(instructions|steps)|(^|\n)\s*1[.)]\s+/im.test(body), required: true },
    { label: "Boundaries or safety notes", complete: headings.includes("boundar") || headings.includes("must not") || headings.includes("avoid "), required: false },
    { label: "Example input or output", complete: headings.includes("example"), required: false }
  ];
}
