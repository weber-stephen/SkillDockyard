import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const productPrefixes = ["/artifacts", "/submit", "/exports", "/getting-started", "/settings"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (productPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    const url = request.nextUrl.clone(); url.pathname = `/app${pathname}`;
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(request.headers);
  if (pathname === "/demo" || pathname.startsWith("/demo/")) requestHeaders.set("x-skill-dockyard-mode", "demo");
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => items.forEach(({ name, value, options }) => { request.cookies.set(name, value); response.cookies.set(name, value, options); })
    }
  });
  await supabase.auth.getClaims();
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
