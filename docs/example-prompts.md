# Example prompts

Reusable content for testing Skill Dockyard submissions, proposal review, trust notes, sharing, and demo screenshots.

## Suggested demo order

1. Submit the Campaign Brief Builder update.
2. Submit Launch Readiness Review and inspect its trust notes.
3. Submit Customer Voice Digest as a new skill.
4. Open the review queue and compare pending proposals.
5. Use Sales Discovery Prep as the clean approved baseline.

## 1. Campaign Brief Builder update

Use this against the existing **Campaign Brief Builder** skill to show version comparison, trust notes, and review.

### What improved?

> Adds customer-language message options, audience evidence, and a concise sales handoff so campaign briefs are easier to activate cross-functionally.

### Skill instructions

```md
---
name: campaign-brief-builder
description: Turn a campaign idea into an audience-first brief with messages, channel ideas, and a sales handoff.
---

Start by identifying the target audience, the problem they are trying to solve, and the evidence supporting that problem.

Create:

1. A single-sentence campaign promise.
2. Three message angles written in the customer’s language.
3. Recommended channels based on where the audience already pays attention.
4. Likely objections and responses.
5. A short sales handoff with talking points, discovery questions, and one clear next step.

Separate verified facts from assumptions. If the brief includes a customer claim, market statistic, or performance number, mark it for confirmation before publishing.
```

- Tools: `web research`
- Owner: `@growth`
- Path: `skills/campaign-brief-builder/SKILL.md`

## 2. Customer Voice Digest

Use this as a new skill to show an unreviewed item that requires ownership.

### Why should this be shared?

> Gives marketing, sales, and product one repeatable way to turn raw customer feedback into evidence-backed themes and actions.

### Skill instructions

```md
---
name: customer-voice-digest
description: Turn customer feedback into themes, representative language, and practical actions for the team.
---

Review the supplied customer feedback and group it into no more than five recurring themes.

For each theme:

- Give it a clear name.
- Summarize the underlying need or frustration.
- Include one short representative quote.
- Distinguish direct customer language from interpretation.
- Suggest one product, marketing, or sales action.
- Identify how confident you are that this is a recurring theme.

Do not invent quotes, merge unrelated feedback, or treat a single comment as a trend. End with the three most important follow-up questions.
```

- Library area: `Customer Marketing`
- Owner: `@customer-marketing`
- Path: `skills/customer-voice-digest/SKILL.md`

## 3. Sales Discovery Prep

Use this as a clean approved example with no risk notes.

### Why should this be shared?

> Helps sellers prepare thoughtful, customer-centered discovery conversations without inventing account facts.

### Skill instructions

```md
---
name: sales-discovery-prep
description: Prepare an account brief, discovery questions, and a focused agenda for a sales conversation.
---

Using only the supplied account research, prepare a concise discovery plan.

Include:

1. What the account appears to care about.
2. Relevant business problems or initiatives.
3. Five open-ended discovery questions.
4. A 30-minute call agenda.
5. Possible objections and neutral follow-up questions.
6. A suggested next step.

Label every assumption clearly. Never invent company facts, customer priorities, budget, timing, or existing relationships. Optimize for learning, not pitching.
```

- Library area: `Sales Enablement`
- Owner: `@revenue`
- Path: `skills/sales-discovery-prep/SKILL.md`

## 4. Launch Readiness Review

Use this to demonstrate trust signals without pasting any real credentials.

### Why should this be shared?

> Standardizes launch readiness checks while making operational dependencies visible before the skill is published to the team.

### Skill instructions

```md
---
name: launch-readiness-review
description: Review a product launch plan for operational, customer, and communication risks.
---

Review the supplied launch plan and produce:

- A readiness summary.
- Missing decisions or owners.
- Customer-impact risks.
- Rollback and monitoring questions.
- Internal communication requirements.
- A final go/no-go checklist.

Use the connected billing system only to confirm whether a referenced pricing or subscription change exists. Do not modify billing data, send messages, deploy code, or approve the launch.

Flag anything that requires human confirmation. Never expose customer records or private account information in the output.
```

- Tools: `stripe`
- Connector: `localhost:3333`
- Owner: `@platform`
- Path: `skills/launch-readiness-review/SKILL.md`

Expected trust notes: high-impact tool and local connector dependency.

## 5. Campaign Brief Builder: rigorous claim handling update

Use this as a second update candidate when you want a more substantive review comparison.

### What improved?

> Adds explicit source labeling, confidence levels, and a pre-publication verification step for customer and market claims.

### Skill instructions

```md
---
name: campaign-brief-builder
description: Turn a campaign idea into an audience-first brief with evidence-backed messages and a sales handoff.
---

Start by identifying the audience, the problem they want solved, and the evidence supporting that problem.

Create:

1. One campaign promise.
2. Three message angles in the customer’s language.
3. Channel recommendations.
4. Likely objections and responses.
5. A short sales handoff.

For every factual claim:

- Label it as verified, supplied, inferred, or unverified.
- Include the source or explain that no source was provided.
- Assign low, medium, or high confidence.
- Mark customer claims, market statistics, and performance numbers for confirmation before publication.

Never turn an assumption into a fact. End with a “Confirm before publishing” section.
```
