"use client";

import { useState } from "react";
import { ArrowRight, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PrivateDraftActions({ artifactId }: { artifactId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitForReview() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/artifacts/${artifactId}/submit-for-review`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "We could not submit this draft for review.");
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "We could not submit this draft for review.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-md border border-primary/30 bg-primary/5 p-5 text-sm leading-6">
      <div className="font-bold">Private draft</div>
      <p className="mt-1 text-muted-foreground">Only you can see this skill. Submit it for workspace review when it is ready to share.</p>
      {error ? <p className="mt-3 font-semibold text-destructive">{error}</p> : null}
      <Button className="mt-4" onClick={submitForReview} disabled={pending}>
        <Send className="h-4 w-4" />
        {pending ? "Submitting for review..." : "Submit for review"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
