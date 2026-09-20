"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function MarkNotificationsRead() {
  const [done, setDone] = useState(false);
  return <Button size="sm" variant="outline" disabled={done} onClick={async () => { const response = await fetch("/api/notifications/read", { method: "POST" }); if (response.ok) setDone(true); }}>{done ? "Marked as read" : "Mark all as read"}</Button>;
}
