# Legal governance register

This directory is the repository source of truth for Skill Dockyard's legal-readiness decisions, risks, document status, provider posture, and evidence references. It is an operational control, not legal advice, a legal opinion, a compliance certification, or a substitute for qualified counsel.

Use it to keep product and operational changes within recorded constraints. Codex must treat every item marked **Requires counsel/owner decision** as unresolved and must not convert it into public copy, a product claim, or a provider configuration without recorded approval and evidence.

## Rules

- Record decisions, owners, dates, statuses, and links to evidence. Do not store customer data, credentials, tokens, backup contents, contracts, legal correspondence, or private contact details here.
- A decision is not approved merely because it appears in this repository. Record the approving owner or counsel reference in the evidence register.
- Do not describe Privacy, Terms, support coverage, regional availability, security, insurance, retention, or provider roles more broadly than the relevant register supports.
- When a material legal, privacy, data, security, provider, public-copy, or launch-scope change is proposed, update the affected register before implementation and follow [change-control.md](change-control.md).
- Preserve historical entries. Add a new row or decision rather than silently changing a prior recorded position.

## Register map

| Register | Records |
| --- | --- |
| [decisions.md](decisions.md) | Owner and counsel decisions, including explicit unresolved positions. |
| [risks.md](risks.md) | Prioritized legal, privacy, operational, and launch risks. |
| [documents.md](documents.md) | Status and version of public legal/support documents. |
| [providers.md](providers.md) | Observed provider role and unresolved contract, region, and transfer questions. |
| [evidence.md](evidence.md) | Non-sensitive evidence references for decisions and release gates. |
| [change-control.md](change-control.md) | Required review path for future changes. |

## Current posture

- Target: free, business-use-oriented self-service beta that is technically globally accessible.
- Current legal posture: public documents are not attorney-approved; global launch, final regional posture, retention, incident-notification, and provider-contract decisions remain open.
- Current technical safeguard: public signup stays paused unless the server-only `SELF_SERVICE_SIGNUP_ENABLED=true` flag and Supabase Auth signup setting are both deliberately enabled.

See [../legal-readiness-review.md](../legal-readiness-review.md), [../self-service-beta-readiness.md](../self-service-beta-readiness.md), [../public-beta-owner-runbook.md](../public-beta-owner-runbook.md), and [../production-launch-checklist.md](../production-launch-checklist.md) for the underlying implementation and release procedures.
