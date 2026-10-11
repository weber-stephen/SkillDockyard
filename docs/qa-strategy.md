# QA Strategy: Skill Dockyard

## Version 1.0 | Last updated: 2026-10-11 | Owner: Stephen Weber (product and engineering owner)

### 1. Executive Summary

Skill Dockyard is a Next.js SaaS and connected-computer command for teams to add, review, publish, share, download, and install reusable AI skills. Its most consequential failures are unauthorized cross-workspace access, publishing or revocation errors, loss of skill data or audit history, and compromised connected-computer credentials. The product is in a closed, invite-only pilot; its current automated suite is a strong fast baseline, but it uses mocks at the Supabase boundary and therefore cannot prove the production authorization model. This strategy keeps the existing fast-first approach, adds a deliberately small live acceptance layer for the high-risk boundaries, and makes release readiness evidence-based. It is calibrated for a solo-maintainer, growing product: practical gates first, then measurement and optimization.

### 2. Scope & Objectives

**In scope.** The public site and demo; authentication and recovery; workspace membership and ownership; skills, submissions, reviews, sharing, downloads, notifications, browser import, API routes, Supabase migrations/RLS/RPCs, the connected-computer command, and the production integrations named in the architecture map (Vercel, Supabase, Upstash, Turnstile, Resend, and Sentry). Testing covers functional behavior, authorization, migration invariants, accessibility, responsive UI, security regression, performance budgets, and operational release checks. Supported browser automation starts with Chromium desktop and adds mobile Chromium for critical flows.

**Out of scope for this strategy.** Availability or correctness of third-party providers themselves; those are exercised through controlled contract/acceptance checks and monitored in production. Full real-device coverage, formal penetration testing, broad browser-farm coverage, and load testing at scale are deferred until pilot traffic or a product change demonstrates the need. Legal compliance is not asserted by test results; the documented legal and owner release gates remain required.

**Objectives (through Q2 2027).**

1. Prove the critical authorization and lifecycle paths against a disposable, production-shaped Supabase project before each pilot release by the end of Phase 2.
2. Reach a purposeful 120/35/15 unit/integration/E2E distribution (71%/21%/9%) by the end of Q2 2027 without inflating counts with trivial tests.
3. Keep the pull-request feedback signal at or below 10 minutes and the full automated release suite at or below 20 minutes by the end of Phase 3.
4. Reduce false-positive or non-deterministic test failures to below 2% of scheduled runs and record a baseline before adding gates that depend on it.
5. Before inviting external users, complete every production acceptance item QA-001 through QA-006 in the launch checklist with separate verified test accounts and recorded evidence.

### 3. Test Levels & Types

| Level or type | Validates | Current evidence | Target by Q2 2027 | Owner | Tool and frequency |
| --- | --- | --- | --- | --- | --- |
| Unit / mocked boundary | Parsing, scanning, skill validation, domain rules, security helpers, API decision paths, and migration-source invariants | 104 Vitest cases in 25 files; most Supabase calls are mocked | 120 focused cases | Developer | Vitest on every PR |
| Live integration / acceptance | Authenticated routes, Supabase RLS/RPC behavior, migrations, roles, share lifecycle, token revocation, and provider configuration seams | 12 local-Supabase acceptance cases for provisioning, sharing, review decisions, revocation, owner-only administration, withdrawal, and replacement | 35 cases in a disposable acceptance project | Developer | Vitest/API requests on every PR; release-candidate and nightly expansion when configured |
| Browser E2E | Real user journeys through the production build | 12 Playwright Chromium cases for demo browse, navigation, review, submission, and deterministic screenshots | 15 critical cases; do not automate every variation | Developer | Smoke on PR preview; full set before release and nightly |
| API contract | Schema, authorization status codes, request limits, and error shape for browser and connected-computer APIs | Route logic is mostly covered through mocked Vitest tests | Contract assertions for every mutation and connected-computer endpoint | Developer | API requests on PR and acceptance run |
| Visual and responsive | Demo Skills/review screenshots, layout regressions, and key public/app viewports | Two deterministic Playwright screenshot journeys | Six key screens at desktop and mobile widths | Developer | PR smoke for changed screens; nightly full baseline |
| Accessibility | Keyboard path, labels, focus, landmarks, and WCAG 2.2 AA automated checks | Manual/UI audit evidence; no automated axe gate | Critical public, auth, submission, review, sharing, and settings journeys | Developer | axe-core on PR; keyboard exploration before release |
| Security and dependency | Request parsing, redirects, CSRF/header invariants, permission boundaries, dependency vulnerabilities | Security-focused Vitest tests and `npm audit --omit=dev` in CI | Keep zero new high/critical audit findings; add live role matrix | Developer | Every PR; release acceptance |
| Performance and operations | Page budget, API latency, rate limiting, error reporting, uptime, backup/rollback readiness | Page smoke build; monitored production routes and documented runbooks | Lightweight budgets and release smoke; no speculative load target yet | Developer + owner | Weekly/pilot-release check |

