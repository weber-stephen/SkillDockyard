import { spawnSync } from "node:child_process";

type LocalEnv = Record<string, string>;

function run(command: string, args: string[], env = process.env) {
  const result = spawnSync(command, args, { stdio: "inherit", env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function capture(command: string, args: string[]) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
  return result.stdout;
}

function parseEnv(value: string): LocalEnv {
  return Object.fromEntries(value.split(/\r?\n/).flatMap((line) => {
    const separator = line.indexOf("=");
    return separator > 0 ? [[line.slice(0, separator), line.slice(separator + 1)]] : [];
  }));
}

const mode = process.argv[2] ?? "all";
const port = process.env.ACCEPTANCE_TEST_PORT ?? "4319";
const origin = `http://127.0.0.1:${port}`;

run("npx", ["supabase", "start"]);
run("npx", ["supabase", "db", "reset", "--local", "--no-seed"]);
const local = parseEnv(capture("npx", ["supabase", "status", "--output", "env"]));
const acceptanceEnv: NodeJS.ProcessEnv = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: local.API_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: local.PUBLISHABLE_KEY ?? local.ANON_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: local.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY,
  MAILPIT_URL: local.MAILPIT_URL ?? local.INBUCKET_URL,
  NEXT_PUBLIC_SITE_URL: origin,
  ACCEPTANCE_TEST_PORT: port,
  SELF_SERVICE_SIGNUP_ENABLED: "true",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: ""
};

if (mode === "db") {
  run("npx", ["supabase", "test", "db", "--local"], acceptanceEnv);
  process.exit(0);
}

run("npm", ["run", "build"], acceptanceEnv);
if (mode === "all") {
  run("npx", ["supabase", "test", "db", "--local"], acceptanceEnv);
  run("npm", ["run", "test:acceptance:live"], acceptanceEnv);
}
const grep = mode === "email" ? "@email" : mode === "connected-computer" ? "@connected-computer" : undefined;
run("npx", ["playwright", "test", "-c", "playwright.acceptance.config.ts", ...(grep ? ["--grep", grep] : [])], acceptanceEnv);
