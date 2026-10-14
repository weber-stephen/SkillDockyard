# OPS-009 public-test counsel packet

**Status:** Preparation inventory only. This packet is not legal advice, a legal opinion, an approval record, or a statement that Skill Dockyard is ready for broad or global launch.

Use this packet with the [legal governance register](README.md) and [legal-readiness review](../legal-readiness-review.md). Keep counsel correspondence, contracts, customer data, credentials, raw support requests, and private evidence outside the repository.

## Product and release scope

- Skill Dockyard is a free, business-use-oriented skill-management product. It has no paid plans, advertising, ad-personalization, or sale of personal information.
- The intended release is a public test, not an assertion of broad commercial or global availability.
- Public self-service signup remains paused. It may be enabled only after the documented P0 gates have actual evidence and both the Vercel application flag and Supabase Auth signup setting are deliberately enabled.

## Observed product behavior

| Area | Observed behavior | Open review question |
| --- | --- | --- |
| Authentication | Email/password signup, confirmation, sign-in, and recovery use Supabase Auth. Signup requires a server-side Terms/Privacy acknowledgement, Turnstile, and email confirmation. | Identity, regional rights, authentication-cookie, and provider posture. |
| Workspace data | The service stores workspace names, memberships, roles, invitations, ownership, onboarding state, and settings. | Retention, deletion scope, sole-owner handling, and legal holds. |
| Skills and collaboration | The service stores skill instructions, versions, reviews, submissions, shares, download/install activity, and audit records. Sharing does not transfer ownership. | User-content license, acceptable use, retention, export scope, and records that must be preserved. |
| Connected computers | Pairing-code hashes, bearer-token hashes/hints, expiry/revocation state, and installation records support local command use. | Token lifecycle, export/deletion handling, and incident procedure. |
| Browser-local data | Demo drafts, download history, and analytics-consent preference may be stored locally in the browser. | Notice, controls, retention, and regional treatment. |
| Reliability and security | Sentry receives scrubbed errors; Upstash supports rate limits; Cloudflare Turnstile protects authentication flows. | Provider roles, contracts, data locations, retention, transfers, and incident obligations. |
| Optional analytics | Google Tag Manager and Google Analytics load only after consent. Events use route categories, fixed action labels, and validated campaign parameters; ad storage, ad user data, and ad personalization are denied. | Consent/cookie classification, provider role, retention, transfers, and regional availability. |

## Providers to review

Review the observed roles in [providers.md](providers.md): Vercel, Supabase, Resend, Cloudflare Turnstile, Sentry, Upstash, Google Tag Manager/Google Analytics, and GitHub/npm. Do not label any provider a subprocessor or make data-location, transfer, DPA, or retention claims until the applicable contracts and configuration are reviewed.

## Operational gaps

- There is no self-service account deletion or personal-data export. **Export skill list** is not a personal-data export.
- Retention periods, backup lifecycle, deletion exceptions, legal holds, and incident-notification authority are not decided.
- Sole-owner workspaces, private drafts, shares, and audit history must not be silently deleted, reassigned, or published during a request.
- OPS-010 exercises require a controlled test account and explicit environment authorization. Exercise evidence belongs in the approved private password-manager secure note, not this repository.

## Decisions and approval required

Counsel and/or the owner must resolve the items recorded in [decisions.md](decisions.md), including:

1. Legal entity, contact, jurisdiction, targeted territories, and regional-rights posture.
2. Privacy, Terms, user-content, acceptable-use, suspension, termination, liability, governing-law, and dispute language.
3. Provider roles, contracts, locations, transfers, retention, and presentation.
4. Cookie/local-storage, Turnstile, Sentry, and analytics treatment.
5. Retention, deletion, export, backup, legal-hold, and incident-notification procedures.

When written counsel approval exists, record only its non-sensitive reference, approved document versions, scope, date, and constraints in [evidence.md](evidence.md). Do not mark OPS-009 complete before then.