The current count classifies only the fast Vitest suite as unit/mocked-boundary; the separate local-Supabase suite is tracked as live integration. This avoids calling a mock of an RPC an integration test. Target pyramid math is 120 + 35 + 15 = 170 tests: 71% unit, 21% integration, and 9% E2E. The app-flow status and remaining gaps are maintained in [App-flow QA coverage](testing/app-flow-coverage.md).

### 4. Test Pyramid Analysis

**Current state (verified locally on 2026-10-11).** `npm test` passed 25 files and 104 cases. The browser suite contains 12 Chromium cases across three specifications. The source repository has a single CI job with a 10-minute timeout; its historical wall-clock duration, scheduled-run pass rate, and flake rate are not recorded, so Phase 1 must establish those baselines rather than invent them.

| Distribution | Count | Share | Assessment |
| --- | ---: | ---: | --- |
| Unit / mocked boundary | 104 | 81% | Valuable and fast, especially for rules and regressions |
| Live integration | 12 | 9% | Initial authorization and lifecycle layer now runs against migrated local Supabase |
| E2E | 12 | 9% | Sensible small suite, but demo-only coverage cannot prove authenticated behavior |

This is a unit-heavy **hourglass/missing-middle** shape, not an inverted E2E pyramid. Preserve the fast suite; add the middle rather than growing browser coverage indiscriminately.

| Target distribution | Count | Share | Why |
| --- | ---: | ---: | --- |
| Unit / mocked boundary | 120 | 71% | Fast rules, parsers, lifecycle helpers, request validation, and regression fixes |
| Live integration / acceptance | 35 | 21% | Every critical server-to-Supabase and provider boundary, including failures |
| E2E | 15 | 9% | One stable journey per critical user outcome, with visual checks only where useful |

**Rebalancing actions.** Add live tests before adding new browser tests; keep each migration's static invariant test and add only the acceptance case that proves its high-risk behavior; require tests at the lowest meaningful level in every changed critical flow; and tag failures as product, environment, or test defect. A test is quarantined only after evidence shows it is non-deterministic, has an owner and expiry, and does not cover a release-blocking path.

### 5. Risk Assessment

Risk score is impact (1–5) × likelihood (1–5). Critical is 15–25, high 10–14, medium 5–9, and low 1–4. Scores are prioritization assumptions to revisit after pilot evidence, not claims about historical incidents.

| Feature area | Impact | Likelihood | Score | Testing approach |
| --- | ---: | ---: | ---: | --- |
| Cross-workspace authorization, RLS, and server role checks | 5 | 3 | 15 Critical | Unit + live role matrix + negative API cases + release evidence |
| Workspace ownership transfer and membership administration | 5 | 3 | 15 Critical | Migration/RPC invariant + live concurrency, failure, and audit-event acceptance cases |
| Skill sharing, revocation, private drafts, and submissions | 5 | 3 | 15 Critical | Unit + live role/access lifecycle + E2E reviewer journey |
| Authentication, recovery, signup pause, and legal acceptance | 5 | 2 | 10 High | Unit + provider-shaped acceptance + browser happy/error paths + manual provider check |
| Connected-computer pairing, bearer tokens, import, update, and revocation | 5 | 2 | 10 High | Unit + API contract + live revoked-token `401` and local-change protection |
| Browser skill import and download contents | 4 | 3 | 12 High | Unit parsing/limits + browser E2E + malformed/large-content negative cases |
| Migrations, audit history, and backup/restore | 5 | 2 | 10 High | Source invariants + disposable restore/role checks before production migration |
| Rate limiting, CSRF, headers, redirects, and abuse controls | 4 | 2 | 8 Medium | Unit + production-shaped multi-instance/rate-limit acceptance and security regression |
| Demo/public pages, navigation, and visual identity | 2 | 3 | 6 Medium | Page smoke + responsive screenshot + axe/core keyboard checks |
| Notifications, analytics consent, and settings presentation | 2 | 2 | 4 Low | Unit and targeted manual exploratory check |

