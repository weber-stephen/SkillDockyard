"use client";

import { Turnstile } from "@marsidev/react-turnstile";

export function TurnstileField({ onToken }: { onToken: (token: string | null) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) {
    if (process.env.NODE_ENV === "production") return <p role="alert" className="text-sm text-destructive">Account protection is temporarily unavailable. Please try again later.</p>;
    return null;
  }
  return <Turnstile siteKey={siteKey} options={{ theme: "light", size: "flexible" }} onSuccess={(token) => onToken(token)} onExpire={() => onToken(null)} onError={() => onToken(null)} />;
}
