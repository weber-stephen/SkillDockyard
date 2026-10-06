# Public document register

| Document | Public route | Current version / status | Owner | Required before final publication |
| --- | --- | --- | --- | --- |
| Privacy Policy | `/privacy` | Versioned in code; provisional, not attorney-approved. | Stephen | Legal entity/contact, processing map, providers, regional rights, retention, transfers, security/incident wording, counsel approval. |
| Terms of Service | `/terms` | Versioned in code; provisional, not attorney-approved. | Stephen | Eligibility, user-content license, acceptable use, IP, suspension/termination, disclaimers, liability, governing law/disputes, counsel approval. |
| Support | `/support` | Public guidance; monitoring commitment not evidenced. | Stephen | OPS-007 support ownership and escalation evidence; counsel-approved rights/incident language if added. |
| Public-beta owner runbook | Internal repository document | Current operational procedure; not public legal terms. | Stephen | Complete private evidence and exercises; update for operational changes. |
| Production operations runbook | Internal repository document | Current technical incident/rollback procedure; notification terms unresolved. | Stephen | Counsel/owner incident-notification decision. |

## Version-control rule

When a public Privacy or Terms change is material, update its version constant, document the reason in [decisions.md](decisions.md), retain the prior version in Git history, and verify the re-acceptance gate before deployment. Do not alter public legal text based only on a repository decision when counsel approval is required.
