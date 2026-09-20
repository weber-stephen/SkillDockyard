# Web application security audit checklist

Use only the sections relevant to the repository. Record evidence or “not observable” rather than checking items mechanically.

## Identity, sessions, and authorization

- Authentication is required for every sensitive route; anonymous and partially authenticated states are intentional.
- Session cookies use `Secure`, `HttpOnly`, and an appropriate `SameSite` policy; tokens have bounded lifetime, rotation, and revocation behavior.
- Password reset, email verification, MFA, account recovery, and login error responses resist enumeration and abuse.
- Every object access checks ownership, tenant/workspace membership, or an explicit role on the server. Never rely on hidden UI controls or a client-supplied user/tenant ID.
- Create, update, delete, export, invite, role-change, publish, and revoke operations enforce authorization independently.
- Updates validate both the original record and the new owner/tenant fields; users cannot move records across tenants by changing an ID.
- Privileged endpoints use a deny-by-default policy and do not confuse authentication with authorization.

## REST API and HTTP behavior

- Request bodies, query parameters, path parameters, headers, pagination, sort fields, and filters are schema-validated and bounded.
- Responses omit secrets, password hashes, internal tokens, unnecessary PII, stack traces, and cross-tenant records.
- Content types, method allowlists, status codes, and redirect behavior are deliberate.
- CORS allows only required origins and methods; credentials are not combined with wildcard origins.
- State-changing browser requests have CSRF protection when cookie authentication is used.
- Rate limits, quotas, request-size limits, timeouts, idempotency, and abuse controls exist for login, reset, expensive queries, uploads, exports, and webhooks.
- Webhooks verify signatures, timestamps, replay protection, source expectations, and safe retry behavior.
- Security headers and cache directives prevent unsafe framing, content sniffing, accidental caching, and mixed content where applicable.

## Injection and server-side request risks

- SQL, NoSQL, shell, template, expression, LDAP, and path construction use parameterization or safe APIs; user-controlled identifiers are allowlisted.
- Output is encoded for its actual sink: HTML, attribute, JavaScript, CSS, URL, logs, CSV, or JSON.
- Markdown, rich text, uploads, and previews are sanitized with a narrowly configured allowlist.
- URL fetchers validate scheme, hostname, redirects, DNS rebinding behavior, private/link-local ranges, and response size to prevent SSRF.
- File names, archive extraction, temporary paths, image processing, and content-type checks prevent traversal, polyglots, decompression bombs, and executable uploads.
- Deserialization accepts only expected formats and rejects unsafe object or class construction.

## Database and data protection

- Application database roles use least privilege; runtime code does not use an owner, superuser, or administrative key unnecessarily.
- Database access is encrypted in transit and secrets are injected securely; connection strings are not exposed to clients or logs.
- Tables, views, functions, stored procedures, and API-exposed schemas have explicit access controls.
- Row-level or record-level policies enforce tenant and user isolation for reads and writes. Update policies constrain both old and new ownership values.
- Privileged routines are rare, narrowly scoped, schema-qualified, safe from search-path hijacking, and not executable by public roles by default.
- Migrations do not silently broaden access, disable authorization, expose debug tables, or create unsafe defaults.
- Sensitive fields have an appropriate minimization, encryption, retention, backup, and deletion strategy.
- Audit records for security-sensitive actions are tamper-resistant enough for the threat model and do not store credentials or full sensitive payloads.

## Secrets, dependencies, and operations

- Repository history, build output, client bundles, logs, error tracking, and crash reports do not expose secrets or personal data.
- Public/client environment variables contain only intentionally public values; server-only keys cannot reach browser code.
- Dependencies are pinned or lockfile-controlled, reviewed for known vulnerabilities, and installed from trusted sources.
- Production configuration disables debug tools, test accounts, default credentials, verbose errors, unsafe CORS, and development bypasses.
- Admin access, key rotation, alerting, incident response, backups, and restore testing are appropriate to the data and threat model.
- Security-sensitive events are observable without logging bearer tokens, passwords, or raw personal data.
