"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, Search } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { Artifact } from "@/lib/types";

export function ArtifactTable({ artifacts }: { artifacts: Artifact[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return artifacts;
    return artifacts.filter((artifact) =>
      [artifact.name, artifact.repo_name, artifact.path, artifact.owner, artifact.status, artifact.type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [artifacts, query]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Artifact Catalog</h2>
          <p className="text-sm text-muted-foreground">Canonical inventory from local Git scans.</p>
        </div>
        <label className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, repo, owner..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>
      <div className="rounded-md border border-border bg-panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((artifact) => (
              <TableRow key={artifact.id}>
                <TableCell>
                  <Link href={`/artifacts/${artifact.id}`} className="group block">
                    <span className="block font-bold group-hover:underline">{artifact.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {artifact.repo_name} / {artifact.path}
                    </span>
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge status={artifact.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{artifact.owner ?? "Unassigned"}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle className={artifact.risk_count > 0 ? "h-4 w-4 text-amber-700" : "h-4 w-4 text-muted-foreground"} />
                    {artifact.risk_count}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(artifact.updated_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
