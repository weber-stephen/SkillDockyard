# Legal-governance change control

Use this workflow before changing product behavior or public copy that affects privacy, legal posture, security commitments, providers, retention, user content, territory, accounts, Workspaces, sharing, invitations, exports, deletion, monitoring, or incident handling.

1. **Classify the change.** Identify the affected decision, risk, document, provider, evidence item, and launch checklist ID. If none exists, add one before implementation.
2. **Check authority.** If the change touches an item marked **Requires counsel/owner decision**, do not infer approval. Obtain and record the owner/counsel decision first.
3. **Update implementation facts.** Keep architecture, data map, public copy, support procedure, and tests consistent with the shipped behavior. Do not make a public claim that the evidence register cannot support.
4. **Review privacy and security impact.** Confirm data categories, user controls, retention, provider involvement, authorization, logging, and incident implications. Use server-enforced permissions and preserve audit history where required.
5. **Record release evidence.** Add a dated evidence row after tests, provider checks, exercises, or counsel/owner approval complete. Keep private materials outside the repository.
6. **Reassess launch status.** Update the risk register and launch checklist. Do not close P0 items without the required evidence.

## Mandatory counsel/owner review triggers

- New country targeting, global marketing, a new legal entity/contact, or consumer-facing scope.
- New provider, data category, cookies/telemetry, advertising, analytics, payment flow, or international transfer.
- Changes to Privacy, Terms, retention, deletion, export, acceptable use, user-content rights, suspension, liability, disputes, or incident notification.
- A change that collects credentials, sensitive personal data, health/financial data, or material user-content beyond the documented scope.
- A change to ownership recovery, account deletion, Workspace membership, sharing, invitations, or connected-computer tokens.

## Codex guardrail

Codex should implement documented, authorized decisions and flag conflicts with this register. It must not claim legal approval, compliance, insurance coverage, statutory rights, or risk elimination unless an evidence entry explicitly supports that exact claim.
