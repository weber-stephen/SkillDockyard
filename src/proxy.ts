import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const productPrefixes = ["/artifacts", "/invites", "/submit", "/exports", "/getting-started", "/settings"];
const mutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function contentSecurityPolicy(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com https://www.googletagmanager.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.upstash.io https://*.sentry.io https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com",
    "frame-src https://challenges.cloudflare.com https://www.googletagmanager.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : [])
  ].join("; ");
}

function applySecurityHeaders(response: NextResponse, csp: string) {
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  if (process.env.NODE_ENV === "production") response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return response;
}

function isCrossOriginMutation(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/") || !mutatingMethods.has(request.method)) return false;
  if (!request.cookies.getAll().length) return false;
  if (request.headers.get("sec-fetch-site") === "cross-site") return true;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const allowed = new Set([request.nextUrl.origin]);
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try { allowed.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).origin); } catch { /* Invalid configuration fails to add an origin. */ }
  }
  return !allowed.has(origin);
}

export async function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce);
  const { pathname } = request.nextUrl;

  if (isCrossOriginMutation(request)) {
    return applySecurityHeaders(NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 }), csp);
  }

  if (productPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = `/app${pathname}`;
    return applySecurityHeaders(NextResponse.redirect(url, 308), csp);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  if (pathname === "/demo" || pathname.startsWith("/demo/")) requestHeaders.set("x-skill-dockyard-mode", "demo");
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  applySecurityHeaders(response, csp);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => items.forEach(({ name, value, options }) => {
        request.cookies.set(name, value);
        response.cookies.set(name, value, options);
      })
    }
  });
  await supabase.auth.getClaims();
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
