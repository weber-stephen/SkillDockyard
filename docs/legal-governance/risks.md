# Legal and launch risk register

Ratings are operational prioritization, not legal conclusions. Close a risk only with evidence in [evidence.md](evidence.md) and, where required, counsel/owner approval.

| ID | Risk | Severity | Current status | Required control or decision |
| --- | --- | --- | --- | --- |
| R-001 | Privacy and regional compliance exposure from incomplete disclosures, rights process, and territorial analysis. | P0 | Open | OPS-009, OPS-010, finalized Privacy Policy, territory decision. |
| R-002 | User-content/IP exposure from skills that may contain protected, confidential, malicious, or unauthorized material. | P0 | Open | Counsel-approved Terms, user-content license, acceptable use, suspension and termination terms. |
| R-003 | Personal financial exposure from unresolved entity, insurance, liability, governing-law, and dispute posture. | P0 | Open | Owner/counsel decisions; code cannot close this risk. |
| R-004 | Operations/recovery exposure from unproven support ownership, backup cadence, restore exercise, and incident process. | P0 | Open | OPS-004, OPS-005, OPS-007, OPS-010 evidence. |
| R-005 | Global access could create regional rights, transfer, representative, or notice obligations. | P0 | Open | Counsel territorial analysis before broad launch or regional marketing. |
| R-006 | Public legal pages may overstate or omit actual processing and controls. | P0 | Open | Maintain document register; counsel review before final publication. |
| R-007 | Unauthorized access or abuse despite server authorization, RLS, CAPTCHA, rate limits, hashed tokens, and monitoring. | P1 | Mitigated, residual | Keep controls, regression tests, and incident exercises current. |
| R-008 | Existing workspace skill-list export may be mistaken for a personal-data export. | P1 | Open | Define and implement counsel-approved scoped rights export. |
| R-009 | Browser local storage and telemetry/cookie treatment may require additional notice or controls. | P1 | Open | Counsel classification of local storage, Turnstile, and Sentry. |
| R-010 | Ownership recovery could improperly affect Workspace access or audit history. | P1 | Open | Complete AUTH-007 with a verified recovery procedure. |

## Non-negotiable release rule

Unchecked P0 launch items remain blockers. An owner may record an explicit risk acceptance for a limited beta, but that does not make the service legally approved, compliant, or free of personal exposure.
