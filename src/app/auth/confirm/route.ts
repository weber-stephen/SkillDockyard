import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { publicSiteOrigin, safeLocalPath } from "@/lib/safe-redirect";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const safeNext = safeLocalPath(url.searchParams.get("next"));
  const origin = publicSiteOrigin(url.origin);
  const response = NextResponse.redirect(new URL(safeNext, origin));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !key || !tokenHash || !type) return NextResponse.redirect(new URL("/login?error=confirmation", origin));
  const supabase = createServerClient(supabaseUrl, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => items.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
    }
  });
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  return error ? NextResponse.redirect(new URL("/login?error=confirmation", origin)) : response;
}
