"use client";

import { useState } from "react";
import { Check, CircleSlash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ReviewActions({ artifactId, versionId }: { artifactId: string; versionId: string }) {
  const [note, setNote] = useState("");
  const [reviewerName, setReviewerName] = useState("Local Reviewer");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(decision: "approved" | "deprecated") {
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artifactId,
        versionId,
        decision,
        note,
        reviewerName
      })
    });
    setPending(false);
    setMessage(response.ok ? "Decision recorded." : "Supabase is not configured yet. The UI is running in demo mode.");
  }

  return (
    <div className="space-y-3 rounded-md border border-border bg-panel p-4">
      <div>
        <h2 className="font-black">Reviewer Decision</h2>
        <p className="text-sm text-muted-foreground">Approval is tied to this exact content hash.</p>
      </div>
      <Input placeholder="Reviewer name" value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} />
      <Textarea placeholder="Add a reviewer note..." value={note} onChange={(event) => setNote(event.target.value)} />
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} onClick={() => submit("approved")}>
          <Check className="h-4 w-4" />
          Approve Version
        </Button>
        <Button disabled={pending} variant="outline" onClick={() => submit("deprecated")}>
          <CircleSlash className="h-4 w-4" />
          Deprecate
        </Button>
      </div>
      {message ? <p className="text-sm font-semibold text-muted-foreground">{message}</p> : null}
    </div>
  );
}
