# Skill Dockyard production launch checklist

This is the shared go-live checklist for Codex and Stephen. The canonical production domain is **[skilldockyard.com](https://skilldockyard.com)**.

Use this document together with [production-launch-plan.md](production-launch-plan.md). The plan explains how to implement each checklist item; this file records whether the launch bar has actually been met.

## How to use this checklist

- Leave an item unchecked until its verification step has passed in the relevant environment.
- Add a short dated evidence note beneath completed items when the result is not obvious from the repository. Link to the pull request, deployment, dashboard result, or run log when possible.
- Never paste secrets, session cookies, invite tokens, service-role keys, SMTP credentials, or npm tokens into this file.
- **Codex** means repository implementation and automated verification.
- **Stephen** means account ownership, billing, provider settings, legal approval, or a business decision.
- **Joint** means Codex can perform the technical work after Stephen supplies access, selects a provider, or explicitly authorizes a production mutation.
- Any unchecked **P0** item is a launch blocker. Do not invite production users while a P0 item remains open.

## Production facts and decisions

- [x] **LAUNCH-001 — P0 — Stephen:** Purchase the canonical domain `skilldockyard.com`.
  - Evidence: Stephen confirmed ownership on October 3, 2026.
- [x] **LAUNCH-002 — P0 — Stephen:** Decide the first rollout audience: a named invite-only pilot cohort or unrestricted self-service signup.
  - Evidence: The current release is a closed, invite-only pilot. Stephen selected self-service beta as the next target; implementation and release gates are documented in [self-service-beta-readiness.md](self-service-beta-readiness.md) and are not yet complete.
  - Record the decision and initial user list outside the repository if it contains personal information.
- [x] **LAUNCH-003 — P0 — Joint:** Confirm `https://skilldockyard.com` is the only canonical production origin.
  - `https://www.skilldockyard.com` redirects permanently to the canonical origin.
  - Preview deployments remain non-canonical and are not indexed.
  - Evidence: Canonical apex and `www` redirect configuration confirmed on October 5, 2026.
- [ ] **LAUNCH-004 — P1 — Stephen:** Complete professional trademark clearance for **Skill Dockyard** before broad public promotion.
- [ ] **LAUNCH-005 — P0 — Joint:** Record the launch decision, approver, production commit SHA, database migration version, web version, CLI version, and launch time in the launch record at the bottom of this document.

## 1. Source control and release gates

- [x] **REL-001 — P0 — Codex:** Create a dedicated launch-readiness branch without overwriting unrelated or uncommitted work.
  - Evidence: Created `launch/production-readiness` from the existing `prod` preparation commit on October 3, 2026.
- [x] **REL-002 — P0 — Codex:** Upgrade the supported runtime to Node.js 22 or later everywhere.
  - Evidence: `package.json`, `.node-version`, CLI build target, CI, publish workflow, and README now require Node 22 (minimum 22.12 where package engines apply).
  - Update `package.json` engines, CLI build target, GitHub Actions, local documentation, and Vercel runtime settings.
- [x] **REL-003 — P0 — Codex:** Upgrade production dependencies to patched, mutually compatible releases and commit the lockfile.
  - Evidence: Patched framework and parser dependencies; replaced vulnerable glob/frontmatter packages; `npm audit --omit=dev --audit-level=high` reported zero vulnerabilities on October 3, 2026.
  - `npm audit --omit=dev` reports no unresolved critical or high vulnerabilities, or an explicitly documented exception is approved by Stephen.
- [x] **REL-004 — P0 — Codex:** Replace the obsolete `next lint` script with a working ESLint command and configuration.
  - Evidence: Flat ESLint configuration added; `npm run lint` passed with zero warnings on October 3, 2026.
- [x] **REL-005 — P0 — Codex:** Fix stale page-smoke assertions and make the production page suite pass.
  - Evidence: Webpack production build passed and page smoke checks passed for 24 explicit pages plus 23 discovered internal links on October 3, 2026.
- [x] **REL-006 — P0 — Codex:** Run CI for pull requests and pushes to `main`.
  - Evidence: CI now runs on pull requests and pushes to `main`, with install, typecheck, lint, unit, page/build, production audit, CLI build, and package dry-run gates.
  - Required checks: clean install, typecheck, lint, unit tests, production build/page smoke, and production dependency audit.
- [x] **REL-007 — P0 — Codex:** Protect `main` so required CI checks must pass before merge.
  - If Codex cannot change the GitHub setting, it provides Stephen the exact setting to enable.
- [x] **REL-008 — P0 — Codex:** Verify a clean checkout with Node 22 using only committed files and documented environment variables.
  - Evidence: Clean-checkout release verification completed on October 5, 2026.
- [x] **REL-009 — P1 — Codex:** Remove stale generated files and repository noise from the launch branch without deleting user work.
  - Evidence: Removed tracked `.DS_Store` files; `.gitignore` already excludes generated output, dependencies, coverage, logs, and environment files.
- [x] **REL-010 — P0 — Joint:** Merge only after the Vercel branch preview passes visual and functional review.
  - Evidence: Vercel branch preview passed visual and functional review on October 5, 2026.

### Required release commands

Run these from a clean checkout. Each command must exit successfully unless the plan explicitly replaces it with an equivalent command.

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run test:pages
npm audit --omit=dev
npm run cli:build
npm pack --dry-run
```

## 2. Database, auth, permissions, and audit integrity

- [x] **DATA-001 — P0 — Codex:** Review and commit the pending `user_accounts` migrations and their tests as one coherent change.
  - Evidence: Account type, access restriction, service-role grant migrations, and coverage tests are included in the launch branch verification suite.
- [x] **DATA-002 — P0 — Codex:** Update the README migration list so it exactly matches the committed migration directory.
  - Evidence: Sorted migration-directory and README lists matched with no differences on October 3, 2026.
- [x] **DATA-003 — P0 — Codex:** Make initial personal-workspace provisioning atomic.
  - Evidence: `ensure_personal_workspace` uses a per-user transaction advisory lock, creates workspace/membership/audit state together, and fails closed on inconsistent existing ownership.
  - Workspace creation, accountable owner assignment, owner membership creation, and any required audit event succeed or fail together.
  - Concurrent first requests cannot create inconsistent or duplicate ownership.
- [x] **DATA-004 — P0 — Codex:** Add regression tests for missing owner membership, mismatched ownership, duplicate provisioning, concurrent provisioning, and rollback on failure.
  - Evidence: Migration tests assert advisory serialization, inconsistent-owner fail-closed behavior, duplicate-safe lookup, and all-or-nothing write ordering; access tests cover cross-workspace membership isolation and view-only boundaries.
- [x] **DATA-005 — P0 — Codex:** Verify every public-schema table has RLS enabled or is deliberately inaccessible through the Data API.
  - Evidence: Migration inventory review found an RLS enable statement for every public table; the live production state remains covered by DATA-011 and DATA-012.
- [x] **DATA-006 — P0 — Codex:** Verify every privileged database function has an intentional security mode, fixed `search_path`, explicit execute grants, and no unintended `PUBLIC`, `anon`, or `authenticated` access.
  - Evidence: New functions are explicit invokers except the private auth trigger; legacy functions are hardened by `20261003153210_harden_function_execution.sql`; execution is revoked from public browser roles.
- [ ] **DATA-007 — P0 — Codex:** Verify server authorization for every object-level operation.
  - List, read, download, submit, publish, request changes, reject, withdraw, share, accept, decline, revoke, invite, rename, and export.
- [ ] **DATA-008 — P0 — Codex:** Make security-sensitive mutations and required audit records atomic.
  - A successful response must never be returned when the required audit write failed.
- [x] **DATA-009 — P0 — Joint:** Apply every committed migration to the production Supabase project in filename order.
  - Evidence: Applied migrations `20261003151241` through `20261003154937` to the linked production project on October 3, 2026 after successful dry runs.
- [x] **DATA-010 — P0 — Joint:** Confirm the local migration list and production migration history match.
  - Evidence: `supabase migration list --linked` showed every local and remote version aligned through `20261003154937` on October 3, 2026.
- [x] **DATA-011 — P0 — Joint:** Run Supabase Security, Performance, Index, and service-health advisors; resolve every unaccepted error or warning and document approved exceptions.
  - Evidence: Security and Performance advisors were run on October 5, 2026. No advisor errors were found. The 31 unindexed foreign-key findings were remediated by migration `20261005221243`. Stephen accepted retaining the 47 unused-index INFO findings as intentional access-path indexes on a nearly empty production database; they will be re-evaluated after launch traffic. The leaked-password warning is an accepted Free Plan limitation recorded under DATA-015; it requires no further launch action unless the Supabase plan changes. Informational RLS findings remain documented under the server-only access model.
- [x] **DATA-012 — P0 — Joint:** Run safe production queries that verify owner consistency, private-draft isolation, invitation constraints, and RLS status without exposing customer data.
  - Evidence: Aggregate-only production checks returned zero inconsistent owners, shared private drafts, invalid invitations, public tables without RLS, and browser-executable sensitive functions on October 3, 2026.
- [x] **DATA-013 — P0 — Joint:** Verify Supabase Auth Site URL and redirect allowlist use `https://skilldockyard.com` and the required auth callback/reset routes.
  - Evidence: Supabase Auth Site URL and production redirect allowlist were verified on October 5, 2026. Confirmation and password-recovery callbacks use the canonical origin and `/auth/confirm` route.
- [x] **DATA-014 — P0 — Joint:** Verify email confirmation is required and that only verified recipient emails can accept invitations.
  - Evidence: Email confirmation and invitation acceptance were tested end to end with disposable accounts on October 5, 2026. Invitations require a verified account with a matching recipient email.
- [x] **DATA-015 — P1 — Stephen:** Review Supabase JWT lifetime, session revocation expectations, and account-deletion behavior for the pilot threat model.
  - Evidence: Recorded October 5, 2026: JWT expiry `3600` seconds; inactivity timeout `0`; time-box user sessions `0`; compromised refresh-token detection and revocation enabled. Stephen accepted leaked-password protection remaining disabled on the Free Plan as a documented residual risk; no further launch action is required for this item.

## 3. Application security and abuse controls

- [x] **SEC-001 — P0 — Codex:** Add and verify production security headers.
  - Evidence: Nonced CSP, HSTS, content-type, referrer, frame, and permissions headers are centralized in `src/proxy.ts`; source invariants and production build passed.
  - Content Security Policy, `X-Content-Type-Options`, referrer policy, frame protection, permissions policy, and HSTS behavior are deliberate.
- [x] **SEC-002 — P0 — Joint:** Replace process-local rate limiting with a shared production limiter, or configure equivalent platform protection.
  - Protect pairing-code exchange, scan/import, submissions, invitations, sharing, exports, and other expensive or abuse-sensitive endpoints.
  - Evidence: Upstash Redis shared rate-limit database created and production values configured on October 5, 2026.
- [x] **SEC-003 — P0 — Codex:** Apply bounded request parsing and schema validation to every state-changing or expensive API route.
  - Evidence: All body-bearing API routes use bounded readers; state-changing structured bodies use strict Zod schemas. No raw `request.json()` calls remain under `src/app/api`.
- [x] **SEC-004 — P0 — Codex:** Verify state-changing browser requests cannot be triggered cross-origin with authenticated cookies.
  - Evidence: Cookie-authenticated API mutations reject cross-site fetch metadata and mismatched exact origins; bearer-only connected-computer requests remain supported.
- [x] **SEC-005 — P0 — Codex:** Confirm the Supabase service-role key is referenced only by server code and never appears in client bundles, logs, errors, or committed files.
  - Evidence: Tracked-secret and public-environment-name scans passed on October 3, 2026; only `.env.example` is tracked.
- [x] **SEC-006 — P0 — Codex:** Confirm secrets and tokens are stored hashed where applicable and are redacted from logs and UI responses.
  - Evidence: Invitation, import, pairing, and connected-computer tokens use SHA-256 database hashes; monitoring scrubs request headers, cookies, bodies, and user details.
- [x] **SEC-007 — P0 — Codex:** Add authorization regression tests for cross-workspace IDs, private drafts, view-only shares, revoked shares, invitation email mismatch, and reviewer/owner boundaries.
  - Evidence: `tests/access.test.ts` and `tests/share-invite-acceptance.test.ts` cover cross-workspace membership, private drafts, view-only and revoked shares, verified-email requirements, and reviewer/owner capability boundaries.
- [x] **SEC-008 — P1 — Codex:** Add dependency auditing to the release workflow and document the vulnerability exception process.
  - Evidence: Production audit is a CI gate; exceptions require explicit Stephen approval under REL-003 and the security audit records residual risk.
- [x] **SEC-009 — P1 — Joint:** Configure provider-level bot or abuse protection for signup and login if the first release allows unrestricted self-service signup.
  - Evidence: Cloudflare Turnstile configured for signup, login, and recovery on October 5, 2026.

## 4. Account lifecycle and transactional email

- [x] **AUTH-001 — P0 — Codex:** Implement **Forgot password** and **Reset password** flows using Supabase Auth.
  - Evidence: `/forgot-password` requests a recovery email and `/reset-password` updates the authenticated recovery session password.
- [x] **AUTH-002 — P0 — Codex:** Use generic recovery responses that do not disclose whether an email address has an account.
  - Evidence: The recovery form always returns the same “If an account matches” message.
- [x] **AUTH-003 — P0 — Codex:** Validate safe same-origin redirects for confirmation, invitation continuation, and password reset.
  - Evidence: Shared safe-path validation rejects external, protocol-relative, and backslash-ambiguous paths; unit tests pass.
- [x] **AUTH-004 — P0 — Joint:** Configure a production SMTP provider and authenticated sender domain.
  - Evidence: Production SMTP and authenticated sender configuration completed on October 5, 2026.
- [x] **AUTH-005 — P0 — Joint:** Configure and test confirmation, recovery, email-change, and other security-sensitive email templates.
  - Evidence: Security-sensitive Supabase Auth email templates configured and tested on October 5, 2026.
- [x] **AUTH-006 — P0 — Joint:** Verify deliverability to at least two major email providers and confirm links use `https://skilldockyard.com`.
  - Evidence: Delivery tests passed with links using `https://skilldockyard.com` on October 5, 2026.
- [ ] **AUTH-007 — P1 — Joint:** Define the support-assisted owner recovery process for an unavailable or deleted workspace owner.
- [x] **AUTH-008 — P1 — Codex:** Provide a safe sign-out path and clear expired-session behavior.
  - Evidence: Existing sign-out revokes the browser session and returns home; expired recovery sessions show a safe actionable error.

## 5. Core product acceptance

- [ ] **APP-001 — P0 — Joint:** A new verified user receives exactly one personal workspace and exactly one owner membership.
- [ ] **APP-002 — P0 — Joint:** A private draft is visible and downloadable only by its creator.
- [ ] **APP-003 — P0 — Joint:** An editor can add skills and submit updates but cannot publish.
- [ ] **APP-004 — P0 — Joint:** A reviewer can review and publish submissions but cannot perform owner-only actions.
- [ ] **APP-005 — P0 — Joint:** A viewer can view available workspace skills but cannot submit updates or publish.
- [ ] **APP-006 — P0 — Joint:** A **Can view** recipient cannot submit an update.
- [ ] **APP-007 — P0 — Joint:** A **Can submit updates** recipient can submit an update, but it remains unpublished until review.
- [ ] **APP-008 — P0 — Joint:** Sharing never transfers ownership or creates workspace membership.
- [ ] **APP-009 — P0 — Joint:** Revoking a share removes future access while preserving the skill and audit history.
- [ ] **APP-010 — P0 — Joint:** Requesting changes, rejecting, withdrawing, and replacing a submission preserve the published version correctly.
- [ ] **APP-011 — P0 — Joint:** Downloads always use the published version for workspace/shared skills and the creator's current version for a private draft.
- [ ] **APP-012 — P0 — Joint:** Connected-computer updates refuse to overwrite local changes.
- [ ] **APP-013 — P0 — Codex:** Empty, loading, success, and error states explain the next action without leaking implementation details.
- [x] **APP-014 — P1 — Codex:** Replace remaining prohibited interface terminology with the terms defined in `AGENTS.md`.
  - Evidence: User-facing terminology scan found no remaining primary UI strings using “trust notes,” “source workspace,” “view only,” “can propose,” “local draft,” or approval language; internal data identifiers remain unchanged.
- [ ] **APP-015 — P1 — Codex:** Complete an accessibility and responsive pass.
  - Keyboard navigation, focus order, labels, contrast, error announcements, mobile tables, and touch targets meet the documented bar.

## 6. CLI packaging and distribution

- [x] **CLI-001 — P0 — Codex:** Build the CLI for Node 22 and verify every command starts successfully.
  - Evidence: Node 22-targeted build passed; every packaged command and nested `config validate` help screen started from an isolated install.
- [x] **CLI-002 — P0 — Joint:** Confirm the npm package name `skill-dockyard` is available or choose the final package name before changing public commands.
  - Evidence: `npm view skill-dockyard version` returned not found on October 3, 2026; the package name is reserved in the manifest for the first release.
- [x] **CLI-003 — P0 — Codex:** Verify the dry-run tarball contains only intended files and no local paths, secrets, fixtures, or application-only source.
  - Evidence: Dry-run contained 14 intended README, bin, dist, and manifest files only.
- [x] **CLI-004 — P0 — Codex:** Test the packed tarball in a clean temporary directory on a supported Node version.
  - Evidence: Isolated tarball install completed and every CLI command help screen passed on October 3, 2026.
- [ ] **CLI-005 — P0 — Joint:** Configure npm trusted publishing or the scoped `NPM_TOKEN` secret used by the release workflow.
- [ ] **CLI-006 — P0 — Joint:** Publish the first production CLI release with provenance.
- [ ] **CLI-007 — P0 — Joint:** Verify `npx skill-dockyard --help` works without a repository checkout.
- [ ] **CLI-008 — P0 — Joint:** Against production, verify connect, import, check, update, token revocation, and local-change protection.
- [x] **CLI-009 — P0 — Codex:** Ensure the web onboarding commands use the final canonical domain and npm package name.
  - Evidence: Setup commands use `https://skilldockyard.com`; README onboarding uses `npx skill-dockyard`; the package manifest and command binary use `skill-dockyard`.
- [x] **CLI-010 — P1 — Codex:** Document release, rollback/deprecation, token revocation, and CLI compatibility procedures.
  - Evidence: Added [cli-release-guide.md](cli-release-guide.md) with release gates, provenance, compatibility, revocation, deprecation, and recovery procedures.

## 7. Vercel, DNS, and production configuration

- [x] **PLAT-001 — P0 — Stephen:** Add `skilldockyard.com` to the production Vercel project.
  - Evidence: `https://skilldockyard.com` returned HTTP 200 with Vercel response headers on October 3, 2026.
- [x] **PLAT-002 — P0 — Stephen:** Configure the registrar DNS records exactly as Vercel specifies and wait for verification.
  - Evidence: The apex resolved over TLS to the Vercel deployment on October 3, 2026; `www` remains open under PLAT-003.
- [x] **PLAT-003 — P0 — Stephen:** Add `www.skilldockyard.com` and configure a permanent redirect to `https://skilldockyard.com`.
  - Evidence: `www` domain and permanent canonical redirect configured on October 5, 2026.
- [x] **PLAT-004 — P0 — Joint:** Configure Vercel production environment variables without exposing values.
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SITE_URL=https://skilldockyard.com`
  - Any selected rate-limit, SMTP, monitoring, or server-only ingest credentials
  - Evidence: Stephen confirmed the production Vercel environment variables were configured on October 5, 2026. Values are intentionally not recorded here.
- [x] **PLAT-005 — P0 — Stephen:** Make the production deployment publicly reachable; keep preview protection separate from production access.
  - Evidence: Anonymous HTTPS request to the canonical homepage returned HTTP 200 on October 3, 2026.
- [x] **PLAT-006 — P0 — Joint:** Deploy the approved commit and confirm the production alias points to that exact commit.
  - Evidence: Approved commit deployed and production alias verified on October 5, 2026.
- [x] **PLAT-007 — P0 — Joint:** Verify TLS, canonical redirects, no mixed content, and expected cache behavior.
  - Evidence: TLS, canonical redirects, mixed-content checks, and cache behavior verified on October 5, 2026.
- [x] **PLAT-008 — P0 — Joint:** Verify `/`, `/demo`, `/signup`, `/login`, `/app`, auth callbacks, downloads, and API routes on the canonical domain.
  - Evidence: Canonical-domain route and API smoke checks passed on October 5, 2026.
- [x] **PLAT-009 — P1 — Codex:** Add canonical metadata, sitemap/robots behavior, and social metadata appropriate to the selected rollout mode.
  - Evidence: Public metadata, Open Graph image route, sitemap, and robots directives are included in the passing production build.
- [ ] **PLAT-010 — P1 — Joint:** Remove or redirect obsolete deployment aliases after the canonical domain is stable.

## 8. Monitoring, backups, support, and legal readiness

- [x] **OPS-001 — P0 — Joint:** Configure server/client error monitoring with source maps and secret/PII scrubbing.
  - Evidence: Sentry project and production configuration completed on October 5, 2026; application-side scrubbing and server-only source-map credentials are configured.
- [x] **OPS-002 — P0 — Joint:** Configure external uptime checks for the homepage, login, and a safe application health signal.
  - Evidence: UptimeRobot monitors were configured for `https://skilldockyard.com/`, `https://skilldockyard.com/login`, and `https://skilldockyard.com/api/health` on October 5, 2026. The `/demo` route is intentionally excluded from launch monitoring because it is not part of the initial monitored production surface.
- [x] **OPS-003 — P0 — Joint:** Configure alerts with a named recipient and escalation path.
  - Evidence: On October 6, 2026, UptimeRobot monitors and Sentry production alerts were routed to `me@stephenweber.io`. Homepage, login, and `/api/health` checks open an alert after three consecutive one-minute failures; Sentry production issues cover repeated server errors and rate-limit-exceeded operational signals. Escalation is manual to the workspace owner under the [production operations runbook](production-operations-runbook.md); the owner coordinates Vercel, Supabase, Upstash, and customer communications as applicable. No credentials are recorded here.
- [ ] **OPS-004 — P0 — Stephen:** Establish and confirm a manual logical-backup schedule for the Supabase Free Plan project.
  - Requirement: The Free Plan does not include managed project backups. Export the database with `supabase db dump` before every production migration and on a recurring schedule; keep encrypted copies outside the repository.
- [ ] **OPS-005 — P0 — Joint:** Perform and document a restore exercise using a logical dump in a disposable local or staging environment.
  - Requirement: Do not restore over production. Verify schema, migration history, RLS/function grants, and aggregate integrity checks after restoring the dump.
- [x] **OPS-006 — P0 — Codex:** Create an incident and rollback runbook covering web rollback, migration incidents, secret rotation, token revocation, and customer communication.
  - Evidence: See [production-operations-runbook.md](production-operations-runbook.md).
- [ ] **OPS-007 — P0 — Stephen:** Select, monitor, and publish a support email address.
  - Required evidence: named primary owner, backup owner, security-incident escalation recipient, access test, and documented business-day monitoring procedure in the private records described by [public-beta-owner-runbook.md](public-beta-owner-runbook.md). Do not claim monitoring publicly until those are complete.
- [x] **OPS-008 — P0 — Codex:** Add Privacy, Terms, and Support routes and footer links.
  - Evidence: `/privacy`, `/terms`, and `/support` are linked publicly and included in the production build; legal approval remains OPS-009.
- [ ] **OPS-009 — P0 — Stephen:** Obtain qualified-counsel review and written approval of the public-beta Privacy Policy, Terms, retention language, providers/subprocessors, and territorial posture. Global availability remains blocked pending a separate written approval.
- [ ] **OPS-010 — P0 — Joint:** Define, approve, and test account/data deletion, data export, retention, backup, and incident-notification procedures before inviting external pilot users.
  - Evidence: follow and privately evidence [public-beta-owner-runbook.md](public-beta-owner-runbook.md). Do not invent statutory response times, retention periods, or incident-notification commitments.
- [ ] **OPS-012 — P0 — Joint:** Enable public self-service signup only after OPS-007, OPS-009, and OPS-010, the deployment verification, and the owner launch record are complete.
  - Evidence: production `SELF_SERVICE_SIGNUP_ENABLED=true`, Supabase Auth **Allow new users to sign up** enabled, email confirmation and CAPTCHA enabled, tested signup/confirmation/pause paths, and the release evidence required by [self-service-beta-readiness.md](self-service-beta-readiness.md).
- [ ] **OPS-011 — P1 — Joint:** Document production secret ownership and a rotation schedule without recording secret values.

## 9. Production acceptance and go/no-go

- [ ] **QA-001 — P0 — Joint:** Run the full automated release suite against the release candidate.
- [ ] **QA-002 — P0 — Joint:** Run the role and sharing matrix with separate verified production test accounts.
- [ ] **QA-003 — P0 — Joint:** Complete one full new-user journey from signup through published skill and CLI update.
- [ ] **QA-004 — P0 — Joint:** Complete one revocation journey and confirm future access is removed.
- [ ] **QA-005 — P0 — Joint:** Confirm logs, metrics, audit events, and alerts appear without exposing sensitive data.
- [ ] **QA-006 — P0 — Joint:** Test the rollback procedure before inviting users.
- [ ] **QA-007 — P0 — Stephen:** Review all P0 items and record an explicit **GO** or **NO-GO** decision.
- [ ] **QA-008 — P0 — Stephen:** Invite only the approved initial cohort after a **GO** decision.

## 10. First 72 hours

- [ ] **POST-001 — P0 — Joint:** Monitor errors, availability, auth email delivery, signup completion, imports, publishing, downloads, and update checks continuously during the initial launch window.
- [ ] **POST-002 — P0 — Joint:** Review access-denied, rate-limit, database, and email-delivery failures for false positives or attacks.
- [ ] **POST-003 — P1 — Stephen:** Contact pilot users and record onboarding friction, trust concerns, and blocked tasks.
- [ ] **POST-004 — P1 — Codex:** Triage launch findings into P0/P1/P2/P3 and fix launch regressions before expanding the cohort.
- [ ] **POST-005 — P1 — Joint:** Hold a 24-hour and 72-hour go/no-go review before increasing access.

## Launch record

Complete this section only when the release candidate is ready.

| Field | Value |
| --- | --- |
| Rollout mode | `Closed invite-only pilot` |
| Decision | `GO / NO-GO` |
| Decision owner | `TBD` |
| Decision time | `TBD` |
| Production commit SHA | `TBD` |
| Vercel deployment URL | `TBD` |
| Canonical URL | `https://skilldockyard.com` |
| Database migration version | `20261003154937` |
| Web release/version | `TBD` |
| CLI package/version | `TBD` |
| Monitoring dashboard | `TBD` |
| Incident contact | `TBD` |
| Rollback target | `TBD` |
