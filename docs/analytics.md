# Analytics operations

Skill Dockyard uses the optional Google Tag Manager container only after a visitor explicitly allows analytics. It sends no account, workspace, skill, invitation, connected-computer, token, or raw-URL data.

## Production configuration

1. In Vercel, set `NEXT_PUBLIC_GTM_CONTAINER_ID=GTM-KPDZ7DCL` for the **Production** environment only. Do not set it for Preview or Development.
2. In Google Tag Manager, configure a GA4 tag to fire from the consented `page_view` data-layer event. Disable automatic page-view measurement for that tag so SPA views are not duplicated.
3. Require `analytics_storage` consent for every Google Analytics tag. Keep `ad_storage`, `ad_user_data`, and `ad_personalization` denied.
4. Create GA4 events from the application’s data-layer event names. Treat `login_succeeded`, `demo_entered`, `skill_submission_succeeded`, `review_decision_recorded`, `skill_download_started`, and `pairing_code_created` as the initial funnel candidates; mark conversions only after product-owner review.

## Data contract

- `page_view` includes only a route category and safe UTM labels (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`). UTM values must match a restricted campaign-label format.
- Product events carry only fixed action values such as environment, submission kind, review decision, download target, operating system, invitation role, or share permission.
- Do not use GTM variables that export full URLs, DOM text, form values, user IDs, account IDs, workspace IDs, artifact IDs, or authentication state.

## Verification and rollback

Use GTM Preview and GA4 DebugView against the production deployment only after allowing analytics. Confirm one page view per client-side navigation and inspect every custom event payload before publishing the container. To stop collection immediately, remove `NEXT_PUBLIC_GTM_CONTAINER_ID` from Vercel Production and redeploy; existing visitors can also decline analytics from the Privacy page.
