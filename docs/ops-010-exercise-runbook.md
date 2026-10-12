# OPS-010 exercise runbook

This runbook makes the OPS-010 launch gate executable without treating a rehearsal as legal approval. It is an internal operating procedure. Do not store customer data, test-account credentials, API keys, raw exports, incident payloads, backup archives, or secure-delivery links in this repository.

## Gate status

**Status: Open.** The request, deletion, backup, and incident procedures exist, but no complete controlled exercise has been recorded. OPS-010 cannot be closed until every exercise below has evidence and the retention and incident-notification decisions have an accountable owner decision or counsel approval.

The current product does **not** offer self-service personal-data export or account deletion. The existing **Export skill list** feature is not a personal-data export. Do not represent it as one.

## Safety rules

- Use a dedicated verified test account and a test-only Workspace; never use a customer account or customer content.
- Start with the local Supabase acceptance environment. Repeat only the production-specific steps against the deployed application after the owner authorizes the controlled account and has mailbox access.
- Do not run a real security incident, delete a production account, overwrite a backup, or send incident notices as an exercise.
- Record only an exercise identifier, date, operator, pass/fail outcome, secure evidence location, and follow-up in the private register.
- Stop immediately if ownership, authorization, the requester identity, or the affected data scope is unclear.

## Required private registers

Create these outside the repository before beginning. A password manager secure note or a private access-controlled document is sufficient for this solo-maintainer stage.

| Register | Minimum fields |
| --- | --- |
| Rights requests | Internal ID, received date, request type, verified requester, affected account/Workspace, authorization decision, handler, approval, scope/exclusions, completion date, retained categories, secure evidence location. |
| Retention | Data category, purpose, system/provider, accountable owner, trigger, approved period, deletion method, backup lifecycle, legal-hold exception, decision reference. |
| Incidents | Internal ID, start time, incident lead, affected workflows, containment action, evidence location, decision authority, communication decision, recovery verifier, follow-up. |
| Exercises | Exercise ID, environment, test-account identifier, operator, start/end time, result, secure evidence location, cleanup confirmation, follow-up. |

Do not record raw request messages, names, email addresses, skill contents, tokens, passwords, or provider credentials in any repository record.

## Exercise sequence

Perform the exercises in this order. A failed or blocked step is evidence, not a reason to skip it.

### 1. Local procedure and authorization check — OPS010-LOCAL

1. Run the repository verification suite, including the local Supabase acceptance tests.
2. Confirm the test account has one personal Workspace and that the owner membership matches `workspaces.owner_user_id`.
3. Confirm the test account has no customer content and document the intended cleanup path.
4. Record the test-account identifier privately.

**Pass:** local tests pass; the account and Workspace relationship can be identified without guessing.

### 2. Verified request and scoped export rehearsal — OPS010-EXPORT

1. Send a test request from the controlled account’s verified mailbox to `support@skilldockyard.com` with the subject `Privacy request — test`.
2. Verify control of that mailbox without asking for a password, token, pairing code, or skill content.
3. Build a scope inventory for the test account: account record, Workspace membership, skills and versions, submissions, shares, invitations, audit events, download/install records, browser-local data, and provider-held records.
4. Exclude content belonging to other users or Workspaces. Record exclusions and the reason.
5. Create the approved export through a secure, authenticated, time-limited delivery path. The artifact must be scoped and reviewed before delivery; do not email it as an attachment.
6. Confirm the controlled account can access the artifact, then expire/revoke the delivery path and record the result.

**Pass:** requester verification, scope, exclusion, secure delivery, expiry, and evidence are all recorded.

**Current product gap:** there is no built-in personal-data-export endpoint. Until one exists, this is an operator-run procedure and requires a narrowly scoped, reviewed data retrieval plan. Do not use the workspace skill-list export as a substitute.

### 3. Sole-owner deletion decision rehearsal — OPS010-DELETE

