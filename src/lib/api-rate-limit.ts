import { NextResponse } from "next/server";
import { consumeRateLimit, recordRateLimitFailure, RateLimitConfigurationError } from "@/lib/rate-limit";

export async function actionRateLimit(scope: string, identity: string, limit = 10, windowMs = 60_000) {
  try {
    const result = await consumeRateLimit(`${scope}:${identity}`, limit, windowMs);
    if (result.allowed) return null;
    recordRateLimitFailure(scope);
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } });
  } catch (error) {
    if (error instanceof RateLimitConfigurationError) return NextResponse.json({ error: "This service is temporarily unavailable." }, { status: 503 });
    throw error;
  }
}
