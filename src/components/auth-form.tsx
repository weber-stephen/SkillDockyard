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

  if (signup) {
    return <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-12"><section className="w-full rounded-md border border-border bg-panel p-6 shadow-sm"><Link href="/" className="mb-8 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-white"><Anchor className="h-5 w-5" /></span><span className="text-lg font-black">Skill Dockyard</span></Link><h1 className="text-3xl font-black">Pilot access is by invitation</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Skill Dockyard is currently a closed pilot. If you received an invitation, use the link in that email to finish setting up your account.</p><p className="mt-6 text-sm text-muted-foreground">Already have an account? <Link className="font-bold text-primary underline underline-offset-4" href="/login">Log in</Link>.</p><p className="mt-4 text-sm text-muted-foreground">Need help with an invitation? <Link className="font-bold text-primary underline underline-offset-4" href="/support">Contact support</Link>.</p></section></main>;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (captchaRequired && !captchaToken) { setMessage("Complete the security check, then try again."); return; }
    setPending(true);
    setMessage(null);
    try {
      const client = createBrowserSupabase();
      const { error } = await client.auth.signInWithPassword({ email, password, options: { captchaToken: captchaToken ?? undefined } });
      if (error) throw error;
      router.push(nextPath as never);
      router.refresh();
    } catch {
      setMessage("We could not sign you in. Check your details and try again.");
      setCaptchaToken(null);
    } finally { setPending(false); }
  }

  return <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-12"><section className="w-full rounded-md border border-border bg-panel p-6 shadow-sm"><Link href="/" className="mb-8 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-white"><Anchor className="h-5 w-5" /></span><span className="text-lg font-black">Skill Dockyard</span></Link><h1 className="text-3xl font-black">Welcome back</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Sign in to your Skill Dockyard workspace.</p><form className="mt-6 space-y-4" onSubmit={submit}><label className="grid gap-2 text-sm font-bold">Email<Input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="grid gap-2 text-sm font-bold">Password<Input type="password" autoComplete="current-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label><TurnstileField onToken={setCaptchaToken} /><Button className="w-full" type="submit" disabled={pending || (captchaRequired && !captchaToken)}>{pending ? "Working..." : "Log in"}</Button></form>{message ? <p role="status" aria-live="polite" className="mt-4 rounded-md border border-border bg-background p-3 text-sm leading-6 text-muted-foreground">{message}</p> : null}<p className="mt-4 text-sm"><Link className="font-bold text-primary underline underline-offset-4" href="/forgot-password">Forgot password?</Link></p><p className="mt-6 text-sm text-muted-foreground">Need access? <Link className="font-bold text-primary underline underline-offset-4" href="/signup">Pilot access is by invitation</Link>.</p></section></main>;
}
