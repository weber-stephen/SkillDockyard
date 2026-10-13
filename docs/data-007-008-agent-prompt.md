# Handoff prompt — DATA-007 and DATA-008

You are implementing the remaining production security gates `DATA-007` and `DATA-008` in the Skill Dockyard repository.

First, read these files completely before changing code:

1. `AGENTS.md`
2. `docs/architecture.md`
3. `docs/permissions.md`
4. `docs/production-launch-checklist.md`
5. `docs/production-launch-plan.md`
6. The relevant Next.js guide under `node_modules/next/dist/docs/`

## Objective

Complete and evidence both requirements:

- **DATA-007:** Verify server authorization for every object-level operation: list, read, download, submit, publish, request changes, reject, withdraw, share, accept, decline, revoke, invite, rename, and export.
- **DATA-008:** Make every security-sensitive mutation and its required audit event atomic. A request must not return success when its required audit event failed to persist.

## Constraints

- Preserve the permission model exactly. Server code is the authorization boundary; hidden UI controls are never sufficient.
- Read `docs/architecture.md` before changing API routes, database migrations, authentication, authorization, or permissions. Update it only if you make an intentional architectural decision.
- Read `docs/permissions.md` before changing sharing, roles, invitations, publication, revocation, proposals, or ownership behavior.
- Do not infer authority from email address, skill metadata, client-provided IDs, or UI state.
- Fail closed on missing or inconsistent workspace ownership.
- Never silently repair ownership data.
- Security-sensitive mutations and their audit inserts must occur in one transaction. Prefer a narrowly scoped database function and forward migration where the existing multi-call server flow cannot guarantee atomicity.
- Do not rewrite an applied migration. Add forward-only migrations if schema/database-function changes are necessary.
- Do not log secrets, bearer tokens, cookies, raw invitation tokens, or customer content.
- Preserve unrelated working-tree changes. Work on a focused feature branch and use a PR; do not commit directly to `main`.

## Required approach

1. Inventory every route, server action, and server helper that implements the operations in DATA-007. Trace the authenticated identity, object lookup, role/share check, mutation, and audit write for each.
2. Build or extend focused authorization tests. Include direct requests with cross-workspace IDs, private drafts, revoked shares, view-only shares, email-mismatched invitations, non-owner workspace administration, and role-boundary attempts. Test both UI-visible and direct API/server entry points.
3. Identify every mutation that product policy requires to be auditable. Verify that database mutation and audit-event creation are atomic; add regression tests that force the audit path to fail and assert no mutation succeeds.
4. Verify that successful HTTP responses occur only after the atomic operation has committed. Ensure errors are safe, non-enumerating where relevant, and use appropriate 401/403/404 behavior consistent with the existing product conventions.
5. Run the relevant automated checks plus at least:

   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```

6. Update the checklist evidence for `DATA-007` and `DATA-008` only after the implementation and tests pass. Include the exact test files or verification commands, not secrets or customer data.

## Deliverables

- Focused implementation and regression tests.
- Any necessary forward-only Supabase migration(s), with secure function properties/grants and fixed `search_path` where applicable.
- Updated architecture and launch-checklist evidence if warranted.
- A concise PR description listing the operation inventory, atomicity changes, verification commands/results, and residual risk.

Do not mark the work complete merely because the code compiles. Report any operation whose required audit semantics are ambiguous rather than guessing.
