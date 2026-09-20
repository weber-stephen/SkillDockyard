"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { WorkspaceInvite } from "@/lib/types";
export function WorkspaceInviteInbox({ invites }: { invites: WorkspaceInvite[] }) {
  const router = useRouter(); const [pending, setPending] = useState<string | null>(null); const [message, setMessage] = useState<string | null>(null);
  async function respond(id: string, action: "accept" | "decline") { setPending(id); setMessage(null); const response = await fetch(`/api/workspace-invites/${id}/${action}`, { method: "POST" }); const payload = await response.json(); setPending(null); if (!response.ok) { setMessage(payload.error ?? "We could not update that invitation."); return; } router.refresh(); }
  if (!invites.length) return null;
  return <section className="space-y-4"><h2 className="text-xl font-black">Workspace invitations</h2>{invites.map((invite) => <article key={invite.id} className="rounded-md border border-border bg-panel p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="text-lg font-black">{invite.workspace_name ?? "Workspace"}</h3><p className="mt-1 text-sm text-muted-foreground">Join as {invite.role}. Expires {new Date(invite.expires_at).toLocaleDateString()}.</p></div><div className="flex gap-2"><Button disabled={pending === invite.id} onClick={() => void respond(invite.id, "accept")}>Accept</Button><Button disabled={pending === invite.id} variant="outline" onClick={() => void respond(invite.id, "decline")}>Decline</Button></div></div></article>)}{message ? <p className="text-sm font-semibold text-destructive">{message}</p> : null}</section>;
}
