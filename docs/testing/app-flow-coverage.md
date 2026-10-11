# App-flow QA coverage

## Purpose

This is the living inventory for the product flows tracked as `APP-###`. It distinguishes the test level that provides evidence from the coverage that still needs to be added. It complements the detailed [skill-sharing test-generation record](skill-sharing-test-generation.md); it does not replace release evidence or exploratory testing.

## Coverage labels

- **Covered**: the stated behavior has a direct automated assertion at the indicated level.
- **Partial**: an important part is tested, but a stated outcome or server boundary still lacks direct evidence.
- **Missing**: no direct automated evidence exists.

`Unit` includes pure authorization rules. `API boundary` imports the route handler with its dependencies controlled. `Local Supabase acceptance` runs against disposable, migrated Supabase services. `Browser E2E` runs a user-visible journey. A mocked test is never evidence of database/RLS behavior.

## Current inventory

| Flow | Status | Automated evidence | Remaining coverage needed |
| --- | --- | --- | --- |
| APP-001: Personal workspace | Covered | Local Supabase acceptance provisions the same verified user twice and asserts one workspace, one owner membership, and one audit event. | None for the stated idempotent provisioning behavior. |
| APP-002: Private draft creator-only access/download | Partial | Unit permission coverage limits private drafts to the creator; download route returns `404` when data access denies the artifact. | Exercise the real data-access path with distinct authenticated creator and non-creator identities. |
| APP-003: Editor add/update but not publish | Covered | Submission API tests allow an Editor to add a skill and submit an update, both as awaiting review; role unit coverage blocks publishing. | None for the stated permissions. |
| APP-004: Reviewer publish but no owner administration | Covered | Local acceptance covers reviewer publication and rejects reviewer invite/rename attempts without persistence or audit side effects. | None for the stated permissions. |
| APP-005: Viewer view but cannot submit/publish | Covered | Unit permission coverage allows view scope; submission and decision API tests reject Viewer mutations before persistence. | None for the stated permissions. |
| APP-006: View-only shared recipient cannot update | Covered | Permission and submission API tests deny an update before candidate-version or proposal creation. | None for the stated restriction. |
| APP-007: Update-capable shared recipient submits unpublished version | Covered | API and local acceptance tests retain the approved version while the recipient’s candidate awaits review. | None for the stated lifecycle. |
| APP-008: Sharing preserves ownership and membership | Covered | Local acceptance covers workspace shares without source membership and individual-share revocation without creator/workspace/version changes. | None for the stated invariants. |
| APP-009: Revocation removes access but preserves records | Covered | Local acceptance revokes an accepted share, denies future permission, and retains the canonical artifact, published version, share row, and audit events. | None for the stated lifecycle. |
| APP-010: Submission resolution preserves published version | Covered | Local acceptance verifies publish, rejection, requested changes, withdrawal, and replacement; withdrawal/replacement retain the persisted approved version while API tests cover their authorization/status transitions. | None for the stated lifecycle. |
| APP-011: Download delivers the correct version | Partial | Route tests select the approved version for workspace/shared skills and the current version for a private draft. | Cover those selections through the real authorized data-access path; this closes APP-002’s identity boundary too. |

## Update rule

Update this table in the same pull request whenever an `APP-###` flow, its server authorization, or its automated test evidence changes. A new row must name the requirement, test level, test location, and any remaining gap. Downgrade a row to **Partial** or **Missing** if a test is removed or no longer exercises its stated boundary.

## Linked test evidence

- `tests/access.test.ts` — role, private-draft, share, and revoked-access permission rules.
- `tests/submission-api.test.ts`, `tests/proposal-decision-api.test.ts`, and `tests/proposal-withdraw-api.test.ts` — server mutation contracts.
- `tests/skill-download-api.test.ts` — download-version selection and unavailable-skill denial.
- `tests/acceptance/skill-sharing-and-updates.test.ts` — local Supabase lifecycle, ownership, audit, and role assertions.
