# Skill Dockyard permissions

This document defines who can access a skill, what sharing means, and who can update or publish it.

## The short version

- **Access** means someone can see, compare, and download a skill.
- **Sharing** gives a person or workspace access to one specific skill.
- **Proposing an update** means suggesting a new version without changing the published version.
- **Publishing** means making a proposed version the official version that teammates receive.
- **Managing shares** means creating or revoking access for other people or workspaces.
- **Private drafts** are visible only to the user who created them and are not part of the workspace review queue.

Sharing never transfers ownership. A shared recipient can work on a copy or submit a proposal, but the source workspace remains responsible for the canonical skill.

Private drafts are personal working copies. They cannot be shared, reviewed, or published by anyone else until their creator explicitly submits them for workspace review.

## Workspace roles

| Role | View, compare, download | Propose updates | Publish or archive | Share or revoke |
| --- | --- | --- | --- | --- |
| Owner | Yes | Yes | Yes | Yes |
| Reviewer | Yes | Yes | Yes | Yes |
| Editor | Yes | Yes | No | No |
| Viewer | Yes | No | No | No |

Owners and reviewers are the source workspace decision-makers. Editors can contribute changes for review. Viewers can use the skill without changing its review state.

## Share permissions

A skill may be shared with either an individual user or a workspace.

| Share permission | Recipient can view, compare, and download | Recipient can propose an update | Recipient can publish or reshare |
| --- | --- | --- | --- |
| **Can propose updates** | Yes | Yes | No |
| **View only** | Yes | No | No |

“Can propose updates” is the default for a new share because it supports collaboration while keeping publishing under source-workspace control.

Sharing with a workspace makes the skill available to that workspace’s current and future members while the share is active. It does not add those people to the source workspace.

## Invites and access lifecycle

Workspace membership invitations are separate from skill-share invitations. A workspace invite adds the addressed account to the workspace; a skill share grants access to one skill and never adds a member. Workspace invites default to Viewer and may grant Viewer, Editor, or Reviewer, but never Owner. Only the accountable workspace owner may create or revoke membership invites or rename the workspace. Invite links are single-use bearer links stored as hashes, expire after seven days, and can only be accepted by a signed-in account whose verified email matches the invitation. Accepting an invite is atomic and records an audit event; an existing member’s role is not overwritten.

- A share to a known workspace can become active immediately.
- A share to an individual, or to a workspace identified by owner email, remains pending until the invite is accepted.
- Only the intended account can accept an individual invite.
- Declining an invite does not grant access.
- Revoking an active share removes future access without deleting the canonical skill, versions, proposals, or audit history.
- Declining or revoking a workspace invitation does not add membership and preserves the invitation audit history.
- Access must come from workspace membership or an active share. Opening a link, downloading a file, or copying content does not create access.

## Updates and publishing

1. A user chooses whether a new skill is a private draft or a workspace skill.
2. Private drafts remain visible only to their creator until they explicitly submit them for review.
3. An eligible workspace member or shared recipient submits a workspace proposal or proposed version.
4. The proposal is stored against the canonical skill with the proposer, timestamp, and access path.
5. Owners or reviewers compare the proposal with the published version and inspect trust notes.
6. The proposal remains unpublished until an owner or reviewer explicitly approves it.
7. Downloads use the latest approved version for workspace skills. A private draft may be downloaded only by its creator.

Until approval, teammates should continue receiving the previous published version. The UI must clearly distinguish a **proposed update** from the **published version**.

## Enforcement requirements

Permission checks must happen in server-side code for every sensitive operation:

- Listing or loading a skill
- Creating or accepting a share
- Proposing an update
- Publishing or archiving a version
- Revoking a share

The UI should reflect these permissions with clear labels and disabled or hidden actions, but UI state is not an authorization boundary. When permission is unclear, deny access, deny publishing, and do not silently promote changes.

## Audit requirements

Preserve audit history for:

- Shares created, accepted, declined, and revoked
- Proposed updates
- Publish and archive decisions
- The actor, timestamp, source workspace, and relevant source share

Audit history should remain available after a share is revoked.