1. Use a controlled account that is the sole owner of a test Workspace.
2. Submit a test deletion request from its verified mailbox and verify the requester.
3. Identify private drafts, published Workspace skills, shares, submissions, audit history, memberships, sessions, connected-computer tokens, and pending invitations.
4. Revoke active sessions where the provider supports it, revoke connected-computer tokens, and revoke pending invitations according to the approved operator procedure.
5. Verify that the sole-owner Workspace is **not** silently deleted, reassigned, published, rejected, or otherwise changed by the request.
6. Record the required next state: ownership transfer, owner recovery, approved retention exception, or a separately authorized account-deletion operation. Do not perform irreversible deletion without that decision.

**Pass:** access-containment actions are verified; the Workspace, skills, shares, and audit history are preserved; the decision point is documented.

**Current product gap:** no self-service account deletion exists. This exercise must demonstrate safe containment and the refusal to silently remove a sole owner, not claim complete deletion.

### 4. Retention and backup trace — OPS010-RETENTION

1. Populate the retention register for every category named in the data inventory, including Supabase Auth and database records, Vercel logs, Resend, Turnstile, Sentry, Upstash, Namecheap support forwarding, local browser data, and encrypted backups.
2. For each category, name its purpose, owner, provider, deletion method, and backup lifecycle.
3. Attach an owner decision or counsel reference for each retention period, legal-hold exception, and provider dependency. Do not invent a duration.
4. Select one current encrypted backup, verify its inventory/checksum reference, and confirm that its documented restore path is disposable local or staging—not production.

**Pass:** every category has a decision reference and a traceable disposal/backup path.

**Blocking condition:** OPS-010 remains open until retention periods, exceptions, and incident-notification authority are decided. Neither a test nor an agent may invent them.

### 5. Token-compromise containment rehearsal — OPS010-TOKEN

1. Use a test-only connected-computer token, if that integration is enabled in the environment.
2. Revoke it through the supported Workspace settings path or the approved operator procedure.
3. Verify the old bearer token receives `401` without disclosing the token in a log or evidence record.
4. Confirm the canonical Workspace, skill versions, and audit history remain intact.

**Pass:** the revoked test token no longer authorizes access and the audit record exists.

### 6. Suspected-incident tabletop — OPS010-INCIDENT

1. Use a fictional scenario, such as a potentially exposed test token. Do not expose data or create an actual security event.
2. Follow [production-operations-runbook.md](production-operations-runbook.md): name Stephen as incident lead, record the affected test workflow, contain the simulated path, identify the rollback/revocation action, and perform recovery checks.
3. Verify the support mailbox, Sentry, and uptime alert routes that are already configured; use only safe test alerts.
4. Record that no external notification was sent because notification trigger, authority, recipients, content, and timing remain undecided.

**Pass:** containment, recovery verification, and decision escalation are documented without a real incident or unsupported external communication.

### 7. Backup restore cross-check — OPS010-BACKUP

1. Reuse the latest successful OPS-005 restore evidence when its archive and procedure still match production.
2. If a production migration or backup policy has changed since that evidence, make a new encrypted backup and restore it only to a disposable local or staging target.
3. Verify migration history, RLS/function grants, owner consistency, invitation constraints, and aggregate integrity checks. Do not copy customer rows into the exercise register.

**Pass:** the backup reference, restore target, verifier, and result are recorded; no restore is performed over production.

## Evidence and close criteria

Create a private entry for `OPS010-LOCAL`, `OPS010-EXPORT`, `OPS010-DELETE`, `OPS010-RETENTION`, `OPS010-TOKEN`, `OPS010-INCIDENT`, and `OPS010-BACKUP`. Each entry needs the environment, test-account identifier, result, secure evidence location, cleanup result, and follow-up.

Only mark OPS-010 closed when:

1. Every required exercise has passed or has an explicitly approved exception.
2. The personal-data export and account-deletion scope is executable without relying on the workspace skill-list export.
3. Retention periods, deletion exceptions, backup lifecycle, and incident-notification authority are recorded as an owner or counsel decision.
4. The owner records the final launch decision and residual risks.

Until then, keep self-service signup disabled and do not invite external pilot users under this gate.
