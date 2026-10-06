# Self-service beta readiness

**Status:** Planned. The current product remains a closed, invitation-only pilot until the implementation and provider tasks below are complete.

This is an operational risk plan, not legal advice, an attorney-approved legal package, or a promise that launch eliminates personal liability.

## Decision

The target launch posture is a free, self-service, business-use-oriented beta that is technically accessible globally. It remains feature-limited: no paid plans, advertising, behavioral analytics, or intentional collection of credentials or sensitive personal data.

Do not describe the service as compliant, attorney-approved, insured, or universally available under every local law unless a qualified adviser has confirmed that claim.

## Exposure snapshot

Ratings reflect the repository and documented provider posture at the time of writing. They are not legal conclusions.

| Exposure | Current rating | What raises it | Beta target |
| --- | --- | --- | --- |
| Privacy and regional compliance | High (5/5) | Incomplete public disclosures, no finalized retention/rights process, and unresolved global-territory assessment. | Moderate-high until qualified counsel completes a fixed-scope review. |
| User content and IP | High (4/5) | Users can add, publish, share, and download skill contents, but the Terms lack final content-license, liability, and dispute provisions. | Moderate after final Terms and clear content restrictions. |
| Personal financial exposure | High (4/5) | Entity, insurance, and final liability allocation are not evidenced in the repository. | Requires owner/adviser decisions; code cannot remove this exposure. |
| Operations and recovery | High (4/5) | Support ownership, Free Plan logical backups, and restore evidence are open. | Moderate after monitoring, backup, restore, and incident exercises are completed. |
| Unauthorized access | Moderate (3/5) | Server authorization, RLS, CAPTCHA, rate limits, hashed tokens, monitoring, and tests exist; residual account/session and user-content risk remains. | Moderate; keep security controls and test regressions. |

## Work to implement

### Codex: self-service beta release

1. Restore the email/password signup form with Turnstile and verified-email confirmation; remove the invitation-only screen, pilot invitation script, and `PILOT_INVITATIONS_ENABLED` setting.
2. Move signup behind a same-origin route that validates Terms and Privacy acceptance, applies the existing abuse-control pattern, invokes Supabase Auth signup with CAPTCHA, and returns a generic response that does not reveal account existence.
3. Add an append-only `legal_acceptances` record through a forward migration. It stores user ID, Terms version, Privacy version, acceptance time, and source. Enable RLS, revoke browser grants, and use server-authorized access only.
4. Add a required signup acknowledgement that links to the active Terms and Privacy versions. Gate authenticated application access until existing users accept the current versions after a material update.
5. Preserve the current permission model: legal acceptance is not an authorization role, and it must never rely on editable Supabase `user_metadata`.
6. Add a public signup-paused state and document the operator pause procedure. The immediate hard stop is Supabase Auth **Allow new users to sign up**; the application UI must not imply that registration is available when it is disabled.
7. Update the architecture map, legal-readiness review, launch checklist, and support copy to accurately describe the self-service beta only after final content and provider evidence are available.

### Stephen: zero-cost operational controls

- Monitor `support@skilldockyard.com` on business days; name a backup and security-incident recipient; test inbound, outbound, and escalation handling. Record the names privately, not in the repository.
- Keep Supabase email confirmation and CAPTCHA enabled; leave anonymous sign-in disabled. Test signup, confirmation, login, password recovery, and the emergency signup pause with controlled accounts.
- Use the existing uptime/Sentry alerts, respond to them, and record material incidents privately.
- Maintain an encrypted local logical-backup schedule before every production migration and on a recurring cadence. Test a restore only in a disposable local or staging environment.
- Maintain a private support/request register for verified access, correction, export, deletion, and security requests. Do not place customer content or personal data in the repository.
- Complete one tabletop exercise covering an account compromise, a connected-computer-token revocation, an export request, a sole-workspace-owner deletion request, and a suspected privacy incident.
- Keep the beta scope narrow in public copy and onboarding: adult business use; no secrets, credentials, sensitive personal data, malware, or content the user lacks the right to share.

### Requires counsel/owner decision

- Legal entity identity, jurisdiction, business address, privacy contact, and whether to obtain insurance.
- Final Privacy and Terms language, including user-content license, acceptable use, suspension, termination, disclaimer, liability, governing law, disputes, retention, and incident language.
- Provider roles, contracts, DPAs, data locations, transfers, retention, and subprocessor presentation.
- Global territorial posture, including any EU/UK representative analysis, regional rights, lawful bases, and cookie/Turnstile treatment.
- Retention periods, backup lifecycle, legal-hold exceptions, deletion/export scope, and incident-notification thresholds.

## Public beta release gates

1. The self-service code, migration, tests, and preview pass review and CI.
2. The public Privacy, Terms, and Support content accurately matches shipped behavior and carries no unsupported legal claims.
3. Support ownership, backup/restore, rights-request, and incident exercises are evidenced privately.
4. The owner explicitly accepts the remaining risks or records qualified counsel’s written review. Do not represent the latter as completed unless it actually is.
5. Enable Supabase self-service signup only after the deployed application and provider settings have been verified together.

## Verification

- Signup requires CAPTCHA, active Terms/Privacy acknowledgement, and email confirmation.
- Direct browser access cannot read or modify legal-acceptance records.
- A user who has not accepted the active document versions cannot enter the authenticated application.
- Existing authorization, personal-workspace provisioning, private-draft isolation, sharing, and invitation behavior remain unchanged.
- Signup pause blocks new registrations while existing users can still sign in and recover access.
- Export/deletion exercises preserve sole-owner, private-draft, share, and audit-history boundaries.
- Production verification includes the automated release suite, Supabase migration/advisor checks, provider setting checks, backup/restore evidence, and a Vercel preview review.

## What this plan does not solve for free

This plan reduces technical and operational risk. It does not establish a legal entity, provide insurance, create final liability protection, decide global legal applicability, or replace qualified legal advice. Those are residual owner risks and must not be described as solved by the product changes.
