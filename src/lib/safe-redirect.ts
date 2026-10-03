export function safeLocalPath(value: string | null | undefined, fallback = "/app") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

export function publicSiteOrigin(fallbackOrigin: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured) return fallbackOrigin;
  try { return new URL(configured).origin; } catch { return fallbackOrigin; }
}
