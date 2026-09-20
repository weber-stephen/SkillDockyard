import { NextResponse } from "next/server";
import { exchangeCliPairingCode } from "@/lib/cli-auth";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limit = consumeRateLimit(`cli-pair:${request.headers.get("x-forwarded-for") ?? "unknown"}`, 10, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many pairing attempts. Try again later." }, { status: 429 });
  const body = await request.json().catch(() => ({})) as { code?: unknown };
  if (typeof body.code !== "string" || !/^[A-F0-9]{12}$/i.test(body.code.trim())) return NextResponse.json({ error: "Enter the 12-character pairing code." }, { status: 400 });
  const result = await exchangeCliPairingCode(body.code);
  return result ? NextResponse.json(result) : NextResponse.json({ error: "That pairing code is invalid, expired, or already used." }, { status: 401 });
}
