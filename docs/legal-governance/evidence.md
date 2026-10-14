# Legal-readiness evidence register

This register contains references, not sensitive evidence. Use private record identifiers or secure-storage links only when they reveal no credentials, customer data, contract contents, or personal contact details.

| ID | Date | Gate / decision | Evidence reference | Result | Owner | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| E-001 | 2026-10-05 | Production migration baseline | Supabase migration-history comparison through `20261005221243`. | Passed | Stephen/Codex | Legal-acceptance migration was later applied. |
| E-002 | 2026-10-06 | Legal acceptance migration | `20261006044659_legal_acceptances` applied; table/RLS/browser-grant metadata verified. | Passed | Stephen/Codex | Keep migration history aligned. |
| E-003 | 2026-10-06 | Backup before legal-acceptance migration | Stephen confirmed a production backup was completed. | Recorded | Stephen | Add private archive/evidence identifier and restore-test result. |
| E-004 | 2026-10-11 | OPS-007 support ownership | Namecheap forwarding and Gmail/Resend sending-path test; operating procedure in [support-email-runbook.md](../support-email-runbook.md). No mailbox address or credentials recorded. | Closed | Stephen | Recheck quarterly and after a DNS, Namecheap, Gmail, or Resend change; assign independent backup coverage when available. |
| E-005 | — | OPS-009 counsel review | No written approval reference recorded. | Open | Stephen + counsel | Record non-sensitive approval reference and scope. |
| E-006 | 2026-10-12 | OPS-010 deletion/export/retention/incident exercise | Controlled exercise sequence and evidence requirements documented in [ops-010-exercise-runbook.md](../ops-010-exercise-runbook.md). No completed exercise evidence recorded. | Open | Stephen + Codex | Run exercises with an authorized test account; record retention and incident-notification decisions before closure. |
| E-007 | 2026-10-14 | OPS-009 preparation inventory | [Public-test counsel packet](ops-009-public-test-packet.md) reconciles shipped signup and consent-gated analytics behavior with the provider and document registers. | Recorded | Stephen + Codex | Counsel review, owner decisions, and written approval remain open. |

## Entry format for new evidence

Record the gate/decision ID, date, outcome, accountable owner, secure evidence location or reference, and next review date. If evidence is incomplete, record that fact rather than marking the item passed.
