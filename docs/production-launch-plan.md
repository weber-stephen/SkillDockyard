# Skill Dockyard production launch implementation plan

This plan implements every item in [production-launch-checklist.md](production-launch-checklist.md). It is written so Codex can execute repository work and Stephen can complete provider, business, and approval steps without relying on conversation history.

## Objective

Launch Skill Dockyard at **[https://skilldockyard.com](https://skilldockyard.com)** for real users with:

- a publicly reachable and recoverable production deployment;
- patched dependencies and repeatable release gates;
- server-enforced workspace, skill, sharing, and review permissions;
- verified Supabase migrations, RLS, auth, and email delivery;
- a published connected-computer CLI;
- monitoring, backups, support, and rollback procedures; and
- a controlled first-user rollout with explicit go/no-go criteria.

## Non-negotiable constraints

- Preserve the permission model in [permissions.md](permissions.md).
- Use the product terminology in `AGENTS.md` at the user-interface boundary.
- Use the Operational Cobalt visual system in [brand-system.md](brand-system.md).
- Keep `SUPABASE_SERVICE_ROLE_KEY` and every other secret server-only.
- Do not silently repair inconsistent workspace ownership or infer authority from email or skill metadata.
- Never apply an unreviewed migration directly to production.
- Every production mutation requires an explicit verification step and a rollback or recovery path.
- Do not treat a passing build as launch approval. All P0 checklist items must be complete.

## Workstream ownership

| Workstream | Codex | Stephen |
| --- | --- | --- |
| Repository, tests, migrations, UI, API, CI | Implements and verifies | Reviews material product decisions |
| GitHub settings | Prepares workflow and exact instructions | Enables settings if account access is required |
| Supabase production | Prepares migrations, queries, and tests | Authorizes production application and provider settings |
| Vercel and DNS | Prepares code/config and verifies responses | Controls project, registrar, billing, and public access |
| npm | Builds, tests, and prepares release | Owns npm identity/token or trusted-publisher authorization |
| SMTP, monitoring, rate-limit provider | Integrates selected provider | Selects/purchases provider and supplies scoped secrets |
| Legal and trademark | Adds approved pages and links | Owns professional review and final approval |
| Go-live | Runs technical verification | Makes final go/no-go decision |

## Execution strategy

Implement the phases in order. A phase may be split into multiple pull requests, but later phases must not bypass an earlier phase's exit criteria.

Recommended pull-request boundaries:

1. Runtime, dependencies, lint, smoke tests, and CI.
2. Database migrations and atomic workspace provisioning.
3. API security, audit atomicity, headers, and distributed rate limiting.
4. Password recovery, email flows, legal/support routes, and accessibility terminology pass.
5. CLI packaging and release automation.
6. Production platform configuration, monitoring, E2E acceptance, and launch runbooks.

## Phase 0 — Establish a safe baseline

**Checklist:** `LAUNCH-002`, `REL-001`, `REL-009`

### Codex actions

1. Inspect `git status`, current branch, remotes, and recent commits.
2. Preserve the existing uncommitted `user_accounts` migrations and test changes. Do not rewrite or discard them before reviewing their intent.
3. Create a feature branch such as `launch/production-readiness` after Stephen confirms any unrelated dirty-worktree changes are safe to include or leave untouched.
4. Record baseline results for:

   ```bash
   node --version
   npm --version
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

5. Classify each failure as code, configuration, sandbox-only, or external-service dependent.

### Stephen actions

1. Choose invite-only pilot or unrestricted self-service signup.
2. Identify the initial production testers without committing their personal information.
3. Confirm whether existing uncommitted migration work is intended for this launch.

### Exit criteria

- The launch branch contains no accidental user-file changes.
- Every known baseline failure is mapped to a later task.
- The rollout mode is recorded in the checklist.

## Phase 1 — Patch the runtime and make release gates trustworthy

**Checklist:** `REL-002` through `REL-008`, `SEC-008`

### Codex actions

1. Change the supported runtime to Node 22 or later:
   - update `package.json#engines`;
   - update the CLI `tsup` target;
   - update all GitHub Actions jobs;
   - add an `.nvmrc` or equivalent committed runtime declaration if the repository does not already have one; and
   - document the runtime in the README.
2. Upgrade Next.js, Supabase clients, `js-yaml`, PostCSS, Sharp/transitive dependencies, and other affected packages to patched compatible releases.
3. Commit `package-lock.json` and verify a clean `npm ci`.
4. Replace `next lint` with ESLint's current CLI and a committed configuration appropriate for Next.js, React, and TypeScript.
5. Fix the stale `/demo/submit/update` smoke marker so the assertion matches authoritative product terminology.
6. Update `.github/workflows/ci.yml`:
   - run on pull requests and pushes to `main`;
   - use Node 22;
   - use `npm ci`;
   - run typecheck, lint, unit tests, page smoke/build, and `npm audit --omit=dev`;
   - set reasonable timeouts; and
   - avoid printing environment secrets.
7. Make dependency auditing fail the release on critical or high production vulnerabilities. Document any temporary exception with advisory, reachability analysis, owner, and removal date.
8. Run the complete release command set from the checklist in a clean checkout.

### Stephen actions

1. Enable required status checks and branch protection for `main` after the updated workflow has a successful run.
2. Approve any documented vulnerability exception; do not delegate this approval to a passing CI configuration.

### Verification

- `npm audit --omit=dev` has no unapproved critical/high findings.
- CI passes on the pull request and cannot be bypassed by an ordinary merge.
- `npm run lint` and `npm run test:pages` both exit successfully.
- The build and CLI run under Node 22.

### Rollback

- Revert the dependency/runtime pull request as a unit if the application or CLI cannot pass its existing behavior tests.
- Do not release with the old vulnerable lockfile as a workaround.

## Phase 2 — Finish migrations and make workspace provisioning atomic

**Checklist:** `DATA-001` through `DATA-012`, `APP-001`

This repository uses imperative SQL migrations. Use the installed Supabase CLI's `--help` output rather than assuming command flags. Verify current Supabase changelog and documentation before making schema changes.

### Codex actions

1. Review the three pending `user_accounts` migrations for:
   - RLS on the public table;
   - explicit grants only to the intended server role;
   - no access for `PUBLIC`, `anon`, or `authenticated`;
   - a private-schema trigger function with a fixed empty `search_path`; and
   - no accidental public execute permission.
2. Decide whether the three migrations should remain separate or be replaced before they have ever been applied. Never rewrite an already-applied production migration.
3. Update the migration coverage tests and README migration list.
4. Create a new migration through `supabase migration new <name>` for atomic personal-workspace provisioning.
5. Implement a transactionally safe database function called by the server that:
   - locks or otherwise serializes provisioning for the user;
   - returns an existing consistent personal workspace when one already exists;
   - creates the workspace and owner membership in the same transaction when absent;
   - rejects an existing workspace whose `owner_user_id` and owner membership disagree;
   - prevents multiple owner memberships;
   - records any required audit event in the same transaction; and
   - exposes execute permission only to the intended server role.
6. Update `ensurePersonalWorkspace` to call the function instead of issuing independent workspace and membership writes.
7. Add tests for first creation, repeat calls, concurrent calls, missing membership, multiple owners, mismatched owner, and forced audit/write failure.
8. Audit every table, view, function, policy, and grant in all migrations. Pay particular attention to `SECURITY DEFINER`, `security_invoker`, fixed `search_path`, and default function execute grants.
9. Convert required audit-coupled mutations that currently span multiple server calls into transactional database functions. Prioritize workspace administration, publishing, share acceptance/revocation, and any operation where product policy promises preserved audit history.
10. Add safe SQL verification queries for production. Queries must return counts or integrity failures, not customer content or email lists.

### Stephen actions

1. Provide or authorize access to the correct production Supabase project.
2. Approve the migration window and backup/rollback preparation.
3. Confirm the project plan and database version are supported.

### Production procedure

1. Confirm the intended project reference without printing credentials.
2. Capture current migration history and backup/restore availability.
3. Apply migrations through the project's established Supabase workflow.
4. Verify the migration list matches committed files.
5. Run Security, Performance, Index, and service-health advisors.
6. Run the safe integrity queries.
7. Exercise personal-workspace creation with a production test account.

### Exit criteria

- No ownership inconsistency query returns a row.
- New users receive one personal workspace and one owner membership.
- RLS/grants/functions pass repository tests and production advisors.
- Migration history is captured in the launch evidence.

### Rollback and recovery

- Prefer forward-fix migrations for schema changes already applied.
- Before applying, document how to disable the affected application path and restore from the provider backup if data integrity is threatened.
- Never silently choose an owner when production integrity checks fail.

## Phase 3 — Harden APIs, browser security, and audit behavior

**Checklist:** `SEC-001` through `SEC-009`, `DATA-007`, `DATA-008`

### Codex actions

1. Create an API authorization matrix covering actor, resource relationship, action, expected status, and audit event.
2. Trace each route from request input through authentication, authorization, database mutation, response, and logging.
3. Standardize request parsing:
   - bounded bodies;
   - expected content type;
   - schema/type validation;
   - bounded strings, lists, exports, and pagination; and
   - stable 400/401/403/404/409/413/429 responses.
4. Add same-origin protection for cookie-authenticated state-changing requests. Keep CLI bearer-token endpoints compatible and separately authenticated.
5. Add security headers in `next.config.ts` or a shared response layer:
   - begin CSP in report-only mode if required to discover Next.js/Vercel sources;
   - remove unnecessary sources;
   - enforce CSP before launch;
   - set `X-Content-Type-Options: nosniff`;
   - set a restrictive referrer policy and permissions policy;
   - prevent framing; and
   - verify HSTS is supplied by the canonical HTTPS deployment.
6. Define a `RateLimiter` interface with an in-memory implementation for tests/local development and a shared production implementation.
7. Integrate the provider selected by Stephen, using scoped server-only credentials and bounded key retention.
8. Rate-limit pairing, scan/import, submissions, invitations, sharing, exports, and auth-adjacent endpoints by the safest combination of user, workspace, token fingerprint, and IP signal.
9. Add regression tests for IDOR/BOLA attempts, cross-workspace identifiers, revoked access, private drafts, invitation email mismatch, view-only shares, and stale proposals.
10. Scan built client assets and logs for server-only environment variable names and secret patterns.

### Stephen actions

1. Select an existing shared rate-limit provider or approve a new provider and expected cost.
2. Supply a scoped production credential through Vercel, never chat or the repository.
3. Decide whether public signup requires CAPTCHA/bot protection for the first rollout.

### Exit criteria

- Authorization regression tests cover every sensitive route.
- Security headers are present on `skilldockyard.com` and do not break auth, downloads, or the application shell.
- Rate limits work across separate production requests/instances.
- Required audit failure causes the parent mutation to fail.

## Phase 4 — Complete account recovery, email, copy, and accessibility

**Checklist:** `AUTH-001` through `AUTH-008`, `APP-013` through `APP-015`, `OPS-007` through `OPS-010`

### Codex actions

1. Add a **Forgot password** entry from login.
2. Add a recovery request form using Supabase Auth's current `resetPasswordForEmail` API.
3. Add an authenticated reset callback/page that safely establishes the recovery session and updates the password.
4. Validate `next` parameters as local application paths and reject protocol-relative/external redirects.
5. Return the same recovery acknowledgement whether or not an account exists.
6. Add tests for expired/invalid tokens, unsafe redirects, mismatched state, successful reset, and post-reset login.
7. Add Privacy, Terms, and Support routes with visible footer/auth links. Drafts must be labeled for legal review until Stephen approves them.
8. Perform a terminology scan against `AGENTS.md` and update primary interface copy without renaming internal fields or routes.
9. Perform the accessibility/responsive pass:
   - programmatic labels and descriptions;
   - error/status announcements;
   - heading and landmark structure;
   - keyboard navigation and focus restoration;
   - WCAG AA contrast;
   - 44px-equivalent touch targets where practical;
   - mobile tables/forms; and
   - reduced-motion behavior.
10. Run automated accessibility checks and manually verify keyboard-only flows at mobile and desktop widths.

### Stephen actions

1. Select/configure SMTP and sender identity.
2. Approve the support email.
3. Provide legally reviewed Privacy and Terms content or approve external legal review of Codex-prepared drafts.
4. Define retention, deletion, export, and owner-recovery policies.

### Production email configuration

- Set Supabase Site URL to `https://skilldockyard.com`.
- Allow only required confirmation, invitation, and recovery redirects.
- Configure SPF, DKIM, and DMARC for the sending domain.
- Verify confirmation, password recovery, email change, and security-notification templates.
- Test link expiry, one-time use, continuation after signup, and deliverability.

### Exit criteria

- A user can recover access without support intervention.
- Auth responses do not enumerate accounts.
- Legal/support links are present and approved.
- Critical flows pass keyboard, mobile, and automated accessibility checks.

## Phase 5 — Package and publish the connected-computer CLI

**Checklist:** `CLI-001` through `CLI-010`

### Codex actions

1. Build CLI output for Node 22 and run command help for every command.
2. Verify configuration validation and fixture scanning.
3. Run `npm pack --dry-run` with a clean cache and inspect the complete file list.
4. Pack the tarball and install it into a newly created temporary directory without relying on the repository's `node_modules`.
5. Test `--help`, `init`, `config validate`, local scan, and export from the packed install.
6. Confirm the final npm name and update all public commands atomically if it changes.
7. Harden the publish workflow:
   - Node 22;
   - clean install;
   - full test/type/lint/build suite;
   - package-content inspection;
   - npm provenance; and
   - trusted publishing when supported, otherwise a narrowly scoped automation token.
8. Prepare the version, changelog/release notes, Git tag, and rollback/deprecation instructions.

### Stephen actions

1. Confirm the npm organization/account that owns the package.
2. Configure trusted publishing or a scoped automation token.
3. Explicitly approve the first public npm publish.

### Production verification

From a clean machine/directory with no repository checkout:

```bash
npx skill-dockyard --help
npx skill-dockyard connect --endpoint https://skilldockyard.com --code <one-time-code>
npx skill-dockyard import
npx skill-dockyard check
npx skill-dockyard update --all
```

Use a temporary test account and never commit the pairing code or resulting token.

### Exit criteria

- The package is publicly installable under the command shown in the UI.
- Connect/import/check/update succeed against production.
- Token revocation immediately prevents future CLI access.
- A local modification blocks overwrite and gives a useful recovery path.

## Phase 6 — Configure Vercel, DNS, and the canonical domain

**Checklist:** `LAUNCH-003`, `PLAT-001` through `PLAT-010`, `DATA-013`, `DATA-014`

### Codex actions

1. Update production URLs in code/docs to use `https://skilldockyard.com` where a canonical origin is required.
2. Keep runtime request-origin behavior for branch previews where appropriate; do not make preview auth accidentally redirect to production.
3. Add canonical metadata and rollout-appropriate robots behavior.
4. Push the launch branch to the configured remote and verify the Vercel preview before merging.
5. After production deployment, verify status, redirects, headers, TLS, canonical tags, authentication routes, and downloads with read-only HTTP checks.

### Stephen actions

1. Add `skilldockyard.com` and `www.skilldockyard.com` to the correct Vercel project.
2. Apply the exact DNS records Vercel supplies at the registrar.
3. Redirect `www` to the apex canonical domain.
4. Enter production environment variables in Vercel.
5. Ensure production is public while retaining desired preview protection.
6. Configure the corresponding Supabase Site URL and redirect allowlist.

### Environment checklist

Required existing variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=https://skilldockyard.com
```

Add provider-specific server-only variables for rate limiting, SMTP, error monitoring, or ingest only when the selected implementation requires them. Never prefix a secret with `NEXT_PUBLIC_`.

### Verification

- Apex responds successfully over HTTPS.
- `www` permanently redirects to the apex while preserving the path and query.
- The obsolete Vercel alias does not remain the canonical URL.
- Signup confirmation, recovery, and invitation continuation return to the canonical domain.
- `/app` redirects anonymous users to login and loads for an authenticated production test user.

### Rollback

- Keep the previous known-good Vercel deployment identifiable by commit SHA.
- A web rollback must not assume a database down-migration. Confirm schema compatibility before promoting an older deployment.

## Phase 7 — Add observability, backup verification, and incident response

**Checklist:** `OPS-001` through `OPS-006`, `OPS-011`

### Codex actions

1. Integrate the selected error-monitoring provider for browser and server errors.
2. Upload source maps privately and prevent them from exposing secrets.
3. Scrub authorization headers, cookies, tokens, invite links, skill content, and unnecessary personal data.
4. Add a safe health signal that checks application availability without returning secrets or customer data.
5. Create `docs/production-operations-runbook.md` covering:
   - incident severity and ownership;
   - Vercel rollback;
   - migration incident containment;
   - Supabase/project status checks;
   - session and CLI-token revocation;
   - secret rotation;
   - npm deprecation/rollback; and
   - user communication.
6. Add a release checklist step that records monitoring and rollback links without secrets.

### Stephen actions

1. Select and configure error monitoring and uptime monitoring.
2. Select alert recipients and escalation channels.
3. Confirm the Supabase backup plan and retention.
4. Authorize a restore drill or complete the provider-supported restore verification.
5. Define who owns each production secret and its rotation schedule.

### Exit criteria

- A synthetic test error appears with usable source context and no sensitive payload.
- An uptime failure produces an alert to the named recipient.
- A restore/rollback exercise is documented and understood.
- The incident runbook is sufficient for someone other than its author to follow.

## Phase 8 — Run production acceptance with a role matrix

**Checklist:** `APP-002` through `APP-012`, `QA-001` through `QA-006`

Use separate verified test accounts. Do not simulate multiple roles by editing browser state or changing database rows between steps.

### Test identities

- Workspace owner
- Reviewer
- Editor
- Viewer
- Individual share recipient with **Can view**
- Individual share recipient with **Can submit updates**
- Recipient workspace owner
- Unrelated authenticated user

### Scenario sequence

1. **Account and workspace:** Sign up, confirm email, log in, recover password, and verify one personal workspace/owner membership.
2. **Private draft:** Create, view, download, and verify every other identity receives no access.
3. **Workspace submission:** Submit a new skill as editor, compare as reviewer, request changes, resubmit, and publish.
4. **Update lifecycle:** Submit two updates and verify the older pending submission becomes **Replaced by newer submission** while the published version stays active.
5. **Role boundaries:** Verify viewer/editor/reviewer/owner abilities match `docs/permissions.md` on both UI and direct API requests.
6. **Individual sharing:** Exercise **Can view**, **Can submit updates**, accept, decline, and revoke.
7. **Workspace sharing:** Confirm acceptance requires the invited workspace's accountable owner and does not transfer ownership or create membership.
8. **Downloads:** Confirm private and published version selection and ZIP contents.
9. **Connected computer:** Pair, import, check, install an update, detect local changes, revoke the token, and confirm denial afterward.
10. **Audit/notifications:** Verify required events and notifications without exposing data to unrelated users.
11. **Exports:** Verify only accessible skills appear and CSV/JSON output cannot inject spreadsheet formulas or leak internal-only data.
12. **Responsive/accessibility:** Repeat the primary journey with keyboard only and at mobile width.

### Exit criteria

- Every scenario has a dated pass/fail record.
- No P0/P1 defect remains open.
- Audit history and production logs support the observed outcomes.
- The rollback exercise succeeds before invitations are sent.

## Phase 9 — Launch and controlled rollout

**Checklist:** `QA-007`, `QA-008`, `POST-001` through `POST-005`, `LAUNCH-005`

### Release preparation

1. Freeze non-launch changes.
2. Confirm all P0 checklist items are complete.
3. Record production commit, deployment, migration, web, and CLI versions.
4. Confirm monitoring, support coverage, and rollback target.
5. Make the explicit go/no-go decision.

### Launch procedure

1. Merge the approved release pull request.
2. Wait for the production Vercel deployment and verify its commit SHA.
3. Run canonical-domain smoke checks.
4. Apply only migrations not already applied, following the approved migration procedure.
5. Run post-migration integrity checks and advisors.
6. Publish the approved CLI version if not already published.
7. Run the full new-user-to-CLI acceptance journey once more.
8. Record **GO** only if every P0 check passes.
9. Invite the named pilot cohort; do not open unrestricted signup unless that was the approved rollout mode.

### Stop and rollback triggers

Declare **NO-GO** or halt invitations when any of the following occurs:

- cross-workspace or private-draft data exposure;
- ownership inconsistency or unauthorized publishing;
- broken signup, confirmation, recovery, or invitation flow;
- production CLI cannot connect/import/update safely;
- critical/high reachable vulnerability without approved mitigation;
- unavailable monitoring, backup, or rollback path;
- canonical domain or TLS failure; or
- sustained elevated 5xx/auth/database errors.

Rollback web traffic to the previous compatible Vercel deployment. Disable the affected feature path or signup if needed. Revoke exposed credentials/tokens. Prefer a forward database fix over reversing an applied migration. Communicate impact through the approved support/incident channel.

### First 72 hours

- Watch error, auth, email, database, rate-limit, import, publish, download, and update metrics.
- Review denied requests for both abuse and false-positive authorization failures.
- Contact pilot users for task-level feedback.
- Hold 24-hour and 72-hour reviews before expanding the cohort.
- Convert findings into prioritized issues and rerun affected acceptance scenarios after each fix.

## Final definition of done

Production launch is complete only when:

1. every P0 item in the checklist is checked with evidence;
2. `https://skilldockyard.com` is canonical, public, monitored, and recoverable;
3. the production database matches committed migrations and passes integrity/advisor checks;
4. automated and manual role-matrix tests pass;
5. the CLI is publicly installable and works against production;
6. support, legal, backup, monitoring, and incident ownership are defined; and
7. Stephen records an explicit **GO** decision and the initial users can complete the promised workflow.

