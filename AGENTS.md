# Agent instructions

## Brand strategy

Read [docs/brand-strategy.md](docs/brand-strategy.md) before changing public positioning, marketing copy, brand identity, homepage narrative, or the product name. It defines the target customer, positioning, messaging hierarchy, brand personality, visual direction, competitive territory, and naming guardrails.

The product language and terminology below remains authoritative for interface copy. If the brand strategy and the terminology rules appear to conflict, follow the terminology rules.

## Product language and terminology

Use the terms in this section consistently in user-facing copy, including navigation, headings, buttons, form labels, help text, empty states, notifications, and error messages.

Write for capable workplace users who may be new to agent skills. Use plain, reassuring language and make the next action obvious. Avoid infrastructure jargon in primary UI copy. Technical terms may appear in advanced help and developer documentation when they add necessary precision.

Do not rename database fields, API properties, route names, or other internal identifiers solely to match product copy. Internal terms such as `artifact`, `proposal`, `mcp_server`, `repo`, and `content_hash` may remain in code. Translate them at the user-interface boundary.

### Core terms

| Use in the app | Meaning | Avoid in primary UI copy |
| --- | --- | --- |
| **Skill** | A reusable set of instructions for an AI tool | Artifact, asset |
| **Skills** | The main collection of skills available to the user | Skill library, inventory |
| **Private draft** | A skill only its creator can access | Personal artifact, private skill |
| **Workspace skill** | A skill managed by the user's workspace | Team artifact |
| **Shared skill** | A skill another person or workspace shared with the user | External artifact |
| **Example skills** | Editable skills supplied to help someone get started | Starter pack, seed content |
| **Workspace** | The shared area containing members and workspace skills | Organization, tenant |
| **Connector** | A connection or service a skill uses | MCP, MCP server, integration |
| **Tool** | A capability a skill can use, such as Jira or Stripe | Function, dependency |

Use **Connector** in all user-facing copy. Use **MCP server** only when technically necessary in developer documentation.

### Creating and changing skills

| Use in the app | Meaning | Avoid in primary UI copy |
| --- | --- | --- |
| **Add a skill** | Create a new private draft or workspace submission | Create artifact, ingest |
| **Import skills** | Bring installed skills into Skill Dockyard | Scan skills, ingest skills |
| **Submit for review** | Send a new skill to workspace reviewers | Create proposal, share draft |
| **Submit an update** | Suggest changes to a published skill | Propose an update, submit proposal |
| **Submission** | A new skill or update awaiting a decision | Proposal |
| **Submission details** | The explanation of what was added or changed | Proposal metadata |
| **Withdraw submission** | Remove a submission from consideration | Cancel proposal |
| **Writing guide** | Guidance for writing a complete skill | Validator, lint rules |

Use **My submissions** and **Submissions to review** in navigation and page headings. A `proposal` in the data model is a **submission** in the interface.

### Reviewing and publishing

| Use in the app | Meaning | Avoid in primary UI copy |
| --- | --- | --- |
| **Review** | Examine a submission before deciding what happens | Approval workflow |
| **Published version** | The version currently available to teammates | Approved version, shared copy |
| **Submitted version** | The version currently being reviewed | Candidate version, current copy |
| **Compare versions** | See the differences between submitted and published versions | Line diff |
| **Publish** | Make the submitted version available to teammates | Approve, accept |
| **Request changes** | Return a submission for revision | Fail review |
| **Reject** | Close a submission without publishing it | Deny |
| **Review history** | Previous review decisions and notes | Audit trail |

Do not use **Approve** as a synonym for **Publish** in the interface. Publishing describes the user-visible outcome. Internal permission documentation may still use “approve” when describing the authorization rule.

### Status terms

Use statuses for the object they describe; do not mix skill, submission, and installation statuses.

- Skill: **Private draft**, **Published**, **Archived**.
- Submission: **Awaiting review**, **Changes requested**, **Published**, **Rejected**, **Withdrawn**, **Replaced by newer submission**.
- Installed skill: **Up to date**, **Update available**, **Local changes found**, **Not installed**.

Avoid **Improvement available**. It makes a quality judgment and can be confused with an installable update. Use **Replaced by newer submission** instead of **Superseded** in the interface.

### Ownership and responsibility

| Use in the app | Meaning |
| --- | --- |
| **Created by you** | The signed-in user originally created the skill |
| **Managed by _Workspace_** | The workspace controls publishing and sharing |
| **Maintained by** | An optional contact for questions, not an access-control role |
| **Workspace owner** | The person who administers the workspace |
| **Reviewer** | Can review and publish submissions |
| **Editor** | Can add skills and submit updates |
| **Viewer** | Can view and use available skills |

Do not use skill metadata such as **Maintained by** to imply authorization or workspace ownership. A skill can be created by one person, maintained by another, and managed by a workspace. The permission model below remains authoritative.

### Sharing and access

Use these terms consistently:

- **Share skill**
- **Shared with you**
- **Shared with your workspace**
- **Can view**
- **Can submit updates**
- **Remove access**
- **Invitation**
- **Pending invitation**

