# Reddit-led soft launch plan

> For the current multi-channel strategy and schedule, use [the complete marketing plan](MARKETING_PLAN.md). This document remains useful for Reddit-specific background.

**Status:** Proposed; no posts, outreach, deployment, or analytics configuration have been performed under this plan. Founder approval is required before each external action. This plan replaces the LinkedIn-first channel sequence in the older launch documents. LinkedIn is excluded because the founder's profile is attached to their employment.

## Objective and audience

Learn whether people who use Codex or Claude Code need a dependable way to review, publish, and keep team AI skills current. The initial product use case remains a small marketing team's Campaign Brief Builder, but these communities also reach technical skill authors and team administrators. Treat them as a **secondary discovery segment**, not proof of demand among marketing leads.

For continuity with the existing instrumentation, a **first-skill signup** is a verified account that has added or imported a first skill, including an example skill. That is an activation proxy, not proof the person experienced value: an example can be installed without being used. Separately seek voluntary evidence that a person edited or used a skill for real work, or completed a meaningful compare-and-publish workflow. Record their role and team use case only if they choose to share it.

The aspirational goal remains 100 qualified signups in 30 days, not a forecast. Prioritize demonstrated value and useful feedback over votes and traffic.

## Channel choices

Research checked October 17, 2026; recheck subreddit rules, post composer, flair, pinned threads, and account eligibility immediately before posting. A relevant conversation or an old accepted post is not permission to promote.

