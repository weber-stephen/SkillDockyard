"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { trackAnalyticsEvent } from "@/lib/analytics";

type Token = { id: string; token_hint: string; expires_at: string; last_used_at: string | null; revoked_at: string | null };

export function ConnectedCliPanel() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingMessage, setPairingMessage] = useState<string | null>(null);
  useEffect(() => { fetch("/api/cli/tokens").then((response) => response.json()).then((body) => setTokens(body.tokens ?? [])).finally(() => setLoading(false)); }, []);
  async function revoke(id: string) {
    const response = await fetch("/api/cli/tokens", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (response.ok) {
      setTokens((items) => items.map((item) => item.id === id ? { ...item, revoked_at: new Date().toISOString() } : item));
      trackAnalyticsEvent("connected_computer_revoked");
    }
  }
  async function createPairingCode() {
    setPairingMessage(null);
    const response = await fetch("/api/cli/pairing-codes", { method: "POST" });
    const body = await response.json();
    if (!response.ok) return setPairingMessage(body.error ?? "Could not create a pairing code.");
    setPairingCode(body.code);
    trackAnalyticsEvent("pairing_code_created");
  }
  const command = typeof window === "undefined" ? "" : `npx skill-dockyard connect --endpoint ${window.location.origin} --code ${pairingCode}\nnpx skill-dockyard import`;
  return <section className="rounded-md border border-border bg-panel p-5"><h2 className="text-xl font-black">Connected computers</h2><p className="mt-1 text-sm text-muted-foreground">These connections can import, download, and report your own skill installations. They cannot publish or manage access.</p>{loading ? <p className="mt-4 text-sm text-muted-foreground">Loading connections…</p> : tokens.length ? <div className="mt-4 divide-y divide-border">{tokens.map((token) => <div key={token.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span>Connection ending in <code>{token.token_hint}</code> · {token.revoked_at ? "Revoked" : `Expires ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(token.expires_at))}`}</span>{!token.revoked_at ? <Button size="sm" variant="outline" onClick={() => void revoke(token.id)}>Revoke</Button> : null}</div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">No computers are connected yet.</p>}<details className="mt-5 border-t border-border pt-4"><summary className="cursor-pointer text-sm font-bold">Use a Skill Dockyard command instead</summary><p className="mt-2 text-sm leading-6 text-muted-foreground">Pair this computer, then run the import command in Terminal. The one-time code expires after 10 minutes.</p><Button className="mt-3" size="sm" variant="outline" onClick={() => void createPairingCode()}>Create pairing code</Button>{pairingCode ? <pre className="mt-3 overflow-x-auto border border-border bg-background p-3 text-xs leading-6"><code>{command}</code></pre> : null}{pairingMessage ? <p className="mt-2 text-sm text-destructive">{pairingMessage}</p> : null}</details></section>;
}
