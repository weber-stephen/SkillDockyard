# Production security audit — October 3, 2026

## Scope and limitations

Reviewed the Next.js application and API routes, Supabase migrations and server data layer, authentication and invitation flows, connected-computer token handling, dependency tree, security headers, request parsing, and release configuration. Validation used static request-path tracing, unit tests, a production build, local page smoke tests, `npm audit --omit=dev`, and repository secret-pattern scans.

No destructive tests or live-production exploit attempts were performed. Production Supabase policies, provider settings, Vercel environment values, email delivery, backups, and monitoring delivery still require provider-side verification.

## Findings

ID: SEC-001  
Severity: Critical  
Title: Production dependencies included known critical Next.js vulnerabilities  
Status: Confirmed — remediated in launch branch  
Location: `package.json`, `package-lock.json`  
Evidence: Baseline audit reported critical Next.js advisories; Next.js and affected dependencies were upgraded and the final `npm audit --omit=dev --audit-level=high` reported zero vulnerabilities.  
Impact: A vulnerable production framework could expose server execution, image processing, or authorization behavior.  
Attack precondition: Affected request paths reachable on the deployed application.  
Recommendation: Keep the production audit as a required CI gate and review dependency exceptions explicitly.  
Confidence: High  
Regression test: CI runs the production dependency audit on pull requests and pushes to `main`.

ID: SEC-002  
Severity: High  
Title: Process-local abuse limits did not coordinate across serverless instances  
Status: Confirmed — remediated in launch branch  
Location: `src/lib/rate-limit.ts`, abuse-sensitive API routes  
Evidence: The original limiter used an in-memory map. Production now uses Upstash Redis and returns `503` when shared rate-limit configuration is absent; local memory behavior remains limited to development and tests.  
Impact: Attackers could bypass instance-local limits and amplify pairing, import, submission, invitation, sharing, or export workloads.  
Attack precondition: Network access to the relevant endpoint.  
Recommendation: Configure the production Upstash values and alert on elevated `429` and `503` rates.  
Confidence: High  
Regression test: Exercise limits from multiple production instances after configuration.

ID: SEC-003  
Severity: High  
Title: Workspace and share mutations could succeed without their required ownership or audit records  
Status: Confirmed — remediated in launch branch  
Location: `src/lib/supabase/auth.ts`, `src/lib/shares.ts`, `src/app/api/approvals/route.ts`, migrations dated `20261003`  
Evidence: Personal workspace provisioning and share/legacy decision flows previously used separate writes. New database functions serialize provisioning, fail closed on owner inconsistency, enforce roles, and write state plus audit events in one transaction. Function execution is restricted to `service_role`.  
Impact: Partial failures could produce ownerless workspaces, incorrect access state, or missing security history.  
Attack precondition: A concurrent request or database failure during a multi-write operation.  
Recommendation: Apply migrations in order and run the production integrity queries and Supabase advisors before launch.  
Confidence: High  
Regression test: Migration coverage verifies concurrency locking, role checks, audit inserts, and explicit grants; production transaction tests remain required.

ID: SEC-004  
Severity: Medium  
Title: Mutation routes lacked consistent body bounds, schema validation, and cross-origin protection  
Status: Confirmed — remediated for the reviewed routes  
Location: `src/lib/request-body.ts`, `src/proxy.ts`, `src/app/api/**`  
Evidence: Raw `request.json()` calls were replaced with bounded Zod parsing in reviewed body-bearing routes. Cookie-authenticated API mutations reject cross-site fetches and mismatched origins. CLI bearer-token requests without cookies remain supported.  
Impact: Malformed or oversized payloads could consume resources; cross-site requests could trigger an authenticated mutation.  
Attack precondition: Network access, and for CSRF a signed-in browser.  
Recommendation: Keep new mutation routes on the shared parsing helper and add route-level authorization tests with production-like cookies.  
Confidence: High  
Regression test: `tests/security-hardening.test.ts` covers redirect and policy invariants; add integration requests in the production acceptance environment.

ID: SEC-005  
Severity: High  
Title: Production database and provider configuration is not yet verified  
Status: Needs verification — database portion verified
Location: Supabase, Vercel, Upstash, Cloudflare Turnstile, Sentry, Resend dashboards  
Evidence: Production migrations now match through `20261003154937`; aggregate integrity checks returned zero owner, private-draft, invitation, RLS, or function-grant violations. CAPTCHA secret, SMTP delivery, shared limiter, Sentry delivery, service health, and backups still require provider verification.
Impact: Missing configuration could block authentication or abuse controls, or leave production permissions different from reviewed migrations.  
Attack precondition: Deployment with incomplete or stale provider configuration.  
Recommendation: Complete DATA-009 through DATA-015, SEC-009, AUTH-004 through AUTH-006, PLAT-004, and OPS provider checks before inviting users.  
Confidence: High  
Regression test: Run safe production integrity queries, advisors, health checks, email tests, monitoring test events, and the role matrix.

ID: SEC-006  
Severity: Medium  
Title: The server data layer retains broad service-role database access  
Status: Hardening  
Location: `src/lib/supabase/server.ts`, initial Supabase grants and RLS policies  
Evidence: Server routes use a service-role client with broad table permissions and therefore depend on application and RPC authorization checks rather than end-user RLS for most operations. No service-role key was found in tracked files or public environment names.  
Impact: A future route-level authorization mistake could have broad database impact.  
Attack precondition: A server authorization bug or server credential compromise.  
Recommendation: Continue moving sensitive mutations into narrowly authorized database functions and consider a restricted application database role after launch stabilization.  
Confidence: High  
Regression test: Maintain cross-workspace and role-boundary tests for every new object operation.

## Coverage matrix

| Area | Result |
| --- | --- |
| Authentication and recovery | Reviewed; production CAPTCHA/email settings pending |
| Object and workspace authorization | Reviewed statically; production role matrix pending |
| Input validation and request limits | Implemented for body-bearing reviewed routes |
| CSRF and browser headers | Implemented; production header verification pending |
| Tokens and secrets | Hashed token storage confirmed; tracked-secret scan clean |
| Dependencies | Production audit clean on October 3, 2026 |
| Database RLS/functions | Migration review completed; live advisors and state pending |
| Monitoring, backups, restore | Code/runbook present; provider verification pending |
