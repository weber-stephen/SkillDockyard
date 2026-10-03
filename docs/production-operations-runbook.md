# Skill Dockyard production operations runbook

Use this runbook for incidents affecting `https://skilldockyard.com`. Never paste credentials, tokens, customer skill contents, or personal data into tickets, chat, or this repository.

## Initial triage

1. Name an incident lead and record the start time, affected user journeys, and current production commit.
2. Check Vercel deployment health, `/api/health`, Sentry errors, Supabase service health, Upstash availability, and auth email delivery.
3. Classify impact: security or data exposure, complete outage, degraded workflow, or isolated user issue.
4. If customer data or credentials may be exposed, stop the affected workflow, preserve logs, and begin the secret-rotation procedure below.

## Web rollback

1. Identify the last known-good Vercel deployment and its commit SHA.
2. Confirm that its code is compatible with every migration already applied. Do not roll application code back across an incompatible schema change.
3. Promote the last known-good compatible deployment in Vercel.
4. Verify `/`, `/login`, `/demo`, `/api/health`, authentication, and one authorized application page.
5. Record the rollback target, time, reason, and verifier in the incident record.

## Database migration incident

1. Stop the application path that writes affected records; leave unaffected read paths available when safe.
2. Capture the applied migration history and the failing statement without copying customer rows.
3. Prefer a new forward-fix migration. Do not edit an already-applied migration or run an unreviewed down migration.
4. Run the fix in a non-production environment, run migration tests and Supabase advisors, then request explicit production authorization.
5. After applying, verify owner consistency, private-draft isolation, invitation constraints, function grants, and RLS status.

## Secret rotation

1. Revoke or rotate the suspected credential at its provider first.
2. Update the replacement in the correct Vercel environment. Never prefix a secret with `NEXT_PUBLIC_`.
3. Redeploy when the secret is read at build time; otherwise verify the new runtime configuration.
4. Revoke active sessions or connected-computer tokens when their trust boundary may have been affected.
5. Search logs and build artifacts for accidental exposure and document scope without recording the secret value.

## Connected-computer token revocation

Users can revoke a connection under **Workspace settings → Connected computers**. For incident-wide containment, revoke the affected hashed token records server-side, confirm `revoked_at` is set, and verify the old bearer token returns `401`. Pairing codes are single-use and should be expired or deleted if a pairing flow is affected.

## Customer communication

Use the monitored support address and approved incident template. State what happened, which workflows or data were affected, containment status, required customer action, and the next update time. Do not speculate or include another customer’s information. Legal review is required before notifying users of a security or privacy incident.

## Recovery verification

- Error and latency levels have returned to normal.
- Authentication and transactional email work.
- A new user receives one personal workspace and owner membership.
- Review, sharing, download, and connected-computer checks enforce the expected permissions.
- Audit events and alerts appear without sensitive payloads.
- The production commit, deployment, migration version, and incident timeline are recorded.
