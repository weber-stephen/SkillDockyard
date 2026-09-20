# Skill Dockyard user flows

These diagrams describe the current product behavior in the app. They were regenerated from the routes and API handlers under `src/app`, the UI components under `src/components`, and the access rules in `src/lib/access.ts`.

## Flow index

| Flow | Entry point | Primary roles |
| --- | --- | --- |
| Account access | `/signup`, `/login` | Visitor |
| First-run setup | `/getting-started` | Workspace member |
| Import installed skills | `/getting-started#scanner`, CLI | Workspace member |
| Add a new skill | `/app/submit` or `/demo/submit` | Workspace member or demo visitor |
| Propose an update | `/artifacts/:id` → `/artifacts/:id/update` or `/submit/update` | Owner, reviewer, editor, proposer-share recipient |
| Review and publish | `/review-queue`, `/artifacts/:id/review` | Owner or reviewer |
| Share a skill | `/artifacts/:id` | Owner or reviewer |
| Accept or decline a share | `/invites` | Invite recipient |
| Download a published skill | `/artifacts/:id` | Any user with access |
| Configure trust and scanner settings | `/settings/repos`, `/settings/risk-rules` | Workspace member |
| Export inventory | `/exports` | Workspace member |
| Track proposal activity | `/submissions`, `/notifications` | Submitter or reviewer |

## 1. Account access

```mermaid
flowchart TD
    A[Visitor] --> B{Choose an action}
    B -->|Create account| C["/signup"]
    B -->|Log in| D["/login"]
    B -->|Explore| E["/demo"]
    C --> F[Enter email and password]
    F --> G[Supabase sign-up]
    G --> H[Confirmation email]
    H --> I["/auth/confirm?next=/app"]
    I --> J[Private workspace opens]
    D --> K[Enter credentials]
    K --> L[Supabase password sign-in]
    L --> J
    E --> M[Demo-only data and actions]
```

## 2. First-run setup

```mermaid
flowchart TD
    A[Open /getting-started] --> B{Choose a setup path}
    B -->|Add manually| C[Select Add a skill]
    C --> D["/submit"]
    B -->|Import installed skills| E[Select Import my skills]
    E --> F[Scanner panel appears]
    D --> G[First submission milestone]
    F --> H[First scan milestone]
    G --> I[Setup marked complete]
    H --> I
    A --> J[Dismiss setup]
    J --> K[Setup hub hidden]
```

## 3. Import installed skills

```mermaid
flowchart TD
    A[Workspace member opens scanner] --> B[POST /api/scan-tokens]
    B --> C[One-time token shown once]
    C --> D[Copy CLI command]
    D --> E[Run skill-dockyard scan --installed]
    E --> F[CLI scans standard Codex and Claude Code skill folders]
    F --> G[POST /api/scan with Bearer token]
    G --> H{Token valid and active?}
    H -->|No| I[401: import rejected]
    H -->|Yes| J[Ingest skill metadata, content, versions, and trust signals]
    J --> K[Record first-scan milestone]
    K --> L[Refresh setup page]
    L --> M[Imported skills appear in library]
    C --> N[Optional: revoke token]
    N --> O[Token can no longer authorize scans]
```

## 4. Add a new skill in the demo

```mermaid
flowchart TD
    A[Open /demo/submit] --> B[Choose New skill]
    B --> C[Paste full instructions]
    C --> D[Add name, path, repo, and change summary]
    D --> E[Client validates required fields]
    E --> F[Build submission and content hash]
    F --> G[Run compatibility and trust checks]
    G --> H[POST /api/submissions?demo=1]
    H --> I[Prepare local browser draft]
    I --> J[Show demo-only result and trust-note count]
    E -->|Invalid| K[Show inline validation error]
```

## 5. Add a new skill to the live workspace

```mermaid
flowchart TD
    A[Open /app/submit] --> B[Choose New skill]
    B --> C[Paste full instructions]
    C --> D[Add name, path, repo, and change summary]
    D --> E[Client validates required fields]
    E --> F[Build submission and content hash]
    F --> G[Run compatibility and trust checks]
    G --> H[POST /api/submissions]
    H --> I{Live workspace configured?}
    I -->|No| J[503: show live workspace configuration error]
    I -->|Yes| K[Ingest artifact and version]
    K --> L[Create new pending proposal]
    L --> M[Notify source-workspace owners and reviewers]
    M --> N[Show pending proposal and compare link]
    E -->|Invalid| O[Show inline validation error]
```

