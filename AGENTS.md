# Agent instructions

## Permissions and sharing

Before changing access, sharing, workspace roles, update proposals, publishing, invites, or revocation behavior, read [docs/permissions.md](docs/permissions.md). It is the source of truth for the product permission model.

Keep these boundaries intact:

- Sharing a skill never transfers ownership.
- A proposal is not published until an owner or reviewer explicitly approves it.
- View-only recipients cannot propose updates.
- Permission checks must be enforced on the server, not only hidden or disabled in the UI.
- Revoking access removes future access but preserves the skill and audit history.
