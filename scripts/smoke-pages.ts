import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const host = "127.0.0.1";
const port = Number(process.env.PAGE_SMOKE_PORT ?? 4317);
const baseUrl = `http://${host}:${port}`;
const nextBinary = `${process.cwd()}/node_modules/.bin/next`;

const pageRoutes = [
  ["/", "Keep your team’s best AI instructions current and easy to reuse."],
  ["/login", ""],
  ["/signup", ""],
  ["/demo", "Share your skill improvements without losing what changed."],
  ["/demo/getting-started", "Your first skill is in your library."],
  ["/demo/artifacts", "Skills"],
  ["/demo/artifacts/art_release_captain", "Campaign Brief Builder"],
  ["/demo/artifacts/art_release_captain/review", "Version Integrity"],
  ["/demo/artifacts/art_release_captain/update", "You cannot propose an update here."],
  ["/demo/artifacts/art_security_agent", "Sales Discovery Prep"],
  ["/demo/artifacts/art_security_agent/review", "Version Integrity"],
  ["/demo/artifacts/art_security_agent/update", "You cannot propose an update here."],
  ["/demo/artifacts/art_agents_md", "Customer Voice Digest"],
  ["/demo/artifacts/art_agents_md/review", "Version Integrity"],
  ["/demo/artifacts/art_agents_md/update", "You cannot propose an update here."],
  ["/demo/submit", "Add a new skill to the library."],
  ["/demo/submit/update", "Propose an update to a skill."],
  ["/demo/submissions", "My submissions"],
  ["/demo/review-queue", "Submissions to review"],
  ["/demo/notifications", "No notifications yet"],
  ["/demo/invites", "Invitations"],
  ["/demo/exports", "Exports"],
  ["/demo/settings/repos", "Repository and scanner settings"],
  ["/demo/settings/risk-rules", "Trust Rules"]
] as const;

const errorMarkers = [
  "Application error",
  "Unhandled Runtime Error",
  "Internal Server Error",
  "NEXT_NOT_FOUND"
];

type PageResult = {
  path: string;
  status: number;
  finalPath: string;
  body: string;
};

function startServer() {
  const child = spawn(nextBinary, ["start", "-H", host, "-p", String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let output = "";
  child.stdout?.on("data", (chunk: Buffer) => { output += chunk.toString(); });
  child.stderr?.on("data", (chunk: Buffer) => { output += chunk.toString(); });
  return { child, getOutput: () => output };
}

async function waitForServer(child: ChildProcess, getOutput: () => string) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`The Next server exited before becoming ready.\n${getOutput()}`);
    }

    try {
      const response = await fetch(`${baseUrl}/`);
      if (response.status < 500) return;
    } catch {
      // The server is still starting.
    }

    await delay(100);
  }

  throw new Error(`Timed out waiting for the Next server.\n${getOutput()}`);
}

async function fetchPage(path: string): Promise<PageResult> {
  const response = await fetch(`${baseUrl}${path}`);
  const body = await response.text();
  const finalUrl = new URL(response.url);
  return { path, status: response.status, finalPath: `${finalUrl.pathname}${finalUrl.search}`, body };
}

function assertPage(result: PageResult, marker?: string) {
  if (!result.body || !result.body.includes("<html")) {
    throw new Error(`${result.path} did not return an HTML document.`);
  }
  if (!result.status || result.status < 200 || result.status >= 300) {
    throw new Error(`${result.path} returned HTTP ${result.status}.`);
  }
  const markerFound = marker && result.body.includes(marker);
  if (marker && !markerFound) {
    throw new Error(`${result.path} did not contain expected content: ${marker}`);
  }
  const error = errorMarkers.find((candidate) => result.body.includes(candidate));
  if (error) {
    throw new Error(`${result.path} contained a server error marker: ${error}`);
  }
}

function extractInternalPageLinks(body: string) {
  const links = new Set<string>();
  const pattern = /href=["']([^"']+)["']/g;
  for (const match of body.matchAll(pattern)) {
    const href = match[1];
    if (!href || href.startsWith("#") || href.startsWith("/") === false || href.startsWith("//") || href.startsWith("/api/") || href.startsWith("/_next/")) continue;
    links.add(href);
  }
  return links;
}

async function assertUnauthenticatedRedirect() {
  const response = await fetch(`${baseUrl}/app`, { redirect: "manual" });
  const location = response.headers.get("location") ?? "";
  if (response.status < 300 || response.status >= 400 || !location.endsWith("/login")) {
    throw new Error(`/app should redirect unauthenticated users to /login, got HTTP ${response.status} -> ${location}`);
  }
}

async function assertDemoRedirect() {
  const result = await fetchPage("/demo/submit?artifact=art_release_captain");
  if (result.finalPath !== "/demo/artifacts/art_release_captain/update") {
    throw new Error(`Demo submit redirect ended at ${result.finalPath}, expected /demo/artifacts/art_release_captain/update.`);
  }
  assertPage(result, "You cannot propose an update here.");
}

async function assertDemoExports() {
  for (const format of ["json", "csv"]) {
    const response = await fetch(`${baseUrl}/api/export?format=${format}&demo=1`);
    if (!response.ok) throw new Error(`/api/export?format=${format}&demo=1 returned HTTP ${response.status}.`);
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes(format === "json" ? "application/json" : "text/csv")) {
      throw new Error(`/api/export?format=${format}&demo=1 returned unexpected content type: ${contentType}`);
    }
  }
}

async function run() {
  const server = startServer();
  try {
    await waitForServer(server.child, server.getOutput);

    const results = await Promise.all(pageRoutes.map(async ([path, marker]) => {
      const result = await fetchPage(path);
      assertPage(result, marker);
      return result;
    }));

    const discoveredLinks = new Set<string>();
    for (const result of results) {
      for (const link of extractInternalPageLinks(result.body)) discoveredLinks.add(link);
    }

    await Promise.all([...discoveredLinks].map(async (path) => {
      const result = await fetchPage(path);
      assertPage(result);
    }));

    await assertUnauthenticatedRedirect();
    await assertDemoRedirect();
    await assertDemoExports();

    console.log(`Page smoke checks passed: ${pageRoutes.length} explicit pages and ${discoveredLinks.size} internal links.`);
  } finally {
    server.child.kill("SIGTERM");
  }
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
