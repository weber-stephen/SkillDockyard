import { NextResponse } from "next/server";
import { listMyProposals, listReviewQueue } from "@/lib/proposals";

export async function GET(request: Request) {
  const view = new URL(request.url).searchParams.get("view") === "review" ? "review" : "mine";
  const proposals = view === "review" ? await listReviewQueue() : await listMyProposals();
  return NextResponse.json({ proposals });
}
