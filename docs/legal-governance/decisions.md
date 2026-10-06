# Legal decisions

Status values: **Recorded** means an owner/product decision exists; **Requires counsel/owner decision** means it is not settled; **Counsel approved** requires a non-sensitive evidence reference in [evidence.md](evidence.md).

| ID | Decision | Status | Owner | Evidence / next action |
| --- | --- | --- | --- | --- |
| LG-001 | Product name and operating description are **Skill Dockyard**, a shared skill management platform. | Recorded | Stephen | [Brand strategy](../brand-strategy.md). Trademark clearance remains open. |
| LG-002 | Beta target is free, business-use-oriented, no paid plans, advertising, behavioral analytics, or intentional collection of credentials or sensitive personal data. | Recorded | Stephen | [Self-service beta readiness](../self-service-beta-readiness.md). Final Terms restrictions still require counsel review. |
| LG-003 | Technical access may be global, but the service must not be represented as universally available or legally cleared in every territory. | Requires counsel/owner decision | Stephen + counsel | Decide targeted territories, EU/UK representative analysis, regional rights, and transfer posture. |
| LG-004 | Public Privacy Policy, Terms of Service, and Support pages are not attorney-approved final agreements. | Recorded | Stephen | Do not claim approval or compliance; obtain written counsel review before broad launch. |
| LG-005 | Users acknowledge versioned Terms and Privacy before public-beta app access; acceptance is not a role or authorization source. | Recorded | Stephen | Versioned acceptance migration `20261006044659` is applied; final document text still requires counsel review. |
| LG-006 | Public signup is controlled by the server-only application flag and Supabase Auth provider setting; both must be deliberately enabled together. | Recorded | Stephen | Follow [public-beta owner runbook](../public-beta-owner-runbook.md); keep paused until P0 gates are evidenced. |
| LG-007 | Support, privacy, and security communications use `support@skilldockyard.com`, but monitored ownership and escalation coverage are not yet evidenced. | Requires owner decision | Stephen | Complete OPS-007; record private mailbox evidence only in [evidence.md](evidence.md). |
| LG-008 | Retention periods, deletion exceptions, backup lifecycle, and legal-hold policy are not yet defined. | Requires counsel/owner decision | Stephen + counsel | Complete OPS-010; do not promise deletion timing or completeness. |
| LG-009 | Incident-notification threshold, authority, recipients, content, and timing are not yet defined. | Requires counsel/owner decision | Stephen + counsel | Complete OPS-010 and counsel review before making external notification commitments. |
| LG-010 | Provider role labels, contracts/DPAs, data locations, transfers, and subprocessor presentation are unresolved. | Requires counsel/owner decision | Stephen + counsel | See [providers.md](providers.md); do not call providers subprocessors until confirmed. |
| LG-011 | Legal entity name, jurisdiction, address, privacy contact, insurance, governing law, and dispute position are unresolved. | Requires counsel/owner decision | Stephen + counsel | Required before final Terms/Privacy publication. |
| LG-012 | Account deletion cannot silently delete or reassign a sole-owner Workspace, private draft, share, or audit history. | Recorded | Stephen | Follow the owner-recovery and data-rights procedure; counsel must approve final lifecycle wording. |
