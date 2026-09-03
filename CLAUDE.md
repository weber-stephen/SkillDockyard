# Skill Dockyard product guidance

## Core product tenet

Skill Dockyard is a shared skill library for both Codex and Claude Code.

- Treat portable `SKILL.md` content as a **shared skill**, never as a Claude-only skill.
- Product copy, labels, onboarding, documentation, and examples must make Codex and Claude Code equally visible when compatibility matters.
- Keep the legacy `claude_skill` identifier only where it is required for database and API compatibility; do not expose it in the product UI.
- When a skill is not portable between both tools, state the limitation clearly and name the compatible tool.

## Collaboration trust invariants

Skill Dockyard must protect authorship, review boundaries, and recipient expectations. Sharing must never silently expand access or publishing power.

### Sharing rules

- A skill can be shared to either:
  - an individual user
  - a workspace
- Sharing an individual skill does not transfer ownership of that skill.
- Sharing a skill must always show the target clearly before confirmation.
- Sharing must create an explicit access record; access must never be inferred from a download, link open, or copied content alone.
- If the target is not already authorized in context, sharing must use an invite-and-accept flow before access becomes active.
- Revoking a share must remove future access without deleting the canonical skill history.

### Access rules

- Personal workspaces remain private by default.
- A user must only see a skill if one of these is true:
  - they are a member of the source workspace
  - the skill was shared directly to them and the share is active
  - the skill was shared to a workspace they belong to and the share is active
- Access to a shared skill grants visibility only to that skill and its review context; it does not grant access to unrelated skills, workspace settings, exports, or member management.
- Sharing to a workspace makes the same canonical skill visible to all current and future members of that workspace while the share remains active.
- Sharing to a workspace must not silently grant source-workspace membership.

### Update rules

- Any user with active shared access may view, download, compare, and propose an update to that skill unless the product explicitly labels the share as view-only.
- Proposed updates must be recorded as proposals against the canonical skill, never as silent overwrites.
- Every proposal must preserve attribution:
  - who proposed it
  - when it was proposed
  - which access path allowed the proposal
- Recipients must be able to improve a shared skill without taking ownership of it.
- A proposed update must never become the published version without an explicit publish decision.

### Publishing permission rules

- Publish authority is separate from share access.
- By default, sharing grants proposal rights, not publishing rights.
- Only authorized owners or reviewers of the source workspace may publish, approve, or deprecate a skill.
- A user who received a direct individual share or workspace share must not gain publish rights unless they separately hold the required source-workspace role.
- Downloads presented as the shared or approved version must always resolve to the latest explicitly approved version, not the latest proposed version.
- If a newer proposal is pending review, the product must say so clearly and must not imply that teammates are receiving it yet.

### Trust and safety rules

- The UI must always distinguish:
  - private
  - shared
  - proposed update
  - approved version
- The product must never imply that a recipient can edit or publish unless they actually can.
- The product must never imply that a proposal is live for teammates before approval.
- Audit history for sharing, proposals, approvals, revocations, and deprecations must be preserved.
- When there is any permission ambiguity, the safer behavior wins:
  - no access
  - no publish
  - no silent promotion of changes
