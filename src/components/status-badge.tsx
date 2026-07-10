import { Badge } from "@/components/ui/badge";
import type { ArtifactStatus } from "@/lib/types";

const statusLabels: Record<ArtifactStatus, string> = {
  approved: "Approved",
  deprecated: "Deprecated",
  needs_reapproval: "Needs review",
  unreviewed: "Unreviewed"
};

export function StatusBadge({ status }: { status: ArtifactStatus }) {
  const variant = status === "approved" ? "success" : status === "needs_reapproval" ? "risk" : "muted";
  return <Badge variant={variant}>{statusLabels[status]}</Badge>;
}
