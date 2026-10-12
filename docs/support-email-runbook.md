# Support email runbook

This runbook records the operating configuration for `support@skilldockyard.com`. It is an internal procedure, not a public support-level commitment. Do not store destination email addresses, SMTP credentials, API keys, verification messages, or customer mail in this repository.

## Current operating model

- **Primary owner:** Stephen.
- **Backup owner:** Stephen (solo-maintainer exception).
- **Security-incident escalation recipient:** Stephen.
- **Coverage limitation:** These roles are intentionally held by one person. This does not provide independent absence coverage; Stephen accepts that residual risk and must assign a separate backup before representing that coverage exists.
- **Monitoring cadence:** Review the support destination inbox each business day and use the existing incident runbook for suspected security or privacy issues.

## Incoming mail: Namecheap forwarding

Namecheap Free Email Forwarding accepts mail for `support@skilldockyard.com` and forwards it to Stephen's monitored inbox. It is a forwarding address, not a mailbox.

1. Keep the domain on Namecheap BasicDNS, PremiumDNS, or FreeDNS. The feature is unavailable when another provider hosts the authoritative DNS zone.
2. In **Domain List → Manage → Advanced DNS**, set **Mail Settings** to **Email Forwarding**. Namecheap creates the required inbound MX and SPF records.
3. In **Domain → Redirect Email**, create the `support` alias and forward it to the monitored destination inbox.
4. Test from an unrelated sender. Do not test from the destination inbox itself, because forwarding back to that same address may fail.

Namecheap forwarding controls inbound MX records. It must not be enabled alongside another inbound-mail provider for the same domain. Preserve Resend's DKIM/CNAME sending records. Keep exactly one SPF TXT record at each hostname; merge required includes into one record rather than publishing multiple `v=spf1` records.

## Outgoing mail: Gmail and Resend

The monitored Gmail account is configured to send as `support@skilldockyard.com` using Resend SMTP:

- Gmail: **Settings → See all settings → Accounts and Import → Send mail as → Add another email address**.
- Display name: `Skill Dockyard Support`.
- Address: `support@skilldockyard.com`; leave **Treat as an alias** enabled.
- SMTP host: `smtp.resend.com`.
- Port: `465` with SSL.
- Username: `resend`.
- Password: a dedicated Resend sending API key, stored only in the approved secret manager/account configuration.
- Confirm Gmail's verification email after Namecheap forwards it, set `support@skilldockyard.com` as the default From address, and choose **Reply from the same address the message was sent to**.

The sender domain must remain verified in Resend. If sending or delivery fails, first check Namecheap forwarding status, the Gmail send-as verification, Resend domain verification, and the single-SPF-record rule. Never paste a Resend API key into a support message, Git, or an incident record.

## Evidence and review

On October 11, 2026, Stephen confirmed that a message sent to `support@skilldockyard.com` was received through the forwarding path and that Gmail could send from the support address through Resend SMTP. Record any future tests and operational changes in the private support register. Recheck the receiving and sending paths quarterly and whenever DNS, Gmail, Namecheap, or Resend settings change.
