# Skill Dockyard: zero-budget marketing and soft-launch plan

**Status:** Proposed; no posting, outreach, submission, deployment, or production configuration is authorized by this document. The founder must approve each external action. This is the current master plan; [the earlier Reddit-led plan](REDDIT_LED_LAUNCH_PLAN.md) contains supporting detail but its schedule is superseded where it conflicts.

**Constraints:** $0 marketing budget; approximately 30–60 founder minutes per day; no paid placement, purchased traffic, fake social proof, automated outreach, spam, or public posting without approval. Do not use LinkedIn: the founder's profile is attached to their employment. Other public accounts may still reveal the founder's identity; check comfort and account requirements before acting. Do not misrepresent identity or affiliation.

**Goal:** Learn whether people will adopt a shared AI-skills workspace and establish repeatable acquisition. The target of 100 qualified free signups in 30 days is aspirational, not a forecast. No acquisition baseline currently supports a signup projection.

## 1. Product, audience, and promise

**Product:** Skill Dockyard gives teams a place to add or import AI skills, review changes, publish a version, and help teammates install and update skills for Codex and Claude Code. A private draft stays private; an update is not published automatically. The public campaign demo illustrates a review workflow, not a guarantee of campaign outcomes. See [product analysis](PRODUCT_ANALYSIS.md) and [brand strategy](../brand-strategy.md).

**Primary audience — hypothesis:** A marketing lead in a 2–10-person team already using Codex or Claude Code for repeatable campaign work. Their problem is that a useful workflow lives in one person's chat or local files and teammates don't know which version to use. The Campaign Brief Builder is the first example.

**Secondary audience — discovery and potential champion:** A technical skill author or AI-enablement/team administrator sharing skills across coworkers. They may be easier to reach in Codex and Claude communities; their interest does not establish marketing-team demand. A Git repository or shared folder can be sufficient for some teams.

**Campaign promise:** Keep your team's AI skills reviewed, current, and ready to use.

| Audience | Message to test | Demonstrable proof | Intended action |
| --- | --- | --- | --- |
| Marketing lead | Turn a repeatable campaign brief into an AI skill your team can reuse. | Public Campaign Brief Builder and its review example | Explore the demo; create a free beta account if relevant |
| Skill author / administrator | Compare a teammate's proposed skill update before publishing the version others can use. | Submitted-versus-published comparison and explicit publish step | Explore the demo; add or import a skill |
| Interested early user | Start with a private draft or editable example and bring in teammates when ready. | Existing first-skill paths | Add or import a first skill, then tell us what happened |

Use plain language, state that the product is free **during beta**, disclose founder affiliation, and describe only capabilities actually verified. Do not promise better campaigns, automatic synchronization, security certification, or integrations beyond the product's supported functionality.

## 2. Funnel and success measures

Track the steps separately; avoid presenting a lightweight proxy as demonstrated value:

1. **Discovery:** consented visits to the homepage, campaign page, and demo where data is available; useful conversations and rules-compliant posts recorded manually.
2. **Signup:** verified account completion. Operational aggregate signup counts and consented analytics are separate populations.
3. **First-skill proxy:** a user adds or imports a first skill, including an example. This is the intended `first_value_achieved` event definition, not proof of real use or a reliably deduplicated user count: consent, sessions, concurrency, and confirmation paths can affect reporting.
4. **Demonstrated value:** voluntary evidence that someone edited or used a skill in real work, or completed a meaningful compare-and-publish workflow. Record role and team context only if voluntarily shared; there is no dedicated reliable event for this milestone.
5. **Return and referral:** a consented browser returning after 24+ hours is a coarse proxy, not proof the same activated person returned. Ask interested users voluntarily whether they would share the workflow; no automated messaging.

**Definitions:**

- Signup conversion = completed signups / unique landing-page visitors, only when numerator and denominator are a matched, same-period consented cohort. The current `landing_page_view` covers the homepage—not direct demo or campaign-page visits—so it cannot be used as the denominator for those routes.
- Activation rate = first-skill users / completed signups, only if matched consented cohorts and identities or an appropriate aggregation method actually permit it. Existing events alone may not support a reliable user-level or cross-device calculation; otherwise report separate counts, not a fabricated rate.
- Signup abandonment is a directional comparison of consented starts and completions, not a count of identified people who abandoned. Time to first value and returning activated users require valid matching that is not currently established; report as unavailable or use voluntary observations.
- Record channel, post date, target segment, rule check, meaningful replies, observed aggregate visits, voluntary feedback, and confirmed first-skill/demonstrated-value counts where defensible. Record source as **unknown** when unavailable. Never join personal identities to analytics or collect sensitive skill content.

