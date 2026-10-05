"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Anchor } from "lucide-react";
import { ProductLink as Link } from "@/components/product-link";
import { TurnstileField } from "@/components/turnstile-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function AuthForm({ mode, nextPath }: { mode: "login" | "signup"; nextPath: string }) {
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
      const client = createBrowserSupabase();
      if (signup) {
        const origin = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
        const { error } = await client.auth.signUp({ email, password, options: { captchaToken: captchaToken ?? undefined, emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(nextPath)}` } });
        if (error) throw error;
        setMessage("Check your inbox for a confirmation link. We’ll continue after you confirm your email.");
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password, options: { captchaToken: captchaToken ?? undefined } });
        if (error) throw error;
        router.push(nextPath as never);
        router.refresh();
      }
    } catch {
      setMessage(signup ? "We could not create that account. Check your details and try again." : "We could not sign you in. Check your details and try again.");
      setCaptchaToken(null);
    } finally { setPending(false); }
  }

  return <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-12"><section className="w-full rounded-md border border-border bg-panel p-6 shadow-sm"><Link href="/" className="mb-8 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-white"><Anchor className="h-5 w-5" /></span><span className="text-lg font-black">Skill Dockyard</span></Link><h1 className="text-3xl font-black">{signup ? "Create your account" : "Welcome back"}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{signup ? "Use your work email to start a private skill collection. We’ll send a confirmation link before your workspace opens." : "Sign in to your Skill Dockyard workspace."}</p><form className="mt-6 space-y-4" onSubmit={submit}><label className="grid gap-2 text-sm font-bold">Email<Input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="grid gap-2 text-sm font-bold">Password<Input type="password" autoComplete={signup ? "new-password" : "current-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label><TurnstileField onToken={setCaptchaToken} /><Button className="w-full" type="submit" disabled={pending || (captchaRequired && !captchaToken)}>{pending ? "Working..." : signup ? "Create account" : "Log in"}</Button></form>{message ? <p role="status" aria-live="polite" className="mt-4 rounded-md border border-border bg-background p-3 text-sm leading-6 text-muted-foreground">{message}</p> : null}{!signup ? <p className="mt-4 text-sm"><Link className="font-bold text-primary underline underline-offset-4" href="/forgot-password">Forgot password?</Link></p> : null}<p className="mt-6 text-sm text-muted-foreground">{signup ? "Already have an account?" : "Need an account?"} <Link className="font-bold text-primary underline underline-offset-4" href={signup ? "/login" : "/signup"}>{signup ? "Log in" : "Sign up"}</Link></p></section></main>;
}
