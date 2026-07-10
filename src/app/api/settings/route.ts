import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    configFile: "skill-dockyard.yml",
    approvedMcpServers: ["github", "filesystem-readonly"],
    highImpactTools: ["shell", "exec", "stripe", "github:write", "database:write"]
  });
}