Use **Can view** instead of “View only” and **Can submit updates** instead of “Can propose” in interface controls. Supporting copy must clarify that submitted updates still require review. Internal permission names such as `view` and `propose` may remain unchanged.

### Downloads, installs, and updates

| Use in the app | Meaning | Avoid in primary UI copy |
| --- | --- | --- |
| **Download** | Download a ZIP copy of a skill | Export skill |
| **Install** | Put a skill into Codex or Claude Code | Deploy |
| **Connected computer** | A computer paired with Skill Dockyard | CLI connection, token |
| **Skill Dockyard command** | A terminal command used for importing or updating | CLI command |
| **Check for updates** | Find newer published versions | Sync, scan |
| **Install update** | Replace an installed version with the published version | Apply package |
| **Downloads** | Number of downloaded copies | Pulls |
| **Installs** | Skills installed through a connected computer | CLI installs |

Use **CLI** only in advanced or developer-facing documentation. In general interface copy, prefer **connected computer**, **Terminal**, or **Skill Dockyard command**.

### Safety and compatibility

| Use in the app | Avoid in primary UI copy |
| --- | --- |
| **Compatibility and safety** | Compatibility and Trust Signals |
| **Review notes** | Trust notes, risk signals |
| **Tools requiring review** | High-impact tools |
| **Allowed connectors** | Approved MCP servers, approved integrations |
| **No review notes found** | No risks detected |
| **Check before publishing** | Risk warning |

A review note means an item needs attention; it does not automatically mean the skill is unsafe.

### Navigation labels

Use these navigation labels:

- **Overview**
- **Skills**
- **My submissions**
- **Submissions to review**
- **Invitations**
- **Notifications**
- **Workspace settings**
- **Export skill list**
- **Getting started**
- **Add skill**

### Internal-only terminology

Keep these terms out of primary interface copy unless technical precision is required:

- Artifact
- Proposal
- MCP or MCP server
- Integration
- CLI
- Repository or repo
- Scanner
- Ingest
- Candidate version
- Content hash
- Supabase
- RLS
- Source workspace

## Permissions and sharing

Before changing access, sharing, workspace roles, update proposals, publishing, invites, or revocation behavior, read [docs/permissions.md](docs/permissions.md). It is the source of truth for the product permission model.

Keep these boundaries intact:

- Sharing a skill never transfers ownership.
- A proposal is not published until an owner or reviewer explicitly approves it.
- View-only recipients cannot propose updates.
- Permission checks must be enforced on the server, not only hidden or disabled in the UI.
- Revoking access removes future access but preserves the skill and audit history.

## Workspace ownership

Read [docs/permissions.md](docs/permissions.md) before changing workspace ownership, membership roles, transfer behavior, or owner recovery.

- A new user’s personal workspace is created for that user, and the creator becomes its initial owner.
- `workspace_members.role = "owner"` is the authorization source for owner actions. `workspaces.owner_user_id` identifies the accountable workspace owner and must remain consistent with that membership.
- `artifacts.owner` is skill metadata, not an authorization field. Never infer workspace ownership from skill metadata, email domain, proposal authorship, or a copied/shared skill.
- A workspace has one accountable owner at a time. Owner-only actions must fail closed when ownership data is missing or inconsistent.
- Ownership transfer is allowed only when initiated by the current owner and directed to an existing member of the same workspace.
- Ownership transfer must be atomic, must create an audit event, and must not publish, reject, reassign, or otherwise change pending proposals.
- After transfer, the previous owner remains a workspace member and becomes a reviewer unless an explicit product rule says otherwise.
- Do not remove or deactivate the current owner until ownership has been transferred. If an owner account is deleted or unavailable, preserve the workspace, skills, proposals, shares, and audit history and require an explicit recovery process.
- Reject transfers to the current owner, non-members, or members of another workspace. Serialize concurrent transfers so they cannot produce multiple owners.
- If `owner_user_id` and the owner membership disagree, do not silently repair the data or guess an owner from the first viewer. Treat it as an integrity issue and block ownership-sensitive actions until it is reconciled.
- A private draft remains owned by its original creator. Workspace ownership changes do not grant access to, transfer, publish, or otherwise reassign private drafts.
- Existing shares remain intact during ownership transfer. Sharing never transfers ownership.
- Email addresses are display and contact data only. Use immutable user IDs for authorization.
- Reviewers may review and publish proposals but cannot transfer workspace ownership unless an explicit product rule grants that capability.
- Every ownership check must be enforced in server-side code. UI controls are not an authorization boundary.
- An ownership mutation and its audit event must succeed together; never report a successful transfer if audit logging fails.

## Workspace membership administration

- Workspace membership invites are distinct from skill shares. Never add a workspace member as a side effect of sharing a skill.
- New membership invites default to `viewer`; selectable roles are `viewer`, `editor`, and `reviewer`. Never issue an owner role through the invite flow.
- Only the accountable owner may invite, revoke membership invitations, or rename the workspace. Fail closed when `owner_user_id` and the owner membership disagree.
- Store only a hash of an invite token. Accept only pending, unexpired invitations when the signed-in verified email matches the normalized invite email.
- Accept, decline, revoke, rename, and invitation creation must be server-authorized and auditable. A new workspace member must not gain access to another user’s private draft.
