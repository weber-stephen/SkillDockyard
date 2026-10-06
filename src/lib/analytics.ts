export type AnalyticsConsent = "granted" | "denied";

export type AnalyticsEventName =
  | "page_view"
  | "cta_clicked"
  | "login_succeeded"
  | "demo_entered"
  | "skill_submission_succeeded"
  | "review_decision_recorded"
  | "skill_download_started"
  | "pairing_code_created"
  | "connected_computer_revoked"
  | "workspace_invitation_created"
  | "workspace_invitation_revoked"
  | "skill_share_created"
  | "skill_share_revoked"
  | "skill_share_response"
  | "workspace_renamed"
  | "workspace_invitation_accepted";

type AnalyticsValue = string | number | boolean;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown> | unknown[]>;
  }
}

let analyticsEnabled = false;

export const analyticsConsentStorageKey = "skill-dockyard.analytics-consent.v1";

export function isValidGtmContainerId(value: string | undefined) {
  return Boolean(value && /^GTM-[A-Z0-9]+$/.test(value));
}

export function setAnalyticsEnabled(enabled: boolean) {
  analyticsEnabled = enabled;
}

export function trackAnalyticsEvent(name: AnalyticsEventName, parameters: Record<string, AnalyticsValue> = {}) {
  if (typeof window === "undefined" || !analyticsEnabled) return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: name, ...parameters });
}

export function routeCategory(pathname: string) {
  if (pathname === "/") return "landing";
  if (pathname === "/demo") return "demo_overview";
  if (pathname.startsWith("/demo/artifacts/")) return pathname.endsWith("/review") ? "demo_review" : pathname.endsWith("/update") ? "demo_skill_update" : "demo_skill_detail";
  if (pathname.startsWith("/demo/artifacts")) return "demo_skills";
  if (pathname.startsWith("/demo/submit")) return "demo_submission";
  if (pathname.startsWith("/demo/")) return "demo_app";
  if (pathname === "/app") return "app_overview";
  if (pathname.startsWith("/app/artifacts/")) return pathname.endsWith("/review") ? "app_review" : pathname.endsWith("/update") ? "app_skill_update" : "app_skill_detail";
  if (pathname.startsWith("/app/artifacts")) return "app_skills";
  if (pathname.startsWith("/app/submit")) return "app_submission";
  if (pathname.startsWith("/app/settings")) return "app_settings";
  if (pathname.startsWith("/app/")) return "app_workspace";
  if (pathname.startsWith("/invite/")) return "workspace_invitation";
  if (pathname === "/login") return "login";
  if (pathname === "/signup") return "signup";
  if (pathname === "/forgot-password") return "password_recovery";
  if (pathname === "/reset-password") return "password_reset";
  if (pathname === "/privacy") return "privacy";
  if (pathname === "/terms") return "terms";
  if (pathname === "/support") return "support";
  return "other";
}

const campaignKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export function campaignParameters(search: string) {
  const params = new URLSearchParams(search);
  return Object.fromEntries(campaignKeys.flatMap((key) => {
    const value = params.get(key)?.trim();
    // Campaign labels are controlled by marketers. Reject arbitrary query values,
    // including emails, spaces, and token-like payloads, before they enter GTM.
    return value && /^[A-Za-z0-9._~-]{1,100}$/.test(value) ? [[key, value]] : [];
  }));
}
