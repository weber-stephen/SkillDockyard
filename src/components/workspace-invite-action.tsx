"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
export function WorkspaceInviteAction({ token }: { token: string }) {
  const router = useRouter(); const [message, setMessage] = useState<string | null>(null); const [pending, setPending] = useState(false);
  async function accept() { setPending(true); setMessage(null); const response = await fetch("/api/workspace-invites/accept", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) }); const payload = await response.json(); setPending(false); if (!response.ok) { setMessage(payload.error ?? "We could not accept that invitation."); return; } router.push("/app" as never); router.refresh(); }
  return <div className="space-y-3"><Button onClick={() => void accept()} disabled={pending}>{pending ? "Joining..." : "Join workspace"}</Button>{message ? <p className="text-sm font-semibold text-destructive">{message}</p> : null}</div>;
}