1. **[r/claudeskills](https://www.reddit.com/r/claudeskills/)** — Strongest topic fit. [A team-distribution discussion](https://www.reddit.com/r/claudeskills/comments/1wgbdcl/enterprise_distributing_skills_to_technical_and/) describes shared folders and asks about review authority. The community requires topical, substantive posts, flair, and explanation when sharing one's own skill; it prohibits spam and posting the same thing across many subs. Use a tailored discussion/showcase only if current rules allow the product link. Risk: a tool showcase may be treated differently from a skill share; ask moderators when unclear.
2. **[r/codex](https://www.reddit.com/r/codex/)** — Strong Codex relevance. The [weekly showcase](https://www.reddit.com/r/codex/comments/1x52817/show_us_all_what_youve_been_building_with_codex/) invites projects built using Codex. Check the current thread and eligibility; describe actual Codex involvement truthfully. Start with one contextual comment rather than assuming a standalone ad is welcome.
3. **[r/ClaudeCode](https://www.reddit.com/r/ClaudeCode/)** — Strong Claude Code relevance. Its rules direct simple project sharing to the weekly showcase; a standalone Built with Claude Code post needs detail on what was built, how Claude Code was used, and lessons learned. Use only if the founder can truthfully meet the current thread's requirements. Do not imply Claude built the product if it did not.
4. **[r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/)** — Later, conditional option. Rules viewed during initial research required free-to-try access, minimal promotion, a clear description of how Claude helped, and stated OP karma must exceed 100 for feed posts. A separate review could not independently verify the exact threshold through the rules endpoint. Recheck the authenticated community rules and eligibility on the day; skip if requirements cannot be confirmed or met honestly.
5. **[Show HN](https://news.ycombinator.com/showhn.html)** — Optional second-week test for technical users, not a substitute for marketing-team validation. Submit the actual interactive demo, not a landing or signup page, if it is ready to try without an account; be available to discuss it. Check current account restrictions and never request votes.

Do not use LinkedIn. Warm, individually personalized feedback requests are optional only to people the founder is comfortable contacting; they are not a replacement for permission to post publicly.

## Fourteen-day schedule

Founder tasks are designed for roughly 30–60 minutes per day. All external actions require founder approval; Codex implementation and review time is separate.

| Day | Owner | Action | Time | Expected outcome / directional metric | Dependency |
| --- | --- | --- | ---: | --- | --- |
| 1 | Founder + Codex | Review the feature branch and approve or defer its PR/preview; check the public demo and campaign page on desktop and mobile. | 45m | Preview issues recorded; no release assumed | Founder approval for push/preview |
| 2 | Founder | Configure the existing GTM-to-GA4 destination and inspect consented test events. | 45m | Relevant events visible in DebugView, or a blocker recorded | GTM/GA4 access; preview |
| 3 | Founder | Test a verified signup and add/import one skill; record confusion. Make a separate production-release go/no-go decision after checking the deployed demo, signup, and email. | 30–60m | One completed test journey and an explicit release decision | Working test account and email; separate approval for production deployment |
| 4 | Founder | Read current r/claudeskills rules and recent conversations; contribute helpfully where appropriate, without a product pitch. | 30m | Notes on real questions and permission to post | Reddit account; current rules |
| 5 | Founder | If permitted, publish one tailored r/claudeskills post and stay for replies. Otherwise ask moderators or defer. | 45m | Post remains up; useful questions or feedback recorded | Explicit founder approval; compliant post; deployed demo |
| 6 | Founder | Reply thoughtfully and check whether the post remains visible; record objections and any voluntary feedback. | 30m | Feedback and post status logged | Day 5 post |
| 7 | Codex + Founder | Review funnel evidence and identify one actual friction point; fix only a verified, safe issue. | 45m | Ranked friction list; regression-tested fix if warranted | Analytics and feedback; approval for deployment |
| 8 | Founder | Read r/codex rules and its current showcase. Prepare a distinct Codex-specific comment and verify the build-history claim. | 30m | Compliant draft and verified eligibility | Current thread; truthful build details |
| 9 | Founder | If eligible and approved, post in the r/codex showcase; respond to questions. | 45m | Product-relevant conversations and observed visits | Day 8 checks; deployed demo |
| 10 | Founder | Review signup/activation and follow up only with people who voluntarily requested it. | 30m | At least one concrete insight, if responses permit | Consent and observed interest |
| 11 | Founder | Check current r/ClaudeCode showcase eligibility; post a distinct comment only if actual Claude Code involvement meets its requirements. Otherwise skip. | 30m | Feedback or a documented reason to skip | Current rules; founder approval |
| 12 | Founder | Evaluate Show HN eligibility and interactive demo; prepare a technical explanation without asking for votes. | 30m | Go/no-go decision and draft | Working no-signup demo; current HN rules |
| 13 | Founder | If eligible, approved, and able to stay available for discussion, submit Show HN; otherwise defer or conduct a feedback conversation. Reserve follow-up time the next day. | 45–60m | Questions and observations logged; no traffic promise | Day 12 decision; meaningful no-login demo workflow |
| 14 | Founder + Codex | Compare channel evidence, segment fit, objections, and activations; choose one next experiment. | 45m | Continue / iterate / stop decision | Post and funnel observations |

If the preview, signup, or analytics is broken, postpone distribution and fix or document the blocker first. No public launch is complete merely because the calendar reaches a scheduled day.

**Known measurement risk to verify before interpreting conversion:** The repository's documented signup-confirmation template uses `type=email`, while the confirmation route adds the marker for `signup_completed` only when `type=signup` ([README](../../README.md), [route](../../src/app/auth/confirm/route.ts)). If the deployed template follows the README, this event may not fire. Verify the actual confirmation flow and event before relying on signup-conversion figures; production template status is not established by the repository alone. Do not change authentication or production configuration without separate review and approval.

## First post draft: r/claudeskills

**Suggested flair:** Showcase, if permitted by the current rules and moderators. Lead with the founder connection; don't disguise promotion as an unrelated question.

**Title:** I built a way to review shared Claude Code skills—looking for feedback

**Body:**

I built Skill Dockyard to explore a problem that appears when several people improve the same AI skill: someone makes a useful change, but teammates may still have an older copy, or an unfinished change gets shared too soon.

One approach is to use Git or a shared folder; that may be enough for some teams. Skill Dockyard instead gives teammates a place to add or import a skill, submit an update, and compare it with the published version before a reviewer publishes the change. It supports skills used with Claude Code and Codex. The demo shows this with a campaign-brief skill; I would like to know whether the same review flow fits the skills your team actually uses.

The beta is free. There is also a public demo you can explore without creating an account: [insert the verified deployed demo URL if community rules permit].

How does your team handle this today—shared folders, Git, a marketplace, or something else? What becomes awkward as more people contribute?

Do not present this draft as permission to post. If rules prohibit product links or require a different format, follow the rules, ask a moderator, or skip the post. Avoid referral or tracking links where prohibited; a prior r/ClaudeAI moderation notice treated UTM parameters as referral-style tracking.

## Measurement and decisions

- Record community, date, current rule check, link used, post status, substantive replies, relevant objections, and follow-up permission. Never collect private account details from public participants.
- Track completed signups and first-skill events where consent and instrumentation permit; count demonstrated use separately through voluntary feedback. Use operational aggregate signup counts separately; don't join analytics to individual identities.
- **Signup conversion:** completed signups / unique homepage visitors. **Activation rate:** first-value users / completed signups. These are directional and only comparable for appropriately matched, consented populations. The existing `landing_page_view` counts the homepage, not direct demo or campaign-page visitors; do not use it as a denominator for those routes. See [ANALYTICS_PLAN.md](ANALYTICS_PLAN.md).
- A direct demo link, absent or blocked UTM tags, cross-device confirmation, consent refusal, and ad blockers can prevent reliable channel attribution or matching signup to first value. Use aggregate referral data when available and voluntary self-reported source; mark unknown sources as unknown. Record the cohort, date window, and consent limitation. Do not divide counts from unmatched populations or claim exact channel-to-user attribution.
- After 14 days: **Continue** a channel when it yields relevant conversations and activated users; **iterate** if people understand the problem but struggle with positioning or activation; **stop or reframe** if feedback consistently shows no need. Small samples support directional learning, not statistical significance.

## Open assumptions and founder decisions

- Hypothesis: technical skill authors can introduce the product to marketing teammates; validate explicitly rather than treating technical adoption as marketing adoption.
- After the first two channel tests, invite a few willing marketing-team users through contacts the founder is comfortable approaching, or explicitly leave the marketing-ICP hypothesis unanswered. Don't infer it from technical-community signups.
- No acquisition baseline supports forecasting 100 signups. After observing results, estimate a scenario as `qualified signups per channel per week × sustainable channel-weeks`; state the observed period and assumptions, and revise when results change.
- Confirm whether the founder actually used Claude Code to build the product before using Claude-specific showcase formats requiring that detail.
- Confirm the feature branch, production deployment, live signup, email, and GA4 status at launch time; prior checks and local tests are not proof of the current production state.
- Review and approve each post and any deployment. Nothing in this plan authorizes automated posting, unsolicited mass outreach, or production changes.
