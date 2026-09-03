import { createServerSupabase, hasSupabaseConfig } from "@/lib/supabase/server";
import { getProductMode } from "@/lib/product-mode";
import { requireWorkspaceId } from "@/lib/supabase/auth";
import type { WorkspaceSettings } from "@/lib/types";

export const defaultSettings = {
  config_file: "skill-dockyard.yml",
  approved_mcp_servers: ["github", "filesystem-readonly"],
  high_impact_tools: ["shell", "exec", "stripe", "github:write", "database:write"]
};

export interface SettingsPayload {
  configFile: string;
  approvedMcpServers: string[];
  highImpactTools: string[];
  mode: "demo" | "supabase";
  workspaceId: string | null;
}

export function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
}

export async function ensureWorkspaceId() {
  return requireWorkspaceId();
}

export async function getSettings(): Promise<SettingsPayload> {
  if ((await getProductMode()) === "demo") {
    return {
      configFile: defaultSettings.config_file,
      approvedMcpServers: defaultSettings.approved_mcp_servers,
      highImpactTools: defaultSettings.high_impact_tools,
      mode: "demo",
      workspaceId: null
    };
  }
  if (!hasSupabaseConfig()) throw new Error("The live app is not configured.");

  const workspaceId = await ensureWorkspaceId();
  const supabase = createServerSupabase();
  const { data, error } = await supabase.from("workspace_settings").select("*").eq("workspace_id", workspaceId).maybeSingle();
  if (error) throw error;

  const settings = (data as WorkspaceSettings | null) ?? null;
  return {
    configFile: settings?.config_file ?? defaultSettings.config_file,
    approvedMcpServers: settings?.approved_mcp_servers ?? defaultSettings.approved_mcp_servers,
    highImpactTools: settings?.high_impact_tools ?? defaultSettings.high_impact_tools,
    mode: "supabase",
    workspaceId
  };
}

export async function updateSettings(input: {
  configFile?: unknown;
  approvedMcpServers?: unknown;
  highImpactTools?: unknown;
}) {
  if (!hasSupabaseConfig() || (await getProductMode()) === "demo") {
    throw new Error("Supabase is not configured.");
  }

  const workspaceId = await ensureWorkspaceId();
  const payload = {
    workspace_id: workspaceId,
    config_file: typeof input.configFile === "string" && input.configFile.trim() ? input.configFile.trim() : defaultSettings.config_file,
    approved_mcp_servers: normalizeStringList(input.approvedMcpServers),
    high_impact_tools: normalizeStringList(input.highImpactTools),
    updated_at: new Date().toISOString()
  };

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("workspace_settings")
    .upsert(payload, { onConflict: "workspace_id" })
    .select("*")
    .single();
  if (error) throw error;

  const settings = data as WorkspaceSettings;
  return {
    configFile: settings.config_file,
    approvedMcpServers: settings.approved_mcp_servers,
    highImpactTools: settings.high_impact_tools,
    mode: "supabase" as const,
    workspaceId
  };
}
