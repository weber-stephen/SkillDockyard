import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { listNotifications } from "@/lib/notifications";
import { getProductMode } from "@/lib/product-mode";
import { formatDate } from "@/lib/utils";
import { ProductLink as Link } from "@/components/product-link";
import { MarkNotificationsRead } from "@/components/mark-notifications-read";

export default async function NotificationsPage() {
  if ((await getProductMode()) === "demo") return <EmptyNotifications demo />;
  const notifications = await listNotifications();
  return <div className="space-y-6"><header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6"><div><Badge variant="outline">Activity</Badge><h1 className="mt-3 text-3xl font-black">Notifications</h1><p className="mt-2 text-muted-foreground">Stay up to date on submissions, reviews, and skill updates.</p></div>{notifications.some((item) => !item.read_at) ? <MarkNotificationsRead /> : null}</header>{notifications.length ? <div className="divide-y divide-border overflow-hidden rounded-md border border-border bg-panel">{notifications.map((notification) => <article key={notification.id} className={`flex gap-3 p-5 ${notification.read_at ? "" : "bg-primary/[0.035]"}`}><Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><div className="font-bold">{notification.title}</div><p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.body}</p>{notification.href ? <Link href={notification.href} className="mt-2 inline-block text-sm font-semibold text-primary underline underline-offset-4">View skill</Link> : null}<time className="mt-2 block text-xs text-muted-foreground">{formatDate(notification.created_at)}</time></div></article>)}</div> : <EmptyNotifications />}</div>;
}

function EmptyNotifications({ demo = false }: { demo?: boolean }) { return <div className="rounded-md border border-border bg-panel p-8 text-center"><Bell className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-3 font-black">No notifications yet</p><p className="mt-2 text-sm text-muted-foreground">{demo ? "Demo actions stay local and do not send workspace notifications." : "Proposal updates will appear here."}</p></div>; }