## 6. Propose an update to a shared skill

```mermaid
flowchart TD
    A[Open an accessible skill] --> B{Access permission}
    B -->|View only| C[Can read, compare, and download]
    C --> D[Cannot propose or publish]
    B -->|Can propose| E[Select Propose an update]
    E --> F["/artifacts/:id/update"]
    F --> G[Start from current skill content]
    G --> H[Edit instructions and explain what improved]
    H --> I[Build new version and trust signals]
    I --> J{Matches published hash?}
    J -->|Yes| K[Reject: add a change before submitting]
    J -->|No| L[Ingest candidate version]
    L --> M{Existing proposal pending?}
    M -->|Yes| N[Mark older proposal superseded]
    M -->|No| O[Continue]
    N --> O
    O --> P[Create pending update proposal]
    P --> Q[Notify source owners and reviewers]
    Q --> R[Published version remains active]
```

## 6a. Save and promote a private draft

```mermaid
flowchart TD
    A[Open /submit] --> B[Choose Private to me]
    B --> C[Enter skill and metadata]
    C --> D[Scan and save private artifact]
    D --> E[Only creator can view or download]
    E --> F{Ready to share?}
    F -->|No| G[Keep private draft]
    F -->|Yes| H[Submit for workspace review]
    H --> I[Create pending new-skill proposal]
    I --> J[Owner or reviewer compares and publishes]
```

## 7. Review and publish a proposal

```mermaid
flowchart TD
    A[Owner or reviewer opens Review queue] --> B[Select pending proposal]
    B --> C["/artifacts/:id/review"]
    C --> D[Compare candidate with published baseline]
    D --> E[Inspect hashes, trust notes, and proposed content]
    E --> F{Current candidate still latest?}
    F -->|No| G[409: refresh; newer proposal exists]
    F -->|Yes| H{Choose decision}
    H -->|Publish| I[RPC decide_proposal]
    I --> J[Proposal becomes published]
    J --> K[Candidate becomes approved version]
    K --> L[Teammates receive new download version]
    H -->|Request changes| M[Require review note]
    M --> N[Proposal becomes changes_requested]
    N --> O[Published version remains active]
    H -->|Reject| P[Require rejection note]
    P --> Q[Proposal becomes rejected]
    Q --> O
    J --> R[Notify submitter]
    N --> R
    Q --> R
```

## 8. Share a skill

```mermaid
flowchart TD
    A[Owner or reviewer opens published skill] --> B[Choose Share Skill]
    B --> C{Share target}
    C -->|Individual| D[Enter recipient email]
    C -->|Workspace| E{Known workspace?}
    E -->|Yes| F[Choose workspace]
    E -->|No| G[Enter workspace owner email and name]
    D --> H{Permission}
    F --> H
    G --> H
    H -->|Can propose updates| I[POST /api/shares permission=propose]
    H -->|View only| J[POST /api/shares permission=view]
    I --> K{Known workspace target?}
    J --> K
    K -->|Yes| L[Share active immediately]
    K -->|No| M[Share pending acceptance]
    L --> N[Recipient sees shared skill]
    M --> O[Recipient sees invite in /invites]
    A --> P[Current share owner selects Revoke access]
    P --> Q[Share marked revoked; future access removed]
```

## 9. Accept or decline a share invite

```mermaid
flowchart TD
    A[Recipient opens /invites] --> B[See pending email invite]
    B --> C{Choose response}
    C -->|Accept| D[POST /api/shares/:id/accept]
    D --> E{Invite addressed to signed-in email?}
    E -->|No| F[Show error]
    E -->|Yes| G{Workspace share needs a recipient workspace?}
    G -->|Yes, missing| H[Show error: create a workspace first]
    G -->|No or available| I[Share becomes active]
    I --> J[Skill appears in library]
    C -->|Decline| K[POST /api/shares/:id/decline]
    K --> L[Share becomes declined]
    L --> M[Skill does not enter library]
```