For critical risks, a release requires automated coverage, a targeted exploratory session, and operational verification where the behavior depends on a provider. No code test substitutes for the separate launch requirements governing support, backup, privacy, and owner decisions.

### 6. Environment Strategy

| Environment | Purpose | Tests | Data and access | Trigger |
| --- | --- | --- | --- | --- |
| Local | Fast development feedback | Unit, mocked API, lint, typecheck, focused browser | Fixtures and mocks only; no production credentials | Before/while developing |
| GitHub CI | Repeatable PR verification | Existing unit, production build/page smoke, Chromium demo E2E, dependency audit, CLI build/package dry-run | No Supabase credentials; demo fixtures; artifacts on browser failure | Every PR and push to `main` |
| Vercel branch preview | Human visual/functional review | Changed-page smoke and manual exploratory check | Preview-safe configuration; never use customer data | Before merge for visual/product changes |
| Disposable acceptance project (to create) | Prove Supabase/Auth/RLS/RPC and API behavior | Live integration, API contract, separate-role matrix, migration verification | Synthetic accounts and synthetic skills only; restricted maintainer access; tear down/reset after run | Release candidate, migrations, nightly once stable |
| Production | Verify observability and safe release outcome | `/`, `/login`, `/api/health` monitoring; narrow authorized smoke only after explicit approval | Controlled verified test accounts; never customer skills or secrets | Deploy and pilot-release bake window |

Test identities must be separate, verified accounts for owner, reviewer, editor, viewer, a non-member, and a shared-skill recipient. Their immutable IDs and generated test skill content belong in the acceptance environment, not fixtures copied from user data. Production writes need explicit owner authorization and must be followed by cleanup through supported product flows—not direct database deletion.

### 7. Tool Selection

The current TypeScript/Next.js stack and existing tests justify retaining Vitest and Playwright. The next investment is API/live acceptance infrastructure, not replacing those tools. Scores are 1–5; weighted totals are out of 5.

| Criterion (weight) | Vitest (retain) | Jest | Node test runner |
| --- | ---: | ---: | ---: |
| Stack fit (25%) | 5 | 4 | 3 |
| Existing team familiarity (20%) | 5 | 3 | 3 |
| Documentation/ecosystem (15%) | 5 | 5 | 3 |
| CI integration (15%) | 5 | 5 | 4 |
| Maintenance cost (10%) | 5 | 4 | 4 |
| Execution speed (10%) | 5 | 4 | 4 |
| License cost (5%) | 5 | 5 | 5 |
| **Weighted total** | **5.00** | **4.05** | **3.40** |

| Criterion (weight) | Playwright (retain) | Cypress |
| --- | ---: | ---: |
| Stack fit (25%) | 5 | 4 |
| Existing team familiarity (20%) | 5 | 3 |
| Documentation/ecosystem (15%) | 5 | 4 |
| CI integration (15%) | 5 | 4 |
| Maintenance cost (10%) | 5 | 3 |
| Execution speed (10%) | 5 | 3 |
| License cost (5%) | 5 | 4 |
| **Weighted total** | **5.00** | **3.65** |

**Implementation choices.** Use Vitest plus direct authenticated HTTP requests for deterministic API/live acceptance tests; use Playwright for browser paths, screenshots, and later axe-core integration; retain `scripts/smoke-pages.ts` for route/link smoke. Add a lightweight schema assertion helper only if repeated API contract checks warrant it. Do not adopt Pact, a commercial browser farm, k6, or a visual-SaaS vendor in Phases 1–2: there is no independently deployed service boundary or traffic profile that justifies their operational cost yet. Reconsider them when external consumer APIs, real multi-browser demand, or observed performance constraints appear.

