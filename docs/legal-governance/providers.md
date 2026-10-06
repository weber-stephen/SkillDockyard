# Provider and data-processing register

Observed technical role is not a legal classification. Do not call any provider a subprocessor, claim a data location, or make transfer/DPA statements until counsel/owner verifies the relevant contract and configuration.

| Provider | Observed technical role | Data/process category to verify | Status |
| --- | --- | --- | --- |
| Vercel | Web hosting and deployment platform. | Hosting logs, deployment data, contracting entity, region, retention, transfer mechanism. | Requires counsel/owner decision |
| Supabase | Authentication, Postgres, sessions, confirmation/recovery email workflow, application records. | Region, DPA, backup/retention, Auth settings, transfer mechanism. | Requires counsel/owner decision |
| Resend | SMTP delivery for Supabase Auth email. | Recipient/email data, DPA, region, retention, transfer mechanism. | Requires counsel/owner decision |
| Cloudflare Turnstile | Signup/login/recovery bot protection. | Cookie/device-signal classification, notice/consent, DPA, transfer mechanism. | Requires counsel/owner decision |
| Sentry | Scrubbed error monitoring and source-map upload. | Event fields, retention, region, DPA, transfer mechanism. | Requires counsel/owner decision |
| Upstash | Shared production rate limiting. | Request-derived key content, retention, region, DPA, transfer mechanism. | Requires counsel/owner decision |
| GitHub / npm | Source/release workflow and connected-computer command distribution. | Whether either processes customer personal data in the final user flow. | Requires counsel/owner decision |

## Evidence rule

Store only the contract/DPA identifier, configuration-review date, and non-sensitive conclusion in [evidence.md](evidence.md). Keep agreements and account records in the approved private storage location.
