"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, CircleSlash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ReviewActions({
  artifactId,
  versionId,
  canPublish
}: {
  artifactId: string;
  versionId: string;
  canPublish: boolean;
}) {
  const [note, setNote] = useState("");
  const [reviewerName, setReviewerName] = useState("Local Publisher");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function submit(decision: "approved" | "deprecated") {
    setPending(true);
    setMessage(null);
    const response = await fetch(`/api/approvals${pathname.startsWith("/demo") ? "?demo=1" : ""}`, {
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
    if (!response.ok) {
      setMessage("We could not record that decision.");
      return;
    }

    if (decision === "approved") {
      router.push(pathname.startsWith("/demo") ? "/demo/artifacts" : "/app/artifacts");
      router.refresh();
      return;
    }

    setMessage(pathname.startsWith("/demo") ? "Demo archive decision recorded in this browser." : "Archive decision recorded.");
  }

  return (
    <div className="space-y-3 rounded-md border border-border bg-panel p-4">
      <div>
        <h2 className="font-black">Review and publish</h2>
        <p className="text-sm text-muted-foreground">
          This is the owner or reviewer step. Compare the change and trust notes, then publish only if teammates should receive this version.
        </p>
      </div>
      <Input placeholder="Your name (owner or reviewer)" value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} />
      <Textarea placeholder="Why is this safe and useful to share?" value={note} onChange={(event) => setNote(event.target.value)} />
      {!canPublish ? (
        <p className="text-sm text-muted-foreground">
          You can review this proposed change, but only source workspace owners or reviewers can publish or archive it.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending || !canPublish} onClick={() => submit("approved")}>
          <Check className="h-4 w-4" />
          Publish for the team
        </Button>
        <Button disabled={pending || !canPublish} variant="outline" onClick={() => submit("deprecated")}>
          <CircleSlash className="h-4 w-4" />
          Archive Skill
        </Button>
      </div>
      {message ? <p className="text-sm font-semibold text-muted-foreground">{message === "Publish decision recorded." ? "Published. Teammates can now download this version from the skill page." : message}</p> : null}
    </div>
  );
}
