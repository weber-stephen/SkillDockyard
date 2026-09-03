"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function InviteInbox({ invites }: { invites: Array<{ id: string; target_type: string; artifact_name: string; source_workspace_name: string }> }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function respond(id: string, action: "accept" | "decline") {
    setPendingId(id);
    setMessage(null);
    const response = await fetch(`/api/shares/${id}/${action}`, { method: "POST" });
    const payload = await response.json();
    setPendingId(null);
    if (!response.ok) {
      setMessage(payload.error ?? "We could not update that invite.");
      return;
    }
    router.refresh();
  }

  if (!invites.length) {
    return <section className="rounded-md border border-border bg-panel p-5 text-sm text-muted-foreground">No pending invites right now.</section>;
  }

  return (
    <section className="space-y-4">
      {invites.map((invite) => (
        <article key={invite.id} className="rounded-md border border-border bg-panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-black">{invite.artifact_name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {invite.target_type === "workspace"
                  ? `Workspace share from ${invite.source_workspace_name}.`
                  : `Individual share from ${invite.source_workspace_name}.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={pendingId === invite.id} onClick={() => void respond(invite.id, "accept")}>Accept</Button>
              <Button disabled={pendingId === invite.id} variant="outline" onClick={() => void respond(invite.id, "decline")}>Decline</Button>
            </div>
          </div>
        </article>
      ))}
      {message ? <p className="text-sm font-semibold text-destructive">{message}</p> : null}
    </section>
  );
}
