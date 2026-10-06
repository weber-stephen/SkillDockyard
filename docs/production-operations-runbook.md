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

## Supabase logical backups

The Supabase Free Plan does not provide managed project backups. The repository includes an encrypted local backup skill at [`.agents/skills/supabase-backup/SKILL.md`](../.agents/skills/supabase-backup/SKILL.md) and the `npm run backup:supabase` command.

### Backup policy

1. Stephen is the backup owner until a second operator is explicitly assigned.
2. Run `npm run backup:supabase` before every production migration and on the recurring schedule recorded under `OPS-004` in the [production launch checklist](production-launch-checklist.md).
3. Store encrypted archives and the age private key in separate locations. Never store either in Git, issues, logs, or customer-support messages.
4. The dump covers the Postgres roles, schema, and data. It is not a backup of Supabase Storage API objects; handle any future Storage objects separately.
5. Keep the archive checksum with the backup inventory, but do not record `SUPABASE_DB_URL`, database passwords, or private keys.

### Restore verification

1. Select a known backup and verify its checksum before decrypting it.
2. Restore only into a disposable local or staging database. Never restore over production as a launch exercise.
3. Decrypt the archive with the matching age private key and unpack it into a temporary directory.
4. Restore roles, schema, and data using the Supabase logical restore procedure and a single transaction where supported. A local verification may need the matching Supabase Postgres image for provider-managed Auth and Storage schemas.
5. Verify migration history, RLS/function grants, owner consistency, private-draft isolation, invitation constraints, and the aggregate integrity queries used by `DATA-012`. Record any provider-managed schema sections that could not be replayed locally; do not claim a full provider restore from a partial local replay.
6. Record the backup timestamp, restore target, verifier, and result in the launch record without recording customer rows or credentials.

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
