import { Check, Clock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CLAIM_STATUS_META } from "@/lib/claim-meta";
import type { ClaimStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS = {
  pending: Clock,
  approved: Check,
  rejected: X,
} as const;

const VARIANTS = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
} as const;

export const ClaimStatusBadge = ({
  status,
  className,
}: {
  status: string;
  className?: string;
}) => {
  const key = (status as ClaimStatus) in CLAIM_STATUS_META
    ? (status as ClaimStatus)
    : "pending";
  const Icon = ICONS[key];
  return (
    <Badge variant={VARIANTS[key]} className={cn(className)}>
      <Icon className="h-3 w-3" />
      {CLAIM_STATUS_META[key].label}
    </Badge>
  );
};