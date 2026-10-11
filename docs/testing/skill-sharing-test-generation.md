# Skill-sharing test generation record

## Reproducibility

- **Generated with:** GPT-5 Codex
- **Skill:** `ai-test-generation` 2.0
- **Input source:** product flows APP-001 through APP-011 plus `docs/permissions.md`, `src/lib/access.ts`, `src/lib/shares.ts`, proposal/submission/download routes, and migrations.
- **Source baseline:** `35680d03e0f0753ae6cc6692aa240ab2786b2c0d`

## 1. Requirements

| ID | Requirement |
| --- | --- |
| REQ-1 | A source owner or reviewer can share a skill with an individual; only the verified addressed account can activate it. |
| REQ-2 | A source owner or reviewer can share a skill with a workspace without transferring ownership or creating membership. |
| REQ-3 | A user without source-workspace membership or an active matching share cannot access or update the skill. |
| REQ-4 | An eligible recipient can submit an update; only a source owner or reviewer can publish, reject, or request changes. |
| APP-001 | Repeated supported provisioning for a verified user creates exactly one personal workspace and owner membership. |
| APP-002 / APP-011 | Only the private-draft creator can access or download its current version; workspace and shared skills download their published version. |
| APP-003 through APP-005 | Editor, reviewer, and viewer actions are constrained by their workspace role at the server boundary. |
| APP-007 through APP-010 | Submitted updates stay unpublished until review; revocation, withdrawal, replacement, rejection, and requested changes preserve canonical published data. |

## 2. Risks and invariants

- An individual share must not grant access before acceptance or to a different account.
- A workspace share must apply only to target-workspace members and must not create source membership.
- View-only and unshared users must not create a candidate version or proposal.
- A rejected or changes-requested update must preserve the published version; only publication promotes the candidate.
- Every share and decision lifecycle mutation must retain its audit/review record.

## 3. Coverage matrix, scenarios, and oracles

| Scenario | Requirement | Level | Positive oracle | Negative oracle |
| --- | --- | --- | --- | --- |
| SC-001 Individual share acceptance | REQ-1 | Local Supabase acceptance | Pending share becomes active for the named recipient; share/accept audit events exist | Outsider has no permission |
| SC-002 Workspace share | REQ-2 | Unit + local Supabase acceptance | Target member receives workspace scope; active workspace share exists | No source membership is inserted |
| SC-003 Unshared access | REQ-3 | Unit + API boundary | No matching permission is returned | No proposal/version/RPC mutation occurs |
| SC-004 Publish update | REQ-4 | API boundary + local Supabase acceptance | Candidate becomes approved/current; review record exists | Publication is not possible for a viewer |
| SC-005 Reject/request changes | REQ-4 | API boundary + local Supabase acceptance | Decision and note persist | Published baseline remains approved; installed-copy update notification is not sent |
| APP-001 Personal workspace | APP-001 | Local Supabase acceptance | Two provisioning calls return one workspace with one owner membership and audit event | A second workspace or owner membership is never inserted |
| APP-004 Reviewer administration denial | APP-004 | Local Supabase acceptance | Reviewer may still use review capabilities covered by SC-004 | Reviewer cannot invite members or rename the workspace; no invite, rename, or audit side effect exists |
| APP-005 Viewer submission denial | APP-005 | API boundary | Viewer receives `403` before ingestion | No artifact, candidate version, proposal, notification, or server client mutation starts |
| APP-007 Pending shared update | APP-007 | API boundary + local Supabase acceptance | Update-capable recipient produces an awaiting-review candidate | Approved version remains the prior published version |
| APP-008 / APP-009 Share revocation | APP-008 / APP-009 | Local Supabase acceptance | Canonical workspace, creator, published version, and audit records remain | Revoked recipient has no future permission and receives no membership |
| APP-010 Withdrawal/replacement | APP-010 | API boundary | Withdrawal scopes to the submitter's awaiting-review proposal; replacement supersedes only the older pending submission | Neither flow publishes a candidate or mutates the artifact directly |
| APP-011 Download selection | APP-002 / APP-011 | API boundary | Workspace/shared downloads use approved content; private download uses current content and records that version | Unavailable artifact produces `404` without download recording |

## 4. Review decisions

| Test area | Decision | Notes |
| --- | --- | --- |
| `tests/access.test.ts` | KEEP | Tests pure permission outcomes without implementation coupling. |
| `tests/shares.test.ts` | KEEP | Verifies server inputs to the atomic share RPC and no membership side effect. |
| Submission and decision API tests | KEEP | Assert both mutation and absence-of-mutation outcomes. |
| Local Supabase acceptance suite | KEEP | Uses synthetic verified `@example.com` identities, fresh fixture IDs, real migrations/RPCs, and persisted state assertions. |
| App-flow API and download tests | KEEP | Assert selected version IDs and server-side denial before persistence rather than UI state. |

## 5. Mechanical verification

Run `npm run typecheck`, `npm run lint`, `npm test`, and the local-stack sequence in the required CI `verify` job. No generated selector, endpoint, or helper is invented: acceptance tests call only committed provisioning, sharing, workspace-administration, and proposal-decision RPCs; route tests import existing API handlers.
