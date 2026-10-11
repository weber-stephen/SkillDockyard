# Skill-sharing test generation record

## Reproducibility

- **Generated with:** GPT-5 Codex
- **Skill:** `ai-test-generation` 2.0
- **Input source:** user acceptance requirements plus `docs/permissions.md`, `src/lib/access.ts`, `src/lib/shares.ts`, proposal/submission routes, and migrations.
- **Source baseline:** `0211486a8559f7c2d819784d575cce658c5e2326`

## 1. Requirements

| ID | Requirement |
| --- | --- |
| REQ-1 | A source owner or reviewer can share a skill with an individual; only the verified addressed account can activate it. |
| REQ-2 | A source owner or reviewer can share a skill with a workspace without transferring ownership or creating membership. |
| REQ-3 | A user without source-workspace membership or an active matching share cannot access or update the skill. |
| REQ-4 | An eligible recipient can submit an update; only a source owner or reviewer can publish, reject, or request changes. |

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

## 4. Review decisions

| Test area | Decision | Notes |
| --- | --- | --- |
| `tests/access.test.ts` | KEEP | Tests pure permission outcomes without implementation coupling. |
| `tests/shares.test.ts` | KEEP | Verifies server inputs to the atomic share RPC and no membership side effect. |
| Submission and decision API tests | KEEP | Assert both mutation and absence-of-mutation outcomes. |
| Local Supabase acceptance suite | KEEP | Uses synthetic verified `@example.com` identities, fresh fixture IDs, real migrations/RPCs, and persisted state assertions. |

## 5. Mechanical verification

Run `npm run typecheck`, `npm test`, and the local-stack sequence in the required CI `verify` job. No generated selector, endpoint, or helper is invented: acceptance tests call only `create_artifact_share`, `respond_to_artifact_share`, and `decide_proposal`, which are declared in the committed migrations.
