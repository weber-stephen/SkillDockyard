import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/supabase/auth";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login" as never);
  if (!hasSupabaseConfig()) {
    return <AppShell mode="app" email={user.email ?? "Account"}><section className="mx-auto max-w-2xl rounded-md border border-border bg-panel p-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">One setup step remains</p><h1 className="mt-3 text-3xl font-black">Connect the live workspace data</h1><p className="mt-3 leading-7 text-muted-foreground">Your account is signed in, but this local app is missing its server-only Supabase service-role key. Add <code className="rounded bg-muted px-1.5 py-0.5 text-sm text-foreground">SUPABASE_SERVICE_ROLE_KEY</code> to <code className="rounded bg-muted px-1.5 py-0.5 text-sm text-foreground">.env.local</code>, then restart the dev server.</p><p className="mt-3 text-sm leading-6 text-muted-foreground">The browser publishable key is not enough for the live workspace because the app keeps database access on the server.</p><Button asChild variant="outline" className="mt-6"><a href="/demo">Explore the demo meanwhile</a></Button></section></AppShell>;
  }
  return <AppShell mode="app" email={user.email ?? "Account"}>{children}</AppShell>;
}
