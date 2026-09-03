"use client";

import { ProductLink as Link } from "@/components/product-link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Search, Send } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isLocalDraftArtifact, readLocalDrafts } from "@/lib/local-drafts";
import { getSharingStatusView } from "@/lib/sharing";
import { formatDate } from "@/lib/utils";
import type { Artifact } from "@/lib/types";

export function ArtifactTable({ artifacts }: { artifacts: Artifact[] }) {
  const [query, setQuery] = useState("");
  const [localDrafts, setLocalDrafts] = useState<Artifact[]>([]);
  const allArtifacts = useMemo(() => [...localDrafts, ...artifacts], [artifacts, localDrafts]);

  useEffect(() => {
    const sync = () => setLocalDrafts(readLocalDrafts(window.localStorage));
    sync();
    window.addEventListener("skill-dockyard-local-drafts", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("skill-dockyard-local-drafts", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return allArtifacts;
    return allArtifacts.filter((artifact) =>
      [artifact.name, artifact.repo_name, artifact.path, artifact.owner, artifact.status, artifact.type, getSharingStatusView(artifact).label, isLocalDraftArtifact(artifact) ? "Local draft" : ""]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [allArtifacts, query]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Your Skill Library</h2>
          <p className="text-sm text-muted-foreground">Owned skills, shared skills, submissions, and local improvements you can review or update.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button asChild>
            <Link href="/submit">
              Submit Skill
              <Send className="h-4 w-4" />
            </Link>
          </Button>
          <label className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search skill, repo, owner..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
        </div>
      </div>
      <div className="rounded-md border border-border bg-panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Skill</TableHead>
              <TableHead>Library Status</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Current Change</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((artifact) => {
              const sharing = getSharingStatusView(artifact);
              const localDraft = isLocalDraftArtifact(artifact);
              return (
                <TableRow key={artifact.id}>
                  <TableCell>
                    {localDraft ? (
                      <div>
                        <span className="block font-bold">{artifact.name}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {artifact.repo_name} / {artifact.path}
                        </span>
                      </div>
                    ) : (
                      <Link href={`/artifacts/${artifact.id}`} className="group block">
                        <span className="block font-bold group-hover:underline">{artifact.name}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {artifact.repo_name} / {artifact.path}
                        </span>
                      </Link>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {localDraft ? <Badge variant="muted">Local draft</Badge> : <StatusBadge artifact={artifact} />}
                      {!localDraft && artifact.access_scope === "shared_user" ? <Badge variant="outline">Shared with you</Badge> : null}
                      {!localDraft && artifact.access_scope === "shared_workspace" ? <Badge variant="outline">Shared with workspace</Badge> : null}
                      {artifact.risk_count > 0 ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                          {artifact.risk_count} trust note{artifact.risk_count === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{artifact.owner ?? "Unassigned"}</TableCell>
                  <TableCell className="max-w-sm text-sm text-muted-foreground">
                    {localDraft
                      ? "Saved in this browser. Connect Supabase before teammates can use it."
                      : `${sharing.description}${artifact.can_publish ? " You can publish this skill." : artifact.can_propose_update ? " You can propose updates." : ""}`}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(artifact.updated_at)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
