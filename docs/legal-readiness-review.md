# Legal-readiness review — closed B2B pilot

**Status:** Working launch-review package. This is not legal advice and is not attorney-approved.

**Review date:** October 5, 2026  
**Product:** Skill Dockyard  
**Current launch posture:** Closed, invite-only, business-use-oriented pilot for adults. Public self-service signup and global availability are blocked pending qualified counsel review. There are no paid subscriptions, advertising, behavioral profiling, or sale of personal information.

Every item marked **Requires counsel/owner decision** must be resolved before it is represented as final public legal language or the service is opened broadly.

## Executive assessment

The current Privacy, Terms, and Support pages are concise product explanations, not yet a broadly launch-ready legal package. The implementation stores more data and uses more providers than the Privacy page identifies. It has no self-service account-deletion or personal-data-export workflow, no defined retention schedule, no accepted final legal identity or governing-law posture, and no published subprocessor/transfer framework.

Global availability does not itself establish that no local representative is required. Qualified counsel must assess territorial scope and any EU/UK representative or similar obligation before inviting users in those regions. The pilot must not claim a representative exemption, compliance certification, or a statutory response time.

## Evidence-based inventory

### Public legal and support surfaces

| Surface | Current behavior | Review result |
| --- | --- | --- |
| `/privacy` | General collection, use, provider, retention, and contact statements. | Incomplete for the implementation and broader launch. |
| `/terms` | General account, workspace, availability, and acceptable-use statements. | Missing material user-content, IP, suspension, termination, governing-law, dispute, and limitation provisions. |
| `/support` | Support, account recovery, and security-report guidance. | Updated in this branch with verified privacy-request and connected-computer guidance; monitored ownership remains unconfirmed. |
| Signup | Public self-service signup is closed. Controlled operators can use a server-only Supabase Auth invitation after the documented legal gates are complete. | No in-product Terms acceptance or versioned acceptance record; counsel must approve the pilot-agreement process before any external invitation. |

### Information processed in the application

| Category | Evidence and purpose | User control / retention status |
| --- | --- | --- |
| Account and authentication data | Supabase Auth email/password accounts, confirmation, recovery, sessions, and verified-email checks. | Password reset exists. No self-service account deletion or personal-data export. |
| Workspace and member data | Workspace names, roles, membership email addresses, invitations, ownership records, onboarding state, and settings. | Invitations can be accepted, declined, or revoked; no documented lifecycle after account deletion. |
| Skills and user content | Full skill snapshots, metadata, repository names/paths, commit references, descriptions, reviews, submissions, risk evidence, and version history. `content_snapshot` stores submitted skill instructions. | Owners/reviewers can manage publication and sharing; no retention or deletion policy. Users must be warned not to submit data they lack rights to share. |
| Sharing and audit data | Shares, target emails/workspaces, invite states, review decisions/notes, actor details, timestamps, download/export audit records, and notifications. | Revocation removes future access but preserves history. Retention is undefined. |
| Connected-computer records | One-time pairing-code hashes; hashed 90-day bearer-token records, hints, expiry, revocation, last use; installation records include device ID, target, content hash, and timestamps. | Browser UI can revoke connected-computer tokens. The raw bearer token is stored locally in the command configuration file with restrictive permissions where supported. |
| Download and install activity | Browser/command download records, target, version, source, and timestamps; command installation/check reports. | No user-facing retention or export scope for activity data. |
| Browser-local data | Demo private-draft metadata is stored in local storage. Download history stores skill ID, target, content hash, and timestamp in local storage. | Demo draft UI can clear drafts; no general browser-storage notice or control for download history. |
| Security and reliability data | Sentry receives scrubbed errors; request cookies, bodies, and headers are removed, and user context is reduced to an internal ID. Upstash rate-limit keys and provider logs may process request-derived information. | This branch disables Sentry performance tracing (`tracesSampleRate: 0`) pending counsel’s cookie/telemetry classification. |

### Providers and subprocessors to verify

| Provider | Observed role | Requires counsel/owner decision |
| --- | --- | --- |
| Vercel | Web hosting and deployment platform. | Contracting entity, data locations, log retention, and transfer mechanism. |
| Supabase | Authentication, Postgres database, session cookies, email-confirmation/recovery flow, and storage of application records. | Contracting entity, region, backup/retention behavior, DPA, and transfer mechanism. |
| Resend | SMTP delivery for Supabase Auth transactional email. | Whether it receives only Auth email data, its DPA, region, retention, and transfer mechanism. |
| Cloudflare Turnstile | Bot protection on signup, login, and password recovery. | Cookie/device-signal classification, notice/consent treatment, DPA, and transfer mechanism. |
| Sentry | Scrubbed error monitoring and source-map upload. | Error event fields, retention, region, DPA, and transfer mechanism. Performance tracing is disabled in this branch. |
| Upstash | Shared production rate limiting. | Key/data content, retention, region, DPA, and transfer mechanism. |
| npm / GitHub | Command-package distribution and release workflow. | Whether either is a processor for customer personal data in the final flow. |

