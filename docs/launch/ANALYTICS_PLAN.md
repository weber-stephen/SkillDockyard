# Analytics plan

## Status

The application sends events only after explicit analytics consent through the existing GTM data layer. GA4 destination setup and production DebugView verification remain founder-owned.

| Event | Definition |
| --- | --- |
| `landing_page_view` | A consented homepage view. |
| `primary_cta_click` | Click on a create-account action. |
| `signup_started` | First consented signup form submission attempt in a browser session. |
| `signup_completed` | Email confirmation returned the user to `/app`; no account identifier is sent. |
| `onboarding_started` | A setup path is selected. |
| `onboarding_completed` | The first persisted skill is added/imported. |
| `first_value_achieved` | First persisted private or workspace skill, including starter skills. |
| `returning_user` | A consented browser returns after 24+ hours. |

## Metrics

- Signup conversion = completed signups / unique landing visitors.
- Activation = first-value users / completed signups.
- Time to first value = timestamp(first value) − timestamp(signup completed), interpreted only for consented users.
- Signup abandonment = signup starts without a same-browser completed confirmation; this is a proxy, not a user-level fact.

UTM values are allowlisted and events exclude identities, workspace IDs, skill content, tokens, raw URLs, and auth state. Consent, browser changes, cross-device confirmation, blockers, and GA4 ad blockers create undercounting. Use Supabase Auth operational counts alongside GA4 directional data; never merge identities.