### 8. Entry and Exit Criteria

| Level | Entry criteria | Exit criteria |
| --- | --- | --- |
| Unit / mocked boundary | Behavior, input/output contract, and risk classification are clear; dependencies can be mocked without hiding the contract | Relevant branches, malformed input, authorization decision, and regression case pass; no focused test is skipped |
| Live integration / acceptance | Unit suite passes; disposable project has the expected migrations; synthetic role accounts/data are provisioned; provider configuration is known | Happy path, unauthorized path, failure/rollback, and audit/side-effect assertion pass; no direct production data access used |
| Browser E2E | Build and page smoke pass; stable test accounts/data and acceptance URL are available; critical journey has an owner | Critical outcome and one meaningful error/revocation path pass; keyboard behavior checked when UI changes; screenshot diffs reviewed intentionally |
| Release | Required CI is green on the exact candidate; no unresolved critical/high defect; migration and provider-change plan reviewed; rollback path identified | Production monitoring/safe smoke succeeds, no anomaly in the agreed 30-minute pilot-release bake window, and the release record includes the tested commit and evidence |

Every defect fix includes a regression test at the lowest level that would have caught it. A test failure is a release signal until triaged; it is never silently retried or deleted to make a gate green.

### 9. Quality Gates

These gates distinguish what exists today from the staged target. Existing CI already runs typecheck, lint, fast Vitest, local-Supabase acceptance, production build/page smoke, Chromium E2E, dependency audit, CLI build, and `npm pack --dry-run` on PRs. The following additions are required before calling a pilot release ready.

| Gate | Required evidence | Pass/fail threshold |
| --- | --- | --- |
| PR | Existing CI checks; tests for changed risk area; focused preview review for visual changes | All checks pass; zero new lint/type errors; zero new production dependency vulnerabilities at high/critical; no unreviewed intentional visual snapshot change |
| Merge to `main` | PR gate, branch current with `main`, and human review of complete diff | Required `CI / verify` succeeds on the current head; protected-branch rules satisfied; no open release-blocking defect |
| Pilot release / deploy | Full automated suite on exact candidate, acceptance role matrix for changed critical flows, Vercel preview review, migration/provider checklist where relevant | 100% critical tests pass; no critical/high known defect; QA-001–QA-006 complete before external invitations; rollback target recorded |
| Nightly / weekly operational review | Full browser and acceptance suite once the acceptance project exists; accessibility scan; dependency audit; monitor and alert review | 100% critical-path pass; flakes below 2% over rolling 20 runs; all failures triaged by next business day |

Definition of done for a material feature: acceptance criteria reviewed; risk row updated when scope changes; tests at the appropriate level; server-side authorization tested when access changes; accessible empty/error/loading state covered; CI green; and release notes/rollback implications identified.

### 10. Metrics & KPIs

Baselines marked “capture” are intentionally unknown today; Phase 1 records them from CI and pilot incidents. They are not treated as zero.

| Metric | Definition | Target | Cadence |
| --- | --- | --- | --- |
| Critical-path automated coverage | Critical risk rows with unit plus live acceptance or E2E coverage | 100% by end of Q2 2027 | Monthly and before release |
| Test pyramid | Unit/live integration/E2E test count | 120/35/15 (71%/21%/9%) by Q2 2027 | Monthly |
| Unit and mocked-boundary coverage | Source coverage for risk-tagged business/security modules | Establish baseline in Phase 1; ≥80% branches in critical modules by Q2 2027 | PR/monthly |
| Flake rate | Non-deterministic failures ÷ scheduled runs | Capture in Phase 1; <2% rolling 20 runs by Phase 4 | Weekly |
| CI time to first signal | PR push to completed required check | Capture in Phase 1; ≤10 minutes | Weekly |
| Full release-suite time | Candidate suite including acceptance/browser checks | ≤20 minutes | Each release |
| Defect escape rate | Production defects ÷ all confirmed defects for a release | Capture at pilot start; <5% by Q2 2027 | Per release |
| Critical escape count | Confirmed production authorization, data-loss, or token-revocation escapes | 0 each release | Per release |
| Mean time to restore | Incident declaration to verified recovery/rollback | <4 hours for P0; <24 hours for P1 | Per incident |
| Accessibility regressions | New automated serious/critical axe violations on covered flows | 0 on PR; manual keyboard pass before release | PR/release |
| CI false-positive rate | Test failures resolved without a product or test defect | <5% | Weekly |

