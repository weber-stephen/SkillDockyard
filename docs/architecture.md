# Skill Dockyard architecture

This document is the repository map for humans and coding agents. Read it before changing authentication, permissions, database migrations, API routes, deployment configuration, or the CLI. Product terminology and authorization rules remain defined by [AGENTS.md](../AGENTS.md) and [permissions.md](permissions.md).

## System shape

Skill Dockyard is a Next.js App Router application with three user-facing surfaces:

1. Public marketing, legal, support, login, signup, recovery, and demo pages.
2. The authenticated workspace application under `/app`, backed by Supabase Auth and Postgres.
3. The connected-computer command package, published as `skill-dockyard`, which calls authenticated API routes with short-lived pairing codes and hashed bearer tokens.

Vercel runs the web application. Supabase provides authentication and Postgres. Upstash Redis provides shared production rate limiting. Cloudflare Turnstile protects signup, login, and password recovery. Sentry receives scrubbed errors and source-map-enhanced stack traces. Resend delivers Supabase Auth email through SMTP.

```text
Browser / connected computer
        |
        v
Next.js App Router + proxy headers/CSRF checks
        |              \
        |               \-- Sentry instrumentation and scrubbed errors
        |
        +-- Supabase Auth (email/password, verified sessions, CAPTCHA)
        |
        +-- server-only Supabase client -> Postgres + RLS + transactional RPCs
        |
        +-- Upstash Redis -> distributed rate limits
        |
        +-- Cloudflare Turnstile -> signup/login/recovery bot protection
        |
        +-- Resend SMTP <- Supabase Auth email
```

## Request and trust boundaries

- Public pages may use demo fixtures, but demo data must never be confused with production workspace data.
- Browser requests use the publishable Supabase key and authenticated cookies. Server routes enforce authorization; hidden or disabled UI controls are not security boundaries.
- The service-role key is server-only. It is used by server routes and provisioning functions and must never enter client bundles, logs, or error responses.
- Connected computers use pairing codes once, then hashed bearer tokens. They can import, download, check, and install skills, but cannot publish or manage access.
- Cookie-authenticated state-changing API requests require same-origin request metadata. Bearer-token CLI requests are separately authenticated.
- Expensive or abuse-sensitive routes use the shared Upstash limiter in production. Missing production limiter configuration fails closed.

## Authentication flow

1. Public self-service signup is closed during the pilot. The `/signup` page directs prospective users to invitation support rather than calling `signUp`.
2. A controlled operator can use `npm run pilot:invite -- person@example.com` only after the legal gates in [closed-pilot-operations.md](closed-pilot-operations.md) are complete. It uses the server-only service-role key to send Supabase Auth’s expiring invitation email and redirects the recipient through `/auth/confirm` to set a password.
3. Supabase Auth must also have **Allow new users to sign up** disabled; removing the browser form alone is not an authorization boundary.
4. `src/app/auth/confirm/route.ts` verifies the token server-side, sets the session cookies, and redirects only to a safe local path.
5. Password recovery uses the same confirmation route and continues to `/reset-password`.
6. The app creates or retrieves exactly one personal workspace through the transactional `ensure_personal_workspace` RPC.
7. Workspace invitations require a verified, normalized matching email and are accepted through transactional database functions. They are distinct from pilot-account invitations.

Production Auth decisions recorded on October 5, 2026:

| Setting | Value | Rationale |
| --- | --- | --- |
| JWT expiry | `3600` seconds | One-hour access-token lifetime. |
| Inactivity timeout | `0` | No inactivity-based session timeout selected for the initial release. |
| Time-box user sessions | `0` | No maximum session lifetime selected for the initial release. |
| Compromised refresh-token detection/revocation | Enabled | Supabase should revoke potentially compromised refresh-token sessions. |
| Leaked-password protection | Not enabled | Requires a Supabase plan upgrade; this is a documented residual risk, not an implementation omission. |

## Authorization model

The source of truth for workspace ownership is the owner membership plus the accountable `workspaces.owner_user_id`. Skill metadata such as `artifacts.owner` is descriptive only.

