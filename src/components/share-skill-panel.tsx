"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ArtifactDetail } from "@/lib/types";

export function ShareSkillPanel({
  artifact,
  workspaces
}: {
  artifact: ArtifactDetail;
  workspaces: Array<{ id: string; name: string }>;
}) {
  const [targetType, setTargetType] = useState<"user" | "workspace">("user");
  const [targetEmail, setTargetEmail] = useState("");
  const [targetWorkspaceId, setTargetWorkspaceId] = useState("");
  const [targetWorkspaceName, setTargetWorkspaceName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artifactId: artifact.id,
        targetType,
        targetEmail,
        targetWorkspaceId: targetType === "workspace" ? targetWorkspaceId || undefined : undefined,
        targetWorkspaceName: targetType === "workspace" ? targetWorkspaceName || undefined : undefined
      })
    });
    const payload = await response.json();
    setPending(false);
    setMessage(response.ok ? "Share created. Access begins after acceptance unless the workspace is already active." : payload.error ?? "We could not share that skill.");
  }

  return (
    <section className="rounded-md border border-border bg-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-black">Share Skill</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Recipients can propose updates by default. Publishing stays with the source workspace owner or reviewer.</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 rounded-md border border-border p-1 text-sm font-semibold">
        <button type="button" className={targetType === "user" ? "rounded-sm bg-primary px-3 py-2 text-white" : "rounded-sm px-3 py-2 text-muted-foreground"} onClick={() => setTargetType("user")}>Individual</button>
        <button type="button" className={targetType === "workspace" ? "rounded-sm bg-primary px-3 py-2 text-white" : "rounded-sm px-3 py-2 text-muted-foreground"} onClick={() => setTargetType("workspace")}>Workspace</button>
      </div>

      <div className="mt-4 space-y-4">
        {targetType === "user" ? (
          <label className="block space-y-2">
            <span className="text-sm font-bold">Recipient email</span>
            <Input value={targetEmail} onChange={(event) => setTargetEmail(event.target.value)} placeholder="teammate@company.com" />
          </label>
        ) : (
          <>
            <label className="block space-y-2">
              <span className="text-sm font-bold">Target workspace</span>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                value={targetWorkspaceId}
                onChange={(event) => setTargetWorkspaceId(event.target.value)}
              >
                <option value="">Choose an existing workspace</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                ))}
              </select>
              <span className="block text-xs leading-5 text-muted-foreground">Choose a known workspace for immediate shared access, or use the owner email fields below.</span>
            </label>
            {!targetWorkspaceId ? (
              <>
                <label className="block space-y-2">
                  <span className="text-sm font-bold">Workspace owner email</span>
                  <Input value={targetEmail} onChange={(event) => setTargetEmail(event.target.value)} placeholder="owner@company.com" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold">Workspace name</span>
                  <Input value={targetWorkspaceName} onChange={(event) => setTargetWorkspaceName(event.target.value)} placeholder="Growth Team" />
                </label>
              </>
            ) : null}
          </>
        )}
        <Button disabled={pending} onClick={() => void submit()}>Share Skill</Button>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </div>

      {artifact.shares?.length ? (
        <div className="mt-6 border-t border-border pt-4">
          <h3 className="font-black">Current Shares</h3>
          <div className="mt-3 space-y-3">
            {artifact.shares.map((share) => (
              <div key={share.id} className="rounded-sm border border-border bg-background p-3 text-sm">
                <div className="font-semibold">
                  {share.target_type === "workspace" ? share.target_workspace_name || "Workspace share" : share.target_email || "Individual share"}
                </div>
                <p className="mt-1 text-muted-foreground">Status: {share.status}. Permission: {share.permission}.</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
