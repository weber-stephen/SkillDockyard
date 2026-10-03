"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface SettingsFormProps {
  configFile: string;
  approvedMcpServers: string[];
  highImpactTools: string[];
  mode: "demo" | "supabase";
}

export function SettingsForm({ configFile, approvedMcpServers, highImpactTools, mode }: SettingsFormProps) {
  const [currentConfigFile, setCurrentConfigFile] = useState(configFile);
  const [mcpServers, setMcpServers] = useState(approvedMcpServers.join("\n"));
  const [tools, setTools] = useState(highImpactTools.join("\n"));
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        configFile: currentConfigFile,
        approvedMcpServers: parseList(mcpServers),
        highImpactTools: parseList(tools)
      })
    });
    setPending(false);
    if (response.ok) {
      setMessage("Settings saved.");
      return;
    }
    const body = await response.json().catch(() => null);
    setMessage(body?.error ?? "Settings could not be saved.");
  }

  return (
    <div className="space-y-4 rounded-md border border-border bg-panel p-5">
      <div>
        <h2 className="font-black">Workspace settings</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "demo" ? "Demo mode is read-only until the live workspace is connected." : "Saved for skill imports and publishing."}
        </p>
      </div>
      <label className="grid gap-2 text-sm font-semibold">
        Import configuration file
        <Input value={currentConfigFile} onChange={(event) => setCurrentConfigFile(event.target.value)} />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Allowed connectors
        <Textarea value={mcpServers} onChange={(event) => setMcpServers(event.target.value)} />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Tools requiring review
        <Textarea value={tools} onChange={(event) => setTools(event.target.value)} />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={pending || mode === "demo"} onClick={save}>
          <Save className="h-4 w-4" />
          Save settings
        </Button>
        {message ? <p className="text-sm font-semibold text-muted-foreground">{message}</p> : null}
      </div>
    </div>
  );
}

function parseList(value: string) {
  return [...new Set(value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean))];
}
