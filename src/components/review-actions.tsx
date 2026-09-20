"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, MessageSquareWarning, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReviewActions({
  artifactId,
  versionId,
  canPublish,
  proposalId,
  proposalStatus = "pending_review"
}: {
  artifactId: string;
  versionId: string;
  canPublish: boolean;
  proposalId?: string | null;
  proposalStatus?: string;
}) {
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function submit(decision: "published" | "changes_requested" | "rejected") {
    if ((decision === "changes_requested" || decision === "rejected") && !note.trim()) {
      setMessage("Add a note before requesting changes or rejecting this proposal.");
      return;
    }
    setPending(true);
    setMessage(null);
    const legacyDecision = decision === "published" ? "approved" : "deprecated";
    const endpoint = proposalId ? `/api/proposals/${proposalId}/decision` : `/api/approvals${pathname.startsWith("/demo") ? "?demo=1" : ""}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proposalId ? {
        decision,
        note
      } : {
        artifactId,
        versionId,
        decision: legacyDecision,
        note,
        reviewerName: "Demo reviewer"
      })
    });
    setPending(false);
    if (!response.ok) {
      setMessage("We could not record that decision.");
      return;
    }

    if (decision === "published") {
      router.push(pathname.startsWith("/demo") ? "/demo/artifacts" : "/app/artifacts");
      router.refresh();
      return;
    }

    setMessage(decision === "changes_requested" ? "Changes requested. The published version remains active." : "Proposal rejected. The published version remains active.");
  }

  return (
    <div className="space-y-3 rounded-md border border-border bg-panel p-4">
      <div>
        <h2 className="font-black">Review and publish</h2>
        <p className="text-sm text-muted-foreground">
          This is the owner or reviewer step. Compare the change and trust notes, then publish only if teammates should receive this version.
        </p>
      </div>
      <Textarea placeholder={proposalId ? "Add a review note. Required for changes requested or rejection." : "Why is this safe and useful to share?"} value={note} onChange={(event) => setNote(event.target.value)} />
      {!canPublish ? (
        <p className="text-sm text-muted-foreground">
          You can review this proposed change, but only source workspace owners or reviewers can publish or archive it.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending || !canPublish || proposalStatus !== "pending_review"} onClick={() => submit("published")}>
          <Check className="h-4 w-4" />
          Publish update
        </Button>
        <Button disabled={pending || !canPublish || proposalStatus !== "pending_review"} variant="outline" onClick={() => submit("changes_requested")}>
          <MessageSquareWarning className="h-4 w-4" />
          Request changes
        </Button>
        <Button disabled={pending || !canPublish || proposalStatus !== "pending_review"} variant="destructive" onClick={() => submit("rejected")}>
          <X className="h-4 w-4" />
          Reject update
        </Button>
      </div>
      {message ? <p className="text-sm font-semibold text-muted-foreground">{message === "Publish decision recorded." ? "Published. Teammates can now download this version from the skill page." : message}</p> : null}
    </div>
  );
}
