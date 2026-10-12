# WCAG 2.2 AA critical-journey coverage

## Purpose and scope

This record defines the automated accessibility coverage for the highest-value workspace journeys. It supplements, rather than replaces, the exploratory assistive-technology checks in the QA strategy. The suite runs against the production-built demo because it provides deterministic, non-sensitive content while exercising the same user-facing routes and components as the workspace application.

Target conformance is WCAG 2.2 AA. Automated axe checks use only `wcag2a`, `wcag2aa`, and `wcag22aa` tags. A passing scan is not a conformance claim: axe does not verify meaningful text alternatives, logical focus order, focus not obscured (2.4.11), dragging alternatives (2.5.7), or all target-size cases (2.5.8).

## Risks and test oracles

| Journey | Primary risk | Automated scenarios | Test oracle |
| --- | --- | --- | --- |
| Skills | A user cannot orient themselves or find a skill with landmarks, headings, and labelled search. | Skills list with normal content and filtered result. | One `main`, labelled primary navigation, an `h1` named “Skills”, search labelled by its placeholder/accessibility name, and no tagged axe violations. |
| Add skill | Validation feedback is not announced or form controls lack names. | Empty first-step submission; populated two-step private-draft submission. | Each required field is reachable by keyboard and has a visible/programmatic label; validation feedback is a live alert/status and focus returns to the failed step; no tagged axe violations in normal and validation states. |
| Submission review | A reviewer cannot discover the decision controls or receive required-note feedback. | Review screen before and after attempting “Request changes” without a note. | One descriptive `h1`, review-note control with an accessible name, decision buttons reachable and named, live validation feedback, and no tagged axe violations in both states. |
| Skill sharing | Sharing choices are exposed as operable controls with names and state, and feedback is announced. | Open an owner-managed demo skill; switch recipient type and submit an incomplete share. | Recipient type has a labelled group and selected state, permission and recipient fields have labels, button is keyboard-operable, feedback is announced, and no tagged axe violations. |
| Workspace settings | Workspace configuration fields and navigation have clear names and a usable focus path. | Settings page and the visible settings-area links. | Page has an `h1`, labelled settings-area region, descriptive links, and no tagged axe violations. |
| Responsive navigation | The mobile navigation drawer lets focus escape or fails to announce its trigger state. | Open drawer, verify Tab wraps inside it, then close with Escape. | Trigger exposes `aria-expanded` and `aria-controls`; open surface is a labelled modal dialog; initial focus moves inside; Tab stays within the dialog; Escape closes it and returns focus to the trigger; no tagged axe violations while open. |
| Bypass navigation | Keyboard users must not tab through global navigation before reaching task content. | First Tab from each app journey. | The first focused control is “Skip to main content”; Enter moves focus to the sole `main` landmark. |

## Coverage design

- `tests/browser/a11y.ts` centralizes the axe scan and attaches full JSON results to Playwright artifacts. No rules are suppressed and no owned UI is excluded.
- `tests/browser/accessibility.spec.ts` uses stable roles, accessible names, labels, and `main`/navigation landmarks. It deliberately avoids CSS selectors and whole-page snapshots.
- The suite scans content plus the important feedback/open-menu states. It also performs keyboard-focused assertions for skip navigation, the mobile drawer, form validation, form completion, and review controls.
- Tests assert behavior visible to assistive technology. They do not attempt to assert color contrast tokens, target dimensions, or screen-reader speech output that requires human assistive-technology testing.

## Remaining manual accessibility work

Before a release that changes these journeys, perform and record:

1. VoiceOver with Safari on macOS for route announcements, heading navigation, form labels/errors, the sharing chooser, and the mobile drawer.
2. A visual keyboard pass at desktop and mobile widths, including focus-not-obscured at 200% zoom and touch-target checks.
3. Human contrast review for Operational Cobalt text, controls, attention states, and disabled states in their rendered contexts.
4. Keyboard/assistive-technology checks for authenticated-only data states, browser-import file pickers, native confirmation dialogs, and any third-party widgets; those are not represented by deterministic demo fixtures.

## Resulting automated coverage

The scenarios above are implemented as seven Playwright checks in `tests/browser/accessibility.spec.ts` and run as part of `npm run test:browser` in `CI / verify`. The per-flow matrix in `app-flow-coverage.md` is unchanged because no `APP-###` authorization/lifecycle claim is added or changed by this browser accessibility coverage.
