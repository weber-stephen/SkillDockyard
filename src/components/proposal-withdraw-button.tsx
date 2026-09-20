"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ProposalWithdrawButton({ proposalId }: { proposalId: string }) {
  const [pending, setPending] = useState(false);
  async function withdraw() {
    setPending(true);
    await fetch(`/api/proposals/${proposalId}/withdraw`, { method: "POST" });
    window.location.reload();
  }
  return <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={withdraw}>{pending ? "Withdrawing…" : "Withdraw"}</Button>;
}
