"use client";
import { useSearchParams } from "next/navigation";
import { ProductLink as Link } from "@/components/product-link";
import { Button } from "@/components/ui/button";
export function DemoSetupReturn() { const params = useSearchParams(); if (params.get("from") !== "setup") return null; async function done() { await fetch("/api/onboarding", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exploredDemo: true }) }); } return <div className="border-b border-primary/25 bg-primary/[0.055] px-4 py-3 text-sm sm:px-6 lg:px-10"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3"><span>You’re viewing sample data. Nothing here changes your workspace.</span><Button asChild size="sm" onClick={() => void done()}><Link href="/getting-started">Return to setup</Link></Button></div></div>; }