Do not state that every listed provider is a legal “subprocessor” until counsel confirms controller/processor roles and contracts. No product analytics SDK, advertising SDK, or custom marketing-cookie code was found in the reviewed source.

## Document-to-implementation comparison

### Privacy Policy gaps

- The current provider statement omits provider names and does not describe authentication cookies, Turnstile, Sentry, Upstash, local browser storage, connected-computer token records, installation records, or raw skill-content snapshots.
- The current statement says users may request access, correction, export, or deletion but does not describe verification, scope, sole-owner/workspace effects, audit-history preservation, backups, or operational handling.
- “While your account is active and as needed” is not a defined retention schedule and should not be presented as one.
- It lacks controller identity, contact/address, applicable scope, lawful bases, international-transfer treatment, regional rights, complaint options, security-incident language, children/age position, and change/effective-date process.
- It should distinguish service-provider processing from sharing with other workspace members and skill-share recipients.

### Terms gaps

- The current Terms do not establish a clear user-content ownership position or the limited license needed to host, scan, review, publish, share, download, and deliver skills.
- They lack an explicit restriction on submitting credentials, sensitive personal data, malware, or content the user lacks the right to share.
- They lack account eligibility, suspension/termination, effect of termination, IP/feedback, disclaimer, limitation-of-liability, governing-law, dispute, and change-notice sections.
- They say workspace owners and reviewers “control publishing and access,” which should be aligned with the documented role model without implying that a skill share transfers ownership.
- Signup has no acceptance control or evidence of acceptance to a versioned Terms/Privacy notice.

### Support and terminology gaps

- The Support page previously did not describe privacy-request verification or token-revocation guidance. This branch adds both without promising an unsupported deadline or outcome.
- The public pages use “skills,” “workspace,” “share,” and “connected computer” where appropriate. Proposed copy must retain those terms and avoid internal labels such as artifact, proposal, MCP server, and CLI in primary user-facing text.

## Prioritized findings

### P0 — launch blockers

1. **OPS-009 — counsel approval is absent.** No counsel-approved Privacy Policy, Terms, retention language, subprocessor posture, controller identity, governing law, or dispute posture exists. Do not launch broadly or represent the current pages as final.
2. **OPS-007 — support ownership is unverified.** `support@skilldockyard.com` is public but no evidence confirms monitoring, ownership, escalation coverage, or incident recipient.
3. **OPS-010 — elevate to P0 for global availability.** Define and test a verified workflow for access, correction, export, deletion, retention, backup handling, and security/privacy incident notification. The existing checklist calls OPS-010 P1; global availability makes its privacy portions P0.
4. **Global territorial scope and representation are unresolved.** Counsel must assess EU/UK and other regional applicability, any representative requirement, data-transfer mechanism, and notices before enabling or marketing to those users.
5. **Privacy disclosures are materially incomplete.** The public policy does not match stored skill content, device/installation records, local storage, authentication cookies, or named providers.

### P1 — complete before broader scale

1. Add versioned Terms and Privacy acceptance at signup and retain an appropriate acceptance record.
2. Define the account-deletion decision tree, including a sole workspace owner, private drafts, shared skills, members, audit records, live tokens, backups, and legal holds.
3. Provide a scoped personal-data export distinct from the existing workspace skill-list export.
4. Give users a browser-storage explanation and a way to clear download-history data if it remains enabled.
5. Establish an owner-recovery process consistent with AUTH-007 and the permissions model.

### P2 — improve after the pilot baseline

1. Publish a separate cookie/telemetry notice if counsel requires one after provider classification.
2. Create a public subprocessor/change-notice process if contracts or customer expectations require it.
3. Add a security-report acknowledgement target and status process after support coverage is established.

## Proposed public text for counsel review

The following is clause-level drafting input only. It must be completed with the legal entity, address, regional scope, effective date, and counsel-approved rights/transfer language before publication.

### Privacy Policy proposed sections

1. **Who we are and scope.** “Skill Dockyard is operated by **[legal entity and address — Requires counsel/owner decision]**. This Privacy Policy explains how we process personal information when you use Skill Dockyard.”
2. **Information we process.** Identify account/contact information; workspace and invitation information; skills, versions, reviews, and sharing records; connected-computer, download, and installation records; support communications; local browser data; security/reliability data; and provider-supplied technical data.
3. **How we use information.** Limit purposes to providing and securing the service, operating workspace/review/sharing workflows, responding to requests, preventing abuse, maintaining reliability, and complying with legal obligations. **Requires counsel/owner decision:** lawful bases and regional wording.
4. **How information is shared.** Explain sharing with authorized workspace members and skill-share recipients, and list verified service providers by name and role. Do not call providers subprocessors or make transfer claims until contracts are reviewed.
5. **Retention and deletion.** “We retain information according to documented retention practices that are still being finalized. Some records may be retained where necessary for security, legal obligations, dispute resolution, and workspace integrity.” Replace this interim wording only after counsel approves a schedule.
6. **Your choices and requests.** Direct users to the monitored privacy/support contact; explain identity verification and that requests may affect shared workspaces or records subject to retention obligations. **Requires counsel/owner decision:** rights, deadlines, complaints, and response process by region.
7. **International data transfers, security, children, and changes.** Each needs counsel-approved language. Do not promise absolute security or describe unverified safeguards.

