---
name: web-app-security-audit
description: Perform an authorized, non-destructive security audit of a web application, its REST APIs, and database, producing prioritized findings with evidence and remediation. Use for codebase security reviews; do not use for unauthorized probing or destructive penetration testing.
---

# Web App Security Audit

Perform a repository-grounded security review and produce an actionable report. Assume the user authorizes review of the supplied code and configuration, but do not infer authorization to attack external hosts, access real customer data, bypass controls, or change production state.

## Operating rules

- Start by identifying the application framework, deployment shape, authentication provider, REST surface, database engine, migrations, background jobs, and third-party integrations.
- Read local instructions such as `AGENTS.md`, `CLAUDE.md`, and relevant permission or security policies before reviewing or changing anything.
- Prefer static inspection, tests, local fixtures, schema inspection, and safe request construction. Do not run destructive payloads, exploit chains, credential attacks, denial-of-service tests, or scans against live systems.
- Never print, copy, or include secrets, tokens, session cookies, private keys, or personal data in the report. Redact values and report only the file, code path, and secret type.
- Distinguish confirmed vulnerabilities from plausible risks, missing evidence, and hardening recommendations. Do not call something vulnerable merely because a control was not found until the relevant code path and configuration were traced.
- Do not modify application behavior while auditing unless the user explicitly asks for fixes. If fixes are requested, preserve existing permission boundaries and verify them with tests.

## Review workflow

1. Establish scope and threat model. Record in-scope source paths, deployment environments, trust boundaries, sensitive data, actor types, and any unavailable runtime or configuration evidence.
2. Build an attack-surface inventory. Locate route handlers/controllers, middleware, auth/session code, serializers, file or URL fetches, webhooks, admin paths, database clients, migrations, raw SQL, ORM queries, secrets/configuration, logging, and dependency manifests.
3. Trace representative requests end to end: untrusted input → parsing/validation → authorization → business logic → database or external call → response/logging. Pay special attention to object identifiers, tenant/workspace identifiers, role changes, ownership, and state transitions.
4. Review the REST API and application controls using the checklist in [references/security-checklist.md](references/security-checklist.md). Cover authentication, authorization/BOLA, input validation, injection, SSRF, file handling, CORS/CSRF, rate limits, error handling, security headers, sensitive-data exposure, webhooks, and auditability.
5. Review the database and data layer. Check least-privilege roles, connection handling, TLS assumptions, SQL/ORM construction, migrations, schema exposure, row/record-level authorization, tenant isolation, `SECURITY DEFINER` or equivalent privileged routines, views, backups, retention, and sensitive data at rest.
6. Inspect dependencies and operational configuration for known insecure patterns, leaked credentials, unsafe defaults, debug exposure, permissive origins, disabled verification, missing lockfiles, and vulnerable or abandoned packages. Use available local tooling, but do not download or contact external services without authorization.
7. Validate high-confidence findings with the safest available evidence: focused tests, type or lint checks, local reproduction against synthetic data, or a minimal code-path trace. Stop at proof of impact; do not escalate an exploit.
8. Produce the report below, then summarize the top risks and the smallest useful remediation sequence.

## Required report format

Use one finding per issue with:

```text
ID: SEC-001
Severity: Critical | High | Medium | Low | Informational
Title: concise vulnerability statement
Status: Confirmed | Likely | Needs verification | Hardening
Location: file:line or endpoint/table/function
Evidence: short code/config observation or safe reproduction
Impact: affected asset, actor, and worst credible consequence
Attack precondition: what access or circumstance is required
Recommendation: concrete remediation and safe verification test
Confidence: High | Medium | Low
```

Rank severity by exploitability and impact, not by how easy the code is to improve. Group duplicate manifestations under one root-cause finding. Include a concise scope/limitations section and a coverage matrix showing which major areas were reviewed or blocked by missing evidence. Never include weaponized exploit code or live secrets.

For each confirmed or likely issue, add a regression-test idea. If the user requested implementation, make the smallest safe change, read any applicable permission policy first, and verify both the intended fix and neighboring authorization paths.

## References

Read [references/security-checklist.md](references/security-checklist.md) during the audit. It is a focused checklist, not a substitute for tracing the actual application behavior.