## 10. Download a published skill

```mermaid
flowchart TD
    A[Open accessible skill page] --> B[Choose Codex or Claude Code]
    B --> C[Choose Mac or Windows]
    C --> D{Published and portable?}
    D -->|No| E[Download unavailable with reason]
    D -->|Yes| F[GET /api/artifacts/:id/download]
    F --> G[Generate ZIP from approved version]
    G --> H[Record download audit event]
    H --> I[Browser downloads ZIP]
    I --> J[Extract and copy skill folder to target directory]
    J --> K[Start new Codex session or let Claude Code detect it]
    A --> L{Pending change exists?}
    L -->|Yes| M[Explain download is still the last published version]
    L -->|No| N[Offer current published version]
```

## 11. Configure scanner and trust rules

```mermaid
flowchart TD
    A[Open /settings/repos] --> B[Edit config file, allowed connectors, and high-impact tools]
    B --> C[PUT /api/settings]
    C --> D{Supabase configured?}
    D -->|No| E[Demo is read-only; show disabled save]
    D -->|Yes| F[Persist workspace settings]
    F --> G[Future scans and submissions use updated rules]
    H[Open /settings/risk-rules] --> I[Review current allowed connectors and high-impact tools]
```

## 12. Export the skill inventory

```mermaid
flowchart TD
    A[Open /exports] --> B{Choose format}
    B -->|JSON| C[GET /api/export?format=json]
    B -->|CSV| D[GET /api/export?format=csv]
    C --> E[Download inventory with status, hashes, and reviewer fields]
    D --> E
```

## 13. Track proposal activity

```mermaid
flowchart TD
    A[Submit proposal] --> B[Proposal appears in /submissions]
    A --> C[Reviewers receive proposal_submitted notification]
    D[Reviewer decision] --> E{Decision}
    E -->|Published| F[Submitter receives proposal_published notification]
    E -->|Changes requested| G[Submitter receives changes_requested notification]
    E -->|Rejected| H[Submitter receives proposal_rejected notification]
    F --> I[Submitter reviews status in /submissions]
    G --> I
    H --> I
    C --> J[Reviewer opens /notifications]
```

## Permission invariants represented in the flows

- Sharing never transfers ownership.
- Only source-workspace owners and reviewers can publish, manage shares, or revoke shares.
- New skills can be saved as creator-only private drafts or submitted directly as workspace proposals.
- Private drafts cannot be shared, reviewed, or published until the creator submits them for workspace review.
- Owners, reviewers, editors, and recipients with `propose` permission may propose updates; view-only recipients may not.
- A proposal is not published until an owner or reviewer explicitly chooses Publish.
- Requesting changes or rejecting a proposal leaves the last published version active.
- Revoking a share removes future access while preserving the skill and its audit history.
- Workspace membership invites are distinct from skill shares and default to Viewer.
- Only the owner can create/revoke membership invites or rename the workspace; invite links are hashed, expire after seven days, and require a matching verified email.
- Adding a member never exposes another creator’s private draft.

## 14. Invite a workspace member

```mermaid
flowchart TD
    A[Owner opens /settings] --> B[Enter email and choose Viewer, Editor, or Reviewer]
    B --> C[POST /api/workspace-invites]
    C --> D[Create hashed, seven-day invite and audit event]
    D --> E[Copy secure invite link]
    E --> F[Recipient opens /invite/:token]
    F --> G{Signed in with matching verified email?}
    G -->|No| H[Log in or create account, preserving invite link]
    G -->|Mismatch| I[Explain which email must accept]
    H --> F
    G -->|Yes| J[Accept invitation]
    J --> K[Atomically add membership and audit acceptance]
    K --> L[Member can access workspace skills, not private drafts]
```

## 15. Rename a workspace

```mermaid
flowchart TD
    A[Owner opens /settings] --> B[Edit workspace name]
    B --> C[PATCH /api/workspace]
    C --> D{Owner and workspace identity consistent?}
    D -->|No| E[Block mutation and show integrity warning]
    D -->|Yes| F[Trim and validate 1-80 characters]
    F --> G[Update name and audit event atomically]
    G --> H[Refresh navigation and workspace labels]
```
