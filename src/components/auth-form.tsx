"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { ProductLink as Link } from "@/components/product-link";
import { TurnstileField } from "@/components/turnstile-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { trackAnalyticsEvent } from "@/lib/analytics";

export function AuthForm({ mode, nextPath, signupEnabled = true }: { mode: "login" | "signup"; nextPath: string; signupEnabled?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const signup = mode === "signup";
  const captchaRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) || process.env.NODE_ENV === "production";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (captchaRequired && !captchaToken) { setMessage("Complete the security check, then try again."); return; }
    setPending(true);
    setMessage(null);
    try {
      if (signup) {
        const response = await fetch("/api/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password, captchaToken, acceptedTerms: true, acceptedPrivacy: true }) });
        if (!response.ok) throw new Error("Signup failed");
        setMessage("Check your email to confirm your address. If an account already exists, use the sign-in or password reset options.");
      } else {
        const client = createBrowserSupabase();
      const { error } = await client.auth.signInWithPassword({ email, password, options: { captchaToken: captchaToken ?? undefined } });
      if (error) throw error;
      trackAnalyticsEvent("login_succeeded", { entry_point: "login" });
      router.push(nextPath as never);
        router.refresh();
      }
    } catch {
      setMessage(signup ? "We could not start your signup. Please try again later." : "We could not sign you in. Check your details and try again.");
      setCaptchaToken(null);
    } finally { setPending(false); }
  }

  if (signup && !signupEnabled) return <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-12"><section className="w-full rounded-md border border-border bg-panel p-6 shadow-sm"><BrandMark compact className="mb-8" /><h1 className="text-3xl font-black">Signups are paused</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">New account registration is temporarily unavailable. You can still sign in to an existing account.</p><p className="mt-6 text-sm text-muted-foreground"><Link className="font-bold text-primary underline underline-offset-4" href="/login">Log in</Link> or <Link className="font-bold text-primary underline underline-offset-4" href="/support">contact support</Link>.</p></section></main>;

  const title = signup ? "Create your account" : "Welcome back";
  const description = signup ? "Start using Skill Dockyard with your work team." : "Sign in to your Skill Dockyard workspace.";
  return <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-12"><section className="w-full rounded-md border border-border bg-panel p-6 shadow-sm"><BrandMark compact className="mb-8" /><h1 className="text-3xl font-black">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p><form className="mt-6 space-y-4" onSubmit={submit}><label className="grid gap-2 text-sm font-bold">Email<Input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="grid gap-2 text-sm font-bold">Password<Input type="password" autoComplete={signup ? "new-password" : "current-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{signup ? <><label className="flex gap-3 text-sm leading-6"><input type="checkbox" required className="mt-1 h-4 w-4" /> <span>I agree to the <Link className="font-bold text-primary underline underline-offset-4" href="/terms" target="_blank">Terms of service</Link>.</span></label><label className="flex gap-3 text-sm leading-6"><input type="checkbox" required className="mt-1 h-4 w-4" /> <span>I acknowledge the <Link className="font-bold text-primary underline underline-offset-4" href="/privacy" target="_blank">Privacy policy</Link>.</span></label></> : null}<TurnstileField onToken={setCaptchaToken} /><Button className="w-full" type="submit" disabled={pending || (captchaRequired && !captchaToken)}>{pending ? "Working..." : signup ? "Create account" : "Log in"}</Button></form>{message ? <p role="status" aria-live="polite" className="mt-4 rounded-md border border-border bg-background p-3 text-sm leading-6 text-muted-foreground">{message}</p> : null}{signup ? <p className="mt-6 text-sm text-muted-foreground">Already have an account? <Link className="font-bold text-primary underline underline-offset-4" href="/login">Log in</Link>.</p> : <><p className="mt-4 text-sm"><Link className="font-bold text-primary underline underline-offset-4" href="/forgot-password">Forgot password?</Link></p><p className="mt-6 text-sm text-muted-foreground">Need access? <Link className="font-bold text-primary underline underline-offset-4" href="/signup">Create an account</Link>.</p></>}</section></main>;
}
