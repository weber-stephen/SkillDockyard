# Public-beta owner runbook

This is Stephen's operating procedure for a globally technically accessible Skill Dockyard beta. It is not legal advice, an attorney-approved launch package, or a promise that the listed controls eliminate personal liability.

Keep customer information, credentials, tokens, backup contents, request payloads, and incident evidence outside this repository.

## Before enabling self-service signup

Complete and privately record each item below. Do not check off a launch-checklist item until its evidence exists.

1. **Support ownership (OPS-007).** Assign a primary owner, backup owner, and security-incident recipient for `support@skilldockyard.com`. Each person must prove mailbox access by sending and receiving a test message. Set a business-day monitoring schedule, a handoff method for absences, and a private escalation contact list. Do not publicly promise a response time unless it has been approved.
2. **Auth and abuse controls.** In Supabase, require email confirmation, keep anonymous sign-in disabled, configure Cloudflare Turnstile, and verify the production Site URL plus `/auth/confirm` redirect path. In Vercel, set `SELF_SERVICE_SIGNUP_ENABLED=true` only after this runbook is complete. The emergency stop is to set it to `false` and redeploy, then disable Supabase Auth **Allow new users to sign up**.
3. **Monitoring.** Confirm UptimeRobot and Sentry alerts reach the assigned recipients. Test a safe inbound alert or test notification; record the date, recipient, and result privately. Check `/`, `/login`, and `/api/health` from the canonical domain.
4. **Backup and restore (OPS-004, OPS-005).** Before every production migration and on the recurring schedule, create an encrypted logical backup using the approved backup procedure. Keep its age key separately from the archive. Restore only to a disposable local or staging database, then verify schema, migration history, RLS/function grants, and aggregate integrity checks. Never restore over production. The encrypted-backup implementation is tracked separately in PR #14 and must be merged before this migration is applied.
5. **Private registers (OPS-010).** Create private registers for support, rights requests, retention, backups, and incidents. Each row needs an internal ID, date, responsible owner, status, decision/approval, and secure evidence location. The rights-request register additionally needs request type, verified requester, affected workspace, scope decision, exclusions, completion date, and retained categories. The retention register needs data category, purpose, system/provider, owner, trigger, approved period, deletion method, backup lifecycle, and legal-hold exception. Do not include raw customer content in any register.
6. **Exercises.** Complete and privately record: a signup/confirmation/login/recovery test; emergency signup pause; personal-data export request; deletion request from a sole Workspace owner; connected-computer token compromise and `401` verification after revocation; suspected privacy incident; and backup restore. Record the outcome and follow-up, not secrets or customer data.
7. **Launch record.** Record the owner, decision date, production commit SHA, migration version, Vercel deployment, provider settings verified, runbook exercises, and unresolved risks. Stephen must explicitly record whether the beta proceeds with those remaining risks.

## Rights requests and deletion

1. Receive a request through the monitored support address and verify control of the account email before discussing data or changing access.
2. Determine whether the requester is entitled to account, Workspace, shared-skill, or other data. Exclude other users' data and content the requester cannot access.
3. For an export, use an authenticated, time-limited delivery path. The existing **Export skill list** function is not a personal-data export.
4. For deletion, revoke browser sessions, connected-computer tokens, and pending invitations first. A sole Workspace owner becomes an ownership-transfer or recovery case; never silently delete or reassign a Workspace, private draft, share, or audit history.
5. Document information retained for security, disputes, Workspace integrity, legal hold, or backup lifecycle. Do not promise complete or immediate deletion unless the approved policy supports it.
6. Close the record only after the responsible owner records the action, secure evidence, and remaining retention exception.

## Incident handling

Follow [production-operations-runbook.md](production-operations-runbook.md): name an incident lead, contain the affected path, preserve minimal evidence, rotate or revoke affected secrets/tokens, and verify recovery. Notify users only through the approved incident decision process; do not speculate, promise a notification time, or claim a legal threshold has been met without counsel/owner approval.

## Requires counsel/owner decision

- Legal entity, business/registered address, privacy contact, controller/processor role, jurisdiction, insurance, and territory posture.
- Final Privacy Policy and Terms provisions, including user-content license, acceptable use, suspension/termination, IP, disclaimers, liability, governing law, disputes, age/business-use scope, and changes.
- Provider roles, contracts/DPAs, data locations, transfers, retention, and whether a provider is presented as a subprocessor.
- Lawful bases, regional rights, cookie/Turnstile/Sentry treatment, EU/UK representative analysis, retention periods, legal holds, and backup lifecycle.
- Incident-notification triggers, authority, recipients, content, and timing.

## Ongoing cadence

- Every business day: monitor support and incident inboxes.
- Every week: review Sentry and uptime alerts; confirm open requests have an owner.
- Before every production migration: encrypted backup and rollback check.
- On the chosen recurring backup schedule: make and verify an encrypted backup.
- Quarterly: run the exercises above and update this procedure if behavior changed.
- When Terms or Privacy materially change: update their version, deploy the new version, and verify existing users are required to acknowledge it before entering the app.
