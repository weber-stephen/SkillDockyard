import { NextResponse } from "next/server";
import { createWorkspaceScanToken, listWorkspaceScanTokens, revokeWorkspaceScanToken } from "@/lib/scan-tokens";

export async function GET() {
  try { return NextResponse.json({ tokens: await listWorkspaceScanTokens() }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load scan tokens." }, { status: 500 }); }
}

export async function POST() {
  try { return NextResponse.json(await createWorkspaceScanToken(), { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create a scan token." }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json() as { id?: unknown };
    if (typeof body.id !== "string" || !body.id) return NextResponse.json({ error: "A token id is required." }, { status: 400 });
    await revokeWorkspaceScanToken(body.id);
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to revoke the scan token." }, { status: 400 }); }
}
