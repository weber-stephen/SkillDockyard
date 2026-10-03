import { NextResponse } from "next/server";
import { exchangeCliPairingCode } from "@/lib/cli-auth";
import { consumeRateLimit, RateLimitConfigurationError } from "@/lib/rate-limit";
import { readJsonBody, RequestBodyError } from "@/lib/request-body";

export async function POST(request: Request) {
  let limit;
  try {
    limit = await consumeRateLimit(`cli-pair:${request.headers.get("x-forwarded-for") ?? "unknown"}`, 10, 60_000);
  } catch (error) {
    if (error instanceof RateLimitConfigurationError) return NextResponse.json({ error: "This service is temporarily unavailable." }, { status: 503 });
    throw error;
  }
  if (!limit.allowed) return NextResponse.json({ error: "Too many pairing attempts. Try again later." }, { status: 429 });
  let body: { code?: unknown };
  try {
    body = await readJsonBody<{ code?: unknown }>(request, 1024);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request body must contain valid JSON." }, { status });
  }
  if (typeof body.code !== "string" || !/^[A-F0-9]{12}$/i.test(body.code.trim())) return NextResponse.json({ error: "Enter the 12-character pairing code." }, { status: 400 });
  const result = await exchangeCliPairingCode(body.code);
  return result ? NextResponse.json(result) : NextResponse.json({ error: "That pairing code is invalid, expired, or already used." }, { status: 401 });
}
