"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Token = { id: string; token_hint: string; expires_at: string; last_used_at: string | null; revoked_at: string | null };

export function ConnectedCliPanel() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/cli/tokens").then((response) => response.json()).then((body) => setTokens(body.tokens ?? [])).finally(() => setLoading(false)); }, []);
  async function revoke(id: string) {
    const response = await fetch("/api/cli/tokens", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (response.ok) setTokens((items) => items.map((item) => item.id === id ? { ...item, revoked_at: new Date().toISOString() } : item));
  }
  return <section className="rounded-md border border-border bg-panel p-5"><h2 className="text-xl font-black">Connected computers</h2><p className="mt-1 text-sm text-muted-foreground">These connections can import, download, and report your own skill installations. They cannot publish or manage access.</p>{loading ? <p className="mt-4 text-sm text-muted-foreground">Loading connections…</p> : tokens.length ? <div className="mt-4 divide-y divide-border">{tokens.map((token) => <div key={token.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span>Connection ending in <code>{token.token_hint}</code> · {token.revoked_at ? "Revoked" : `Expires ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(token.expires_at))}`}</span>{!token.revoked_at ? <Button size="sm" variant="outline" onClick={() => void revoke(token.id)}>Revoke</Button> : null}</div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">No computers are connected yet. Use Import existing skills from setup to connect one.</p>}</section>;
}
