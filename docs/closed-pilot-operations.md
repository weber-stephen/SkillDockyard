# Closed-pilot operations

This procedure is retained as historical guidance for a limited, invitation-only Skill Dockyard test. Public self-service beta operations are governed by [public-beta-owner-runbook.md](public-beta-owner-runbook.md). Neither document is legal advice or makes the public legal pages attorney-approved.

## Non-negotiable release gates

Do not invite an external tester until all of the following are evidenced privately:

1. **OPS-007:** `support@skilldockyard.com` has a named primary owner, backup owner, and security-incident escalation recipient; each has tested mailbox access.
2. **OPS-009:** qualified counsel has approved the pilot agreement, Privacy Policy, Terms, pilot audience/territory, provider posture, retention approach, and incident-notification posture in writing.
3. **OPS-010:** the data-rights, deletion, export, retention, backup, and incident procedure below has been approved and exercised.
4. Supabase Auth **Allow new users to sign up** is disabled. Anonymous sign-ins remain disabled. Confirm the canonical `/auth/confirm?next=/reset-password` URL is allowlisted.

These gates are intentionally stricter than hiding the signup form. A public Supabase Auth client can otherwise still call the signup endpoint.

## Controlled pilot invitation

1. Confirm the tester is an approved adult business participant and has completed the counsel-approved pilot-agreement process. Record the applicable agreement version in the private pilot register.
2. Use the provider's controlled-account invitation process only if it remains enabled in the production configuration. Do not add an operator credential or invitation token to browser-visible configuration.
3. Record the recipient, authorization source, invitation time, and responsible operator in the private pilot register. Do not store the register in this repository.
4. The recipient uses the provider invitation email to confirm their address and set a password. Test this flow with a controlled account before inviting anyone external.
5. For a failed, expired, or misdirected invitation, do not bypass verification. Revoke or remove the Auth user through the approved operator process, document the outcome, and issue a fresh invitation only after re-approval.

Pilot-account invitations create an account only. They do not grant workspace membership or skill access. Workspace invitations and skill shares keep their existing authorization rules.

## Support and security handling

- Monitor the support mailbox on the documented U.S. Pacific business-day schedule. The internal acknowledgement target is the next business day; do not publish an SLA until counsel/owner approves one.
- Verify the requester before discussing account data, changing access, or handling an ownership-recovery request. Do not accept passwords, access tokens, pairing codes, or private skill contents by email.
- Route suspected incidents immediately to the designated incident recipient and follow [production-operations-runbook.md](production-operations-runbook.md). Preserve only necessary evidence and do not notify affected users without the approved incident decision process.

## Data-rights and lifecycle procedure

Maintain a private request register with request ID, request type, verified requester, affected workspace, authorization decision, handler, approval, completion time, exceptions, and secure-delivery/deletion evidence. Do not put request payloads or personal data in this repository.

1. **Intake and verification:** receive the request through the monitored address; verify control of the account email and determine whether the requester is entitled to the requested workspace data.
2. **Scope:** identify account data, workspace membership, skills, submissions, shares, download/install activity, connected-computer records, support history, audit records, provider records, and browser-local information. Exclude other users’ data and content the requester cannot access.
3. **Export:** deliver only approved data through an authenticated, time-limited channel to the verified account. Existing skill-list export is not a personal-data export.
4. **Deletion:** revoke browser sessions, connected-computer tokens, and pending invitations first. A sole workspace owner’s request becomes an owner-recovery/transfer case; never silently delete or reassign a workspace, private draft, share, or audit history.
5. **Retention and backups:** apply only counsel-approved retention rules. Document records preserved for security, legal, dispute, backup, or workspace-integrity reasons and when the backup lifecycle removes them.
6. **Close:** record the action, remaining retained categories, and approval. Do not promise deadlines, deletion completeness, or notification obligations not approved by counsel.

## Retention register and incident exercise

Before pilot use, create a private retention register for accounts, workspaces/members, skills/versions, invitations, audit records, tokens, download/install records, support requests, provider logs, and backups. For each, record purpose, owner, trigger, approved period, deletion method, provider dependency, and legal-hold exception.

Run and record a tabletop exercise covering a verified export, a deletion request from a sole workspace owner, a lost connected-computer token, and a suspected privacy incident. Counsel/owner must approve notification authority, triggers, content, recipients, and timing before any notice is sent.
