"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { ProductLink as Link } from "@/components/product-link";
import { TurnstileField } from "@/components/turnstile-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserSupabase } from "@/lib/supabase/browser";

function Shell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-12"><section className="w-full rounded-md border border-border bg-panel p-6 shadow-sm"><BrandMark compact className="mb-8" /><h1 className="text-3xl font-black">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>{children}</section></main>;
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const captchaRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) || process.env.NODE_ENV === "production";
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (captchaRequired && !captchaToken) return;
    setPending(true);
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    await createBrowserSupabase().auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent("/reset-password")}`, captchaToken: captchaToken ?? undefined });
    setSent(true);
    setPending(false);
  }
  return <Shell title="Reset your password" description="Enter your email and we’ll send a reset link if it matches an account.">{sent ? <div role="status" className="mt-6 rounded-md border border-border bg-background p-4 text-sm leading-6">If an account matches that email, a password reset link is on its way. You can close this page.</div> : <form className="mt-6 space-y-4" onSubmit={submit}><label className="grid gap-2 text-sm font-bold">Email<Input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><TurnstileField onToken={setCaptchaToken} /><Button className="w-full" type="submit" disabled={pending || (captchaRequired && !captchaToken)}>{pending ? "Sending..." : "Send reset link"}</Button></form>}<p className="mt-6 text-sm"><Link className="font-bold text-primary underline underline-offset-4" href="/login">Back to login</Link></p></Shell>;
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) { setMessage("Passwords do not match."); return; }
    setPending(true); setMessage(null);
    const { error } = await createBrowserSupabase().auth.updateUser({ password });
    if (error) { setMessage("This reset link is invalid or expired. Request a new link and try again."); setPending(false); return; }
    router.push("/app" as never); router.refresh();
  }
  return <Shell title="Choose a new password" description="Use at least eight characters and do not reuse a password from another service."><form className="mt-6 space-y-4" onSubmit={submit}><label className="grid gap-2 text-sm font-bold">New password<Input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label><label className="grid gap-2 text-sm font-bold">Confirm new password<Input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label><Button className="w-full" type="submit" disabled={pending}>{pending ? "Saving..." : "Save new password"}</Button></form>{message ? <p role="alert" className="mt-4 rounded-md border border-border bg-background p-3 text-sm">{message}</p> : null}</Shell>;
}
