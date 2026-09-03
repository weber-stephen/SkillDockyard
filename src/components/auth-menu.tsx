"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

export function AuthMenu({ email }: { email: string }) {
  const router = useRouter();
  async function signOut() {
    await createBrowserSupabase().auth.signOut();
    router.push("/");
    router.refresh();
  }
  return <div className="flex items-center gap-3"><span className="hidden text-xs font-semibold text-muted-foreground sm:block">{email}</span><Button type="button" size="sm" variant="outline" onClick={signOut}><LogOut className="h-3.5 w-3.5" />Log out</Button></div>;
}