Consent refusal, blockers, browsers, cross-device email confirmation, and platforms that prohibit tracking parameters cause gaps. Use direct clean links when required. [Analytics plan](ANALYTICS_PLAN.md) has implementation details.

**Measurement blocker:** The repository's documented signup-confirmation template uses `type=email`, but the route adds the `signup_completed` marker only for `type=signup` ([README](../../README.md), [route](../../src/app/auth/confirm/route.ts)). If production follows that template, completions may be missed. The actual deployed template and event flow remain unverified. Validate in a test journey and resolve via a separately reviewed change before using this event for conversion decisions; do not alter authentication or production configuration without approval.

## 3. Channel strategy

Priorities below are hypotheses about qualified interest, not forecasts. Recheck community rules, access, cost, eligibility, and posting format immediately before acting. A public description or an accepted old post is not blanket permission to promote.

| Priority / place | Audience and next action | Cost / rules / limitations | Experiment and success signal |
| --- | --- | --- | --- |
| **1. [r/claudeskills](https://www.reddit.com/r/claudeskills/)** | Technical skill authors and some marketing-skill users. Read recent team-sharing discussions; prepare a founder-disclosed showcase tailored to the actual skill-review flow. | Public rules require topical, substantive posts and flair and prohibit spam/cross-posting the same thing across many subs. Verify whether a product showcase/link is allowed; ask moderators or skip if unclear. | One approved, compliant post; meaningful problem-specific replies and first-skill users, not upvotes. |
| **2. [Profound Community](https://www.tryprofound.com/community)** | Marketing professionals exploring AI workflows; request free community access only if the founder is comfortable. Participate in relevant discussions. | The operator says joining is free and available to marketing professionals; access is request-based. Promotion rules, actual activity, and eligibility for this founder are unverified. No product link or unsolicited DMs without permission. | One useful, non-promotional contribution; learn whether small marketing teams use agent skills and how they share them. |
| **3. [r/codex](https://www.reddit.com/r/codex/)** | Codex users and potential team administrators. Use the current showcase thread if its rules fit, with an actual Codex workflow. | The [Oct. 13 showcase](https://www.reddit.com/r/codex/comments/1x52817/show_us_all_what_youve_been_building_with_codex/) invited things built with Codex. Check the current thread and accurately describe build involvement; no assumptions about current eligibility. | One approved, distinct comment; feedback about import, comparison, publishing, and team use. |
| **4. [r/ClaudeCode](https://www.reddit.com/r/ClaudeCode/)** | Claude Code users. Consider the current weekly showcase, not a generic launch blast. | Rules observed direct simple project sharing to the showcase; standalone build posts need detail about Claude Code's role and lessons. Use only if actual founder/build history satisfies current requirements. | Conditional post; learn whether the flow matches Claude Code team practice. |
| **5. [Marketingstuffs Community](https://www.marketingstuffs.site/community)** | Marketers and agencies using AI. Alternate or complement to Profound if available. | A prior public page described free access and limited self-promotion to `#show-and-tell`; the page timed out during this review, so current access, activity, and rules are **unverified**. Check after requesting access; no unsolicited messages. | If current rules permit and founder approves, one useful demonstration in the specified channel; otherwise contribute without promotion or skip. |
| **6. [r/ClaudeCode Discord](https://discord.com/servers/rclaudecode-1530578814713856011)** | Claude Code builders discussing projects and workflows. | Public listing describes the community, but internal rules, permitted channels, free access details, and activity are not verified. Do not post links until checked and permitted. | One relevant, helpful conversation; track actual feedback, not member counts. |
| **7. [Show HN](https://news.ycombinator.com/showhn.html)** | Technical early adopters and potential team champions. | Submit something people can try, ideally without signup; do not submit a landing page as the Show HN. Verify the interactive demo offers a meaningful workflow, current account eligibility, and time to answer. No coordinated requests for votes or comments. | Conditional later test with direct demo and technical explanation; measure relevant replies and defensible activation signals. |
| **8. [Product Hunt](https://help.producthunt.com/en/articles/479557-how-to-post-a-product)** | Broad early adopters and makers; potentially weaker initial segment fit. | [Standard launches are free](https://help.producthunt.com/en/articles/7950405-ad-campaigns). Requires a personal account and onboarding; verify identity comfort, previous listing/relaunch eligibility, and current rules. No paid promotion. | Prepare a truthful listing after early feedback; submit only with separate approval and sufficient reply time. |
| **9. [Agent-skill directory](https://github.com/JackyST0/awesome-agent-skills/blob/main/CONTRIBUTING.md)** | People actively looking for skills or managers. | Example list calls for a public entry, generally 64+ GitHub stars, and bilingual README content; commercial and externally processing services may face additional scrutiny. Exceptions are at maintainer discretion. Eligibility, licensing, and repository visibility are unverified; this is not permission to submit. | Only if a useful, appropriately licensed public skill or eligible product resource exists; evaluate directory fit and disclose ownership before an approved PR. |
| **10. Owned search resource** | People looking for practical skill-sharing guidance. | Write one useful, accurate tutorial or checklist, not a batch of keyword pages. Requires founder approval to publish or deploy; search demand is unverified. | Explain a concrete share/review workflow and fair alternatives; measure qualified inquiries over several weeks. |

The [OpenAI Developer Community](https://community.openai.com/guidelines) is for helpful, relevant participation, not pitch spam. Don't use it as a launch-post channel without confirmed category rules and permission. Indie Hackers may be useful for founder feedback, but current rules and access were not verified in this research; do not count it as a tested channel.

**Initial channel mix:** r/claudeskills, one accessible marketing + AI Slack community, and r/codex. If one is unavailable or disallows sharing, use its time for useful permitted participation or one willing feedback conversation. Show HN and other outlets are optional later tests—not additional daily obligations.

## 4. Thirty-day sequence

Day numbers are relative to an approved start, not a promise to publish on a date. Founder effort stays around 30–60 minutes/day, including outreach and replies; implementation and debugging by Codex are separate. Aim for 3–5 voluntary conversations with relevant marketing users early, without delaying the other tests if contacts are unavailable. Confirm whether they actually use Codex or Claude Code and share skills with coworkers; analytics alone cannot establish their role or team context. Public posts, messages, directory PRs, provider configuration, previews, and deployments require explicit approval. Replies require founder judgment and community compliance.

| Day | Owner | Action | Time | Output / directional metric | Dependency |
| --- | --- | --- | ---: | --- | --- |
| 1 | Founder + Codex | Review branch and local changes; decide whether to approve push, PR, and preview. | 30–45m | Review notes and explicit decision | Founder approval; no production release assumed |
| 2 | Founder | Review preview on desktop/mobile and test the demo and signup; record confusion. | 45–60m | Issues list | Preview available |
| 3 | Founder | Verify email confirmation, first-skill journey, consent, and analytics; investigate the known completion-event mismatch. Decide production go/no-go separately. | 45–60m | Tested journey and measurement status | Test account; provider access; deployment approval if needed |
| 4 | Founder | Check r/claudeskills rules and recent conversations; if approved, invite a personally appropriate marketing contact to a voluntary feedback conversation. | 30–45m | Notes on real problems; one invitation if appropriate | Account, current rules, outreach approval |
| 5 | Founder | If allowed and approved, publish a tailored r/claudeskills showcase; otherwise ask moderators or defer. | 45m | One compliant post or documented reason to skip | Approved production demo and post |
| 6 | Founder | Answer comments and, if available and approved, hold a short voluntary marketing-user conversation. | 30–60m | Feedback log, including actual tools and team context | Day 5 post or willing contact |
| 7 | Founder + Codex | Review journey and feedback; prioritize one real friction point. Hold another voluntary conversation if available. | 30–60m | Ranked issue or explicit no-data finding | Early observations |
| 8 | Founder | Request access to one marketing + AI community if comfortable; inspect its current rules on admission. | 30m | Access/rules status, not a sales pitch | Founder approval; community eligibility |
| 9 | Founder | Participate in a relevant marketing workflow conversation; no link unless allowed and approved. | 30m | One learning conversation or documented access delay | Community access |
| 10 | Founder | Check current r/codex showcase and prepare a distinct post grounded in actual Codex use. | 30m | Eligible draft or skip decision | Current rules and truthful build history |
| 11 | Founder | If approved and eligible, share once in the current Codex showcase; respond to questions. | 45m | Relevant questions and observations | Deployed demo; permitted thread |
| 12 | Founder + Codex | Inspect aggregate results and feedback; fix one confirmed friction point if safe. | 30–60m | Testable improvement or no-change decision | Evidence; review/deployment approval |
| 13 | Founder | Follow up only with people who voluntarily requested it; invite feedback from a few personally appropriate marketing-team contacts if comfortable and approved. | 30m | Interviews or explicit unresolved ICP question | Consent and founder approval |
| 14 | Founder | Compare the three initial tests using the weekly evidence rubric below; decide continue/iterate/stop or inconclusive, and whether to prepare Show HN. | 45m | Written channel and audience decision | Observations, not invented data |
| 15–17 | Codex + Founder | Address the biggest verified obstacle; prepare a concise technical demo explanation. | 30–60m/day | Improved journey; no false feature claims | Test evidence; approved release path |
| 18–20 | Founder | If the demo is meaningfully interactive, account is eligible, and reply time is available, consider an approved Show HN; otherwise defer. | 45–60m on launch day plus follow-up | Relevant questions; no promised traffic | HN rules and approval |
| 21–23 | Founder + Codex | Create one helpful skill-sharing tutorial or checklist based on actual user questions; obtain approval before public release. | 30–60m/day | Useful draft and review | Verified product behavior |
| 24–26 | Founder | Assess Product Hunt or a skill directory against its current rules, identity/privacy, eligibility, and observed audience fit; draft only. | 30–45m/day | Go/no-go; no submission assumed | Founder preference; listing requirements |
| 27–30 | Founder + Codex | Review signups, first-skill proxy, demonstrated use, actual channel evidence, and segment mix. Choose one next experiment. | 30–45m/day | Learning summary; continue/iterate/stop decision | Available data and voluntary feedback |

**Show HN preflight:** Test the exact deployed demo anonymously on desktop and mobile. Confirm that a visitor can interact meaningfully, that example state resets or behaves as described, and that signup, confirmation, support, and privacy links work. Check account and community rules and reserve time for replies on launch day and the following day. Defer if any prerequisite fails.

## 5. Ready-to-review drafts

All drafts are unpublished. Insert only a verified live demo URL and use the correct current format. No tracking link where prohibited. Disclose that you built the product; do not invent product history or customer outcomes.

### r/claudeskills showcase

**Title:** I built a way to review shared Claude Code skills—looking for feedback

I built Skill Dockyard to explore what happens when several people improve the same AI skill: one person makes a useful change, but teammates may still have an older copy, or an unfinished change is shared too soon.

Git or a shared folder may be enough for some teams. Skill Dockyard offers another approach: add or import a skill, submit an update, compare it with the published version, and have a reviewer decide whether to publish. The free-beta demo uses a campaign-brief skill and can be explored without an account: [verified demo URL, only if permitted].

How does your team handle shared skills today, and where does that approach get awkward?

### Marketing + AI community contribution

**No-link discussion, subject to community rules:**

I built Skill Dockyard and I'm researching how marketing teams share AI workflows. When a team finds a better way to brief an AI assistant, how does everyone else get the improvement? I'm interested in the practical handoff: shared document, saved instructions, an AI skill, or something else. What happens when two people want to change it?

If a permitted showcase channel explicitly allows product sharing, disclose founder affiliation and show the real campaign-brief review example. Don't disguise a pitch as a neutral recommendation or solicit DMs.

### r/codex showcase

I built Skill Dockyard, a free beta for teams that want to share and review Codex skills. A teammate can import or add a skill, submit a change, and a reviewer can compare it with the published version before publishing. The demo uses a campaign-brief workflow: [verified demo URL if allowed].

**Before posting:** add a truthful, concrete sentence describing how Codex was used in building or improving the product, if required by the current showcase. Ask: “How do you keep shared Codex skills current across a team today?”

### Show HN

**Title:** Show HN: Skill Dockyard — review and share AI skills across a team

**Link:** Verified interactive demo, not signup or landing page.

**Founder comment:** I built Skill Dockyard to explore how teams can improve a shared AI skill without silently changing the version everyone relies on. The demo shows a campaign-brief skill and its submitted-versus-published comparison. It is free during beta. Git and shared folders may already work well for many teams; I'm interested in where those approaches become difficult and whether the review flow is useful. [Add a factual build detail and known limitation.]

Confirm that the demo meets current HN guidelines, the account may submit, and the founder can engage. HN says removing signup barriers is ideal, not an unconditional rule; do not call a static-only page interactive.

### Product Hunt listing preparation — not a submission

- **Name:** Skill Dockyard.
- **Tagline:** Review and share AI skills across your team.
- **Description:** A shared workspace to add, review, and publish reusable AI skills, and help teammates check for and install updates in Codex and Claude Code. Free during beta.
- **Assets:** Existing logo; real screenshots of comparison and publishing; short accurate demo; privacy/terms/support links. Verify pricing and all claims at launch time.
- **Decision:** Only after early feedback, identity/eligibility review, and explicit approval. No fabricated adoption, rankings, testimonials, or claims of endorsement.

## 6. Experiments and decisions

| Experiment | Hypothesis / audience | Minimum observation | Directional success threshold | Decision rule |
| --- | --- | --- | --- | --- |
| Skill-sharing showcase | Skill authors have a real pain reviewing shared updates. | Seven days after one compliant post | At least 3 relevant replies and 1 voluntary demo/first-skill report; small numbers are directional, not significance. | Continue if problem and use are real; iterate if confusion dominates; consider reframe only if several relevant people substantively reject the problem. |
| Marketing-community conversation | Marketing teams using AI have a handoff problem worth solving with skills. | Two weeks, subject to access | At least 2 substantive conversations with people in the intended segment; no signup assumption. | Continue if the problem recurs; otherwise leave ICP unvalidated or reframe. |
| Codex showcase | Codex skill authors need team version review. | Seven days after an eligible post | At least 3 relevant replies or 1 volunteered first-skill use report. | Compare quality with the other channels; iterate or stop if interest is unrelated to teams. |
| First-skill onboarding | Users can reach a useful skill without help. | First 5 willing test users or 14 days, whichever is later | At least 3 independently add/import a skill and 2 report a real use or meaningful review; record obstacles. | Improve the observed blocker; don't infer significance from five people. |

If access is refused, a moderator rejects a post, exposure is low, nobody replies, or instrumentation is incomplete, record the outcome as **inconclusive**, not evidence of absent demand. Estimate future signup scenarios only from observed qualified signups per channel-week and state sample size and assumptions.

**Weekly evidence rubric:** Record (1) how many conversations were actually with the target segment, (2) whether a recurring problem was urgent, (3) evidence of real use rather than a starter install, (4) observed onboarding friction, and (5) whether a channel can be used within its rules. For each, note supporting and contradicting observations and sample size. If evidence is missing, mark the question open; don't infer a verdict from silence.

## 7. Launch checklist and approvals

- [ ] Founder reviews the branch and separately approves any push, preview, production deployment, provider configuration, public post, outreach, or directory submission.
- [ ] Verify the live no-signup demo's meaningful interactions and state reset, mobile behavior, signup, email confirmation, first skill, support contact, privacy/terms, and consent behavior.
- [ ] Investigate the `type=email` / `type=signup` completion-event mismatch and validate events in a real test; treat attribution and cohort matching as limited.
- [ ] Recheck each community's current rules, account requirements, permitted channel, and clean-link policy. Skip when uncertain or obtain moderator guidance.
- [ ] Verify every quoted capability and founder/build claim. No LinkedIn, paid promotion, unapproved DMs, or pressure for votes.
- [ ] Review individual post drafts and schedule adequate time to reply. Report actual outcomes separately from hypotheses.

## Sources and verification notes

- [Profound community](https://www.tryprofound.com/community): operator says free, request-to-join, for marketing professionals; promotion rules not verified.
- [Marketingstuffs community](https://www.marketingstuffs.site/community): prior indexed page described free access and `#show-and-tell` promotion; page timed out on recheck, so treat all details as unverified until accessed.
- [Claude Code Discord listing](https://discord.com/servers/rclaudecode-1530578814713856011): public description only; internal rules/access unverified.
- [Product Hunt free launch](https://help.producthunt.com/en/articles/7950405-ad-campaigns), [posting requirements](https://help.producthunt.com/en/articles/479557-how-to-post-a-product), and [relaunch policy](https://help.producthunt.com/en/articles/484934-can-i-relaunch-my-product): free standard launch and personal-account requirement; individual eligibility unverified.
- [Agent-skills contribution criteria](https://github.com/JackyST0/awesome-agent-skills/blob/main/CONTRIBUTING.md): public-repository and typical star requirements; eligibility unverified.
- [Show HN](https://news.ycombinator.com/showhn.html), [r/claudeskills](https://www.reddit.com/r/claudeskills/), [r/codex](https://www.reddit.com/r/codex/), and [r/ClaudeCode](https://www.reddit.com/r/ClaudeCode/): rules and threads can change; review on the day. Research last checked October 17, 2026.