- `owner`: manages workspace membership, sharing, publishing, and workspace settings.
- `reviewer`: reviews and publishes submissions but cannot transfer ownership unless an explicit product rule is added.
- `editor`: adds skills and submits updates; cannot publish.
- `viewer`: views and uses available skills; cannot submit or publish.
- `Can view`: shared recipient can view, compare, and download.
- `Can submit updates`: shared recipient can submit an update; publication still requires source-workspace authorization.

Every object-level operation must fail closed on the server. Ownership transfer, membership administration, sharing, share acceptance/revocation, private-draft promotion, and publishing use transactional database functions where audit history is part of the contract.

## Data model and migration rules

Postgres migrations live in `supabase/migrations` and are applied in filename order. Do not edit an applied migration. Add a forward migration, test it, dry-run it, apply it to the linked project, then compare local and remote migration histories.

Core relations include:

- `workspaces`, `workspace_members`, `workspace_invites`
- `repos`, `artifacts`, `artifact_versions`
- `proposals`, `proposal_reviews`, `approvals`, `audit_events`
- `artifact_shares`, `notifications`
- `cli_pairing_codes`, `cli_tokens`, `skill_downloads`, `skill_installations`
- `user_accounts`, `workspace_onboarding`, and workspace settings/risk rules

All public tables must have deliberate RLS or be deliberately inaccessible through the Data API. Privileged functions must declare their security mode, fixed `search_path`, and explicit execute grants.

## Repository map

| Path | Responsibility |
| --- | --- |
| `src/app` | Next.js pages, layouts, API routes, auth callback, metadata, sitemap, and robots. |
| `src/components` | UI and client interaction components. |
| `src/lib` | Access checks, Supabase clients, ingestion, CLI auth, rate limits, redirects, parsing, and domain logic. |
| `supabase/migrations` | Ordered database schema, RLS, grants, and transactional functions. |
| `src/cli` | Oclif command implementation compiled for Node 22. |
| `tests` | Unit, migration-invariant, security, permissions, and workflow regression tests. |
| `scripts/smoke-pages.ts` | Production route and internal-link smoke checks. |
| `scripts/supabase-backup.sh` | Creates encrypted local Supabase logical backups outside the repository. |
| `.github/workflows` | CI verification and tagged CLI publishing. |
| `docs` | Brand, permissions, architecture, launch, security, operations, and release documentation. |

## Environment contract

Browser-safe values use `NEXT_PUBLIC_`. Everything else is server-only:

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Canonical origin: `NEXT_PUBLIC_SITE_URL`
- Shared limiter: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- CAPTCHA: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; the corresponding secret is configured in Supabase Auth CAPTCHA settings
- Monitoring: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- Optional direct scanner connector: `SKILL_DOCKYARD_INGEST_TOKEN`, `SKILL_DOCKYARD_INGEST_WORKSPACE_ID`
- Closed-pilot operator gate: `PILOT_INVITATIONS_ENABLED=true` only in a controlled operator environment after counsel approval; it is not a browser-safe value.

Local values belong in `.env.local`. Production values belong in Vercel. Never commit populated environment files or copy secrets into documentation.

## Change protocol for agents

Before changing a feature:

1. Read `AGENTS.md`, this document, and `docs/permissions.md` when access or workspace behavior is involved.
2. Read `docs/brand-strategy.md` and `docs/brand-system.md` when public copy or visual behavior changes.
3. Trace the server route, access helper, database policy/function, and audit event together.
4. Add or update regression tests before changing authorization-sensitive behavior.
5. Run typecheck, lint, tests, production build, page smoke, production dependency audit, CLI build, and package dry run as applicable.
6. For migration changes, run Supabase dry-run, apply in order, compare migration history, run advisors, and execute aggregate-only integrity checks.
7. Push visual changes to the launch branch so Vercel creates a preview. Never mark a provider or acceptance checklist item complete without evidence from that provider or environment.

## Operational references

- [Production launch checklist](production-launch-checklist.md)
- [Production launch plan](production-launch-plan.md)
- [Production operations runbook](production-operations-runbook.md)
- [Security audit](security-audit-2026-10-03.md)
- [Permissions model](permissions.md)
