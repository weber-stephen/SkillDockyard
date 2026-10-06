export const CURRENT_TERMS_VERSION = "October 6, 2026";
export const CURRENT_PRIVACY_VERSION = "October 6, 2026";

export const CURRENT_LEGAL_DOCUMENTS = {
  termsVersion: CURRENT_TERMS_VERSION,
  privacyVersion: CURRENT_PRIVACY_VERSION
} as const;

export function isSelfServiceSignupEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.SELF_SERVICE_SIGNUP_ENABLED === "true";
}