### Terms of Service proposed sections

1. **Eligibility and account responsibility.** Limit the pilot to adults using the service for business or professional purposes; require accurate information and credential protection.
2. **User content and permission to operate.** “You retain rights you hold in skills and other content you submit. You grant us the limited permission needed to host, process, review, publish, share, deliver, and secure that content as directed through the service.” Counsel must determine the final IP, feedback, and termination language.
3. **Workspace and sharing rules.** Explain that sharing does not transfer ownership, submitted updates remain subject to review, and recipients must have permission to use content they access.
4. **Acceptable use.** Prohibit unlawful use, unauthorized access, interference, malware, credentials/secrets, sensitive personal data, and content that infringes rights or violates confidentiality obligations.
5. **Service changes, suspension, and termination.** Reserve a counsel-approved right to protect the service, users, and providers; specify records/access consequences only after the deletion/retention workflow exists.
6. **Disclaimers, liability, governing law, and disputes.** **Requires counsel/owner decision.** Do not publish placeholder clauses as final terms.

### Support proposed text

Use the published Support page in this branch: a privacy request goes to the monitored support address, identity may be verified, connected-computer connections can be revoked, and security reports must be safe and authorized. It makes no unsupported statutory deadline, deletion guarantee, or promise that support can alter workspace ownership without verification.

## Decisions required from Stephen and counsel

- **Requires counsel/owner decision:** legal entity name, jurisdiction, physical or registered address, privacy contact, and controller/processor roles.
- **Requires counsel/owner decision:** countries/regions actively targeted, whether access is restricted pending review, and EU/UK representative analysis.
- **Requires counsel/owner decision:** lawful bases, cookie/Turnstile/Sentry classification, consent requirements, and whether client error reporting may remain enabled by region.
- **Requires counsel/owner decision:** provider DPAs, locations, transfer mechanisms, backup retention, and subprocessor list.
- **Requires counsel/owner decision:** retention periods for accounts, content, invitations, logs, tokens, downloads/installations, audit records, and backups.
- **Requires counsel/owner decision:** deletion/export rights process; sole-owner and shared-content handling; legal-hold policy; incident threshold, notification content, timing, and authority.
- **Requires counsel/owner decision:** final Terms positions on IP, licenses, suspension, termination, disclaimers, liability, governing law, dispute resolution, and age/consumer scope.
- **Requires owner decision:** monitored mailbox owner, after-hours incident recipient, escalation path, and owner-recovery procedure.

## Counsel-review checklist

- [ ] Confirm the legal entity, controller/processor roles, and mandatory notice details.
- [ ] Confirm launch territories and whether global technical access creates regional compliance or representative obligations.
- [ ] Review data map, local browser storage, authentication cookies, Turnstile, Sentry, and error/telemetry configuration.
- [ ] Verify each provider’s role, contract, DPA, region, retention, and international-transfer mechanism.
- [ ] Approve Privacy Policy disclosures, rights, lawful bases, retention, security, and incident language.
- [ ] Approve Terms provisions for user content, acceptable use, IP, suspension, termination, disclaimers, liability, governing law, and disputes.
- [ ] Approve age/business-use posture and any consumer-law or accessibility requirements.
- [ ] Approve the deletion/export/retention/backup and incident-notification procedures before publication.
- [ ] Confirm whether versioned clickwrap acceptance and a cookie/consent mechanism are required before launch.

## Launch-blocker summary

| Checklist ID | Status | Required evidence before global launch |
| --- | --- | --- |
| OPS-007 | Open P0 | Monitored support address, named owner, incident escalation recipient, and tested inbound handling. |
| OPS-009 | Open P0 | Written qualified-counsel review/approval of final Privacy, Terms, retention, provider, jurisdiction, and regional posture. |
| OPS-010 | Open; privacy portions recommended P0 | Documented and tested verified rights-request, deletion, export, retention, backup, and incident-notification procedure. |
| AUTH-007 | Open P1 | Support-assisted owner-recovery procedure that preserves authorization and audit history. |

## Reviewed evidence

- `AGENTS.md`
- `docs/architecture.md`, `docs/brand-strategy.md`, `docs/permissions.md`, `docs/production-launch-checklist.md`, and `docs/production-operations-runbook.md`
- `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `src/app/support/page.tsx`, signup/auth surfaces, API routes, and public footer
- `src/lib/cli-auth.ts`, `src/cli/state.ts`, ingestion, sharing, workspace administration, exports, downloads, rate limiting, and Sentry configuration
- `supabase/migrations` defining account, workspace, invitation, skill, version, share, audit, token, download, installation, notification, and onboarding records

## Non-finality notice

This review identifies implementation facts and open decisions. It is not a Privacy Policy, Terms of Service, legal opinion, compliance certification, or confirmation that Skill Dockyard is ready for legal launch.
