"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductLink as Link } from "@/components/product-link";
import { Button } from "@/components/ui/button";

export function LegalAcceptanceForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acceptedTerms || !acceptedPrivacy) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/legal-acceptance", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ acceptedTerms, acceptedPrivacy }) });
      if (!response.ok) throw new Error("Acceptance failed");
      router.push(nextPath as never);
      router.refresh();
    } catch {
      setMessage("We could not save your acknowledgement. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-12"><section className="w-full rounded-md border border-border bg-panel p-6 shadow-sm"><h1 className="text-3xl font-black">Review the updated documents</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Before you continue, please acknowledge the current Terms of service and Privacy policy.</p><form className="mt-6 space-y-4" onSubmit={submit}><label className="flex gap-3 text-sm leading-6"><input type="checkbox" className="mt-1 h-4 w-4" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} /> <span>I agree to the <Link className="font-bold text-primary underline underline-offset-4" href="/terms" target="_blank">Terms of service</Link>.</span></label><label className="flex gap-3 text-sm leading-6"><input type="checkbox" className="mt-1 h-4 w-4" checked={acceptedPrivacy} onChange={(event) => setAcceptedPrivacy(event.target.checked)} /> <span>I acknowledge the <Link className="font-bold text-primary underline underline-offset-4" href="/privacy" target="_blank">Privacy policy</Link>.</span></label><Button className="w-full" type="submit" disabled={pending || !acceptedTerms || !acceptedPrivacy}>{pending ? "Saving..." : "Continue to Skill Dockyard"}</Button></form>{message ? <p role="status" aria-live="polite" className="mt-4 rounded-md border border-border bg-background p-3 text-sm leading-6 text-muted-foreground">{message}</p> : null}</section></main>;
}
