# Handoff prompt — OPS-009 through OPS-012

You are preparing and, where authorized, evidencing the remaining public-test operational gates `OPS-009`, `OPS-010`, and `OPS-012` for Skill Dockyard.

First, read these files completely:

1. `AGENTS.md`
2. `docs/architecture.md`
3. `docs/permissions.md`
4. `docs/production-launch-checklist.md`
5. `docs/self-service-beta-readiness.md`
6. `docs/legal-readiness-review.md`
7. `docs/ops-010-exercise-runbook.md`
8. `docs/production-operations-runbook.md`

## Scope and non-negotiable boundaries

- This is a public test, not a claim of broad commercial or global availability.
- Do not provide legal advice, claim counsel approval, or mark `OPS-009` complete without Stephen supplying qualified counsel's written approval.
- Do not invent retention periods, statutory deadlines, incident-notification commitments, a legal entity, jurisdictions, or territorial conclusions. Identify these for owner/counsel decision instead.
- Keep customer data, credentials, tokens, raw requests, backup contents, and private support records outside the repository.
- Do not change production provider settings, enable/disable signup, or alter legal copy without explicit owner authorization for that exact change.
- If Supabase, Auth, migrations, or database settings are involved, read the repository Supabase skill and current official Supabase documentation before acting.
- Preserve the workspace permission model. Legal acceptance never becomes an authorization role and must not use editable user metadata.
- Work on a focused feature branch and PR; never commit directly to `main`.

## Objectives

### OPS-009 — Counsel and public documents

1. Inventory the current Privacy, Terms, and Support surfaces against the actual shipped behavior and provider list.
2. Prepare a concise evidence packet for counsel: product scope, data categories, providers/subprocessors, authentication/signup behavior, retention/deletion/export gaps, incident process, and the proposed territorial posture.
3. Identify every unresolved owner/counsel decision in a checklist. Do not make the decision yourself.
4. When Stephen provides written counsel approval, record only the approval reference, approved document versions, scope, date, and any constraints—never privileged advice or personal data—in the launch evidence.

### OPS-010 — Operational exercises and records

1. Use `docs/ops-010-exercise-runbook.md` to prepare private, non-repository evidence templates for:
   - account/data export;
   - deletion request, including a sole workspace owner;
   - retention and backup lifecycle decision;
   - suspected privacy/security incident;
   - connected-computer token compromise and revocation, if applicable.
2. Run only exercises for which Stephen has explicitly authorized the affected environment and test accounts. Never use real customer data or delete/alter production data without explicit authorization.
3. Record outcome, owner, date, secure evidence location, constraints, and follow-up privately. Keep the repository limited to a concise non-sensitive completion note.
4. Keep ownership, private drafts, shares, and audit history intact during every exercise; fail closed rather than improvising destructive remediation.

### OPS-012 — Self-service signup verification

After OPS-007, OPS-009, and OPS-010 are actually evidenced, verify the deployed application and providers together:

1. `SELF_SERVICE_SIGNUP_ENABLED=true` only in the Vercel Production environment.
2. Supabase Auth **Allow new users to sign up** enabled, email confirmation required, anonymous sign-in disabled, and CAPTCHA enabled.
3. `/signup` requires current Terms/Privacy acknowledgement and a valid Turnstile flow.
4. A controlled new account can sign up, confirm email, sign in, receive one personal workspace, and access the app.
5. Password recovery remains functional.
6. The emergency pause works: set the app flag false and disable Supabase signup, verify registration is unavailable while existing sign-in/recovery continue, then restore the approved state only with explicit authorization.

Do not run the pause against production without explicit owner authorization and a short maintenance window. Use no personal accounts or secrets in screenshots, logs, or repository files.

## Deliverables

- A concise owner/counsel decision list and non-sensitive evidence references.
- Any required documentation updates, with no unsupported legal claims.
- Verification results for authorized operational exercises and signup behavior.
- Checklist updates only for gates with real evidence.
- A PR summary that distinguishes: completed work, work awaiting Stephen, work awaiting counsel, and residual risk.

If counsel approval or an owner decision is missing, leave the gate open and report exactly what is needed. Do not treat a passing test suite as legal or operational approval.
