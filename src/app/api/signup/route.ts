import { NextResponse } from "next/server";
import { z } from "zod";
import { actionRateLimit } from "@/lib/api-rate-limit";
import { recordCurrentLegalAcceptance } from "@/lib/legal-acceptance";
import { isSelfServiceSignupEnabled } from "@/lib/legal-documents";
import { fingerprintRateLimitKey } from "@/lib/rate-limit";
import { readJsonSchema } from "@/lib/request-body";
import { publicSiteOrigin } from "@/lib/safe-redirect";
import { createPublicSupabase } from "@/lib/public-supabase";
import { createServerSupabase } from "@/lib/supabase/server";

const signupSchema = z.object({
  email: z.email().max(320),
  password: z.string().min(8).max(256),
  captchaToken: z.string().min(1).max(4096).nullable(),
  acceptedTerms: z.literal(true),
  acceptedPrivacy: z.literal(true)
}).strict();

const GENERIC_RESPONSE = { ok: true, message: "Check your email to continue." };

export async function POST(request: Request) {
  if (!isSelfServiceSignupEnabled()) return NextResponse.json({ error: "New account registration is temporarily paused." }, { status: 503 });

  try {
    const body = await readJsonSchema(request, signupSchema, 8 * 1024);
    if (process.env.NODE_ENV === "production" && !body.captchaToken) return NextResponse.json({ error: "We could not start your signup. Please try again later." }, { status: 400 });
    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
    const rateKey = fingerprintRateLimitKey(`${body.email.trim().toLowerCase()}:${forwardedFor}`);
    const limited = await actionRateLimit("signup", rateKey, 5, 15 * 60_000);
    if (limited) return limited;

    const origin = publicSiteOrigin(new URL(request.url).origin);
    const { data, error } = await createPublicSupabase().auth.signUp({
      email: body.email.trim().toLowerCase(),
      password: body.password,
      options: { captchaToken: body.captchaToken ?? undefined, emailRedirectTo: `${origin}/auth/confirm?next=/app` }
    });
    if (error) return NextResponse.json({ error: "We could not start your signup. Please try again later." }, { status: 400 });

    // With confirmation enabled, an existing confirmed account is returned with
    // no identities. Never let an unauthenticated caller alter its acceptance record.
    if (data.user?.identities?.length) {
      try {
        await recordCurrentLegalAcceptance(data.user.id, "signup");
      } catch {
        await createServerSupabase().auth.admin.deleteUser(data.user.id, false);
        return NextResponse.json({ error: "We could not start your signup. Please try again later." }, { status: 500 });
      }
    }
    return NextResponse.json(GENERIC_RESPONSE, { status: 202 });
  } catch {
    return NextResponse.json({ error: "We could not start your signup. Please try again later." }, { status: 400 });
  }
}
