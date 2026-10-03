import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/settings";
import { getSupabaseErrorStatus } from "@/lib/supabase/errors";
import { z } from "zod";
import { readJsonSchema } from "@/lib/request-body";

const settingsSchema = z.object({ configFile: z.string().trim().min(1).max(200), approvedMcpServers: z.array(z.string().trim().min(1).max(120)).max(100), highImpactTools: z.array(z.string().trim().min(1).max(120)).max(100) }).strict();

export async function GET() {
  try {
    return NextResponse.json(await getSettings());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load settings." }, { status: getSupabaseErrorStatus(error, 500) });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await readJsonSchema(request, settingsSchema, 32 * 1024);
    return NextResponse.json(await updateSettings(body));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save settings." }, { status: getSupabaseErrorStatus(error) });
  }
}