Metrics inform investment; they are not a performance score for an individual. A spike triggers investigation into environment, test design, or product behavior and a dated corrective action.

### 11. Timeline & Milestones

**Phase 1 — Foundation (Weeks 1–4, Oct–Nov 2026).** Tag existing tests by level and risk; capture CI duration/flakes; add the acceptance-project configuration and synthetic role-account factory; add first live cases for owner consistency, private-draft isolation, invitation acceptance, and a revoked connected-computer token. Exit: documented baseline, reproducible acceptance setup, and PR test selection rule.

**Phase 2 — Critical boundaries (Weeks 5–10, Nov–Dec 2026).** Cover role/share/revocation/ownership lifecycles and all mutation API authorization outcomes; add five browser paths covering login/recovery, publishing, sharing/revocation, browser import, and connected-computer update protection; introduce mobile-width visual coverage and automated axe checks. Exit: 100% of critical risk rows have the targeted live or browser coverage and the role matrix can run with separate accounts.

**Phase 3 — Release gates (Weeks 11–14, Jan–Feb 2027).** Wire acceptance run into release-candidate workflow; set no-regression coverage rule for critical modules; establish the production-safe smoke evidence template; record backup/restore and rollback exercises with release candidates. Exit: PR, merge, pilot-release, and scheduled-review gates operate with the thresholds in this document.

**Phase 4 — Optimize and sustain (Weeks 15–20, Feb–Mar 2027).** Triage every flaky or slow test; cache browser/dependency setup and only shard after measured CI time exceeds target; complete the target 120/35/15 distribution; conduct first quarterly review. Exit: PR signal ≤10 minutes, flake rate <2%, and revised v1.1 strategy.

**Q2 2027.** Use pilot evidence to decide whether broader browser coverage, k6/load scenarios, a managed visual service, or contract testing provides measurable value. Expand only for an identified risk, not to increase test counts.

### 12. Risks to the Strategy Itself

| Risk | Early indicator | Mitigation / decision |
| --- | --- | --- |
| Solo-maintainer capacity delays the live acceptance layer | Releases rely only on mocks or manual confidence | Treat the four Phase 1 authorization cases as release work, not QA backlog; defer low-risk automation first |
| Acceptance environment diverges from production | Role matrix passes but provider/migration behavior differs | Pin migration version, use synthetic accounts, document provider settings, and rerun after provider/migration changes |
| Tests require real secrets or customer data | Credentials appear in test fixtures/logs | Use environment-scoped secrets, scrub artifacts, synthetic content, and server-side logs only |
| Browser automation becomes brittle | Repeated selector/snapshot-only failures | Prefer user-facing locators, stable fixture data, root-cause triage, and expiry-bound quarantine |
| CI time grows beyond feedback budget | Required check approaches 10 minutes | Measure first; cache dependencies/browser binaries; run focused smoke on PR and full suite scheduled/release; shard only with a parallel-efficiency measure |
| Launch gates are mistaken for legal/compliance proof | “Tested” is described as “compliant” | Keep counsel, owner, support, backup, and provider gates separate and evidence-based |

### 13. Revision History

| Version | Date | Owner | Change | Review trigger |
| --- | --- | --- | --- | --- |
| 1.0 | 2026-10-11 | Stephen Weber | Initial strategy from repository, CI, test-suite, architecture, and launch-document evidence | First quarterly review, material incident, new provider/product area, acceptance-environment launch, or team change |
| 1.1 | 2026-10-11 | Stephen Weber | Added the app-flow coverage inventory and updated current automated-suite evidence | Same triggers, plus any `APP-###` flow or coverage change |

This document is reviewed quarterly at minimum. The owner records the decision, updated metrics, changed risk assumptions, and assigned next actions in the next revision.
