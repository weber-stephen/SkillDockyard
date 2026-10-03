import { NextResponse } from "next/server";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export function GET() {
  const configured = hasSupabaseConfig()
    && Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    && Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const healthy = process.env.NODE_ENV !== "production" || configured;
  return NextResponse.json({ status: healthy ? "ok" : "configuration_required" }, {
    status: healthy ? 200 : 503,
    headers: { "Cache-Control": "no-store" }
  });
}
