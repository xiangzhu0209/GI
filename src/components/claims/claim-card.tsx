import { CalendarDays } from "lucide-react";
import type { ReactNode } from "react";
import { ClaimPhotos } from "@/components/claims/claim-photos";
import { ClaimStatusBadge } from "@/components/common/claim-status-badge";
import { Money } from "@/components/common/money";
import { claimAmount } from "@/lib/calc";
import { claimTypeLabel } from "@/lib/claim-meta";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";

/** 管理端與師傅端共用的最小欄位集合。 */
export type ClaimLike = {
  /** 只有「其他」類型才會有工作內容。 */
  title: string | null;
  claim_type: string;
  amount: number;
  note: string | null;
  work_date: string;
  photo_paths: string[];
  status: string;
  review_note: string | null;
};

type ClaimCardProps = {
  claim: ClaimLike;
  technicianName?: string | null;
  jobLabel?: string | null;
  actions?: ReactNode;
  className?: string;
};

export const ClaimCard = ({
  claim,
  technicianName,
  jobLabel,
  actions,
  className,
}: ClaimCardProps) => {
  const typeLabel = claimTypeLabel(claim.claim_type);
  const hasTitle = Boolean(claim.title?.trim());

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-e1",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {hasTitle ? claim.title : typeLabel}
            </span>
            <ClaimStatusBadge status={claim.status} />
          </div>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {hasTitle ? (
              <span className="rounded bg-muted px-1.5 py-0.5 font-medium">
                {typeLabel}
              </span>
            ) : null}
            {technicianName ? <span>{technicianName}</span> : null}
            {jobLabel ? <span>{jobLabel}</span> : null}
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formatDate(claim.work_date)}
            </span>
          </p>
        </div>

        <Money value={claimAmount(claim)} size="lg" />
      </div>

      {claim.note ? (
        <p className="mt-3 whitespace-pre-wrap rounded-md bg-muted/60 px-3 py-2 text-sm text-foreground">
          {claim.note}
        </p>
      ) : null}

      {claim.review_note ? (
        <p className="mt-3 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
          審核備註：{claim.review_note}
        </p>
      ) : null}

      {claim.photo_paths.length ? (
        <div className="mt-3">
          <ClaimPhotos paths={claim.photo_paths} />
        </div>
      ) : null}

      {actions ? <div className="mt-4">{actions}</div> : null}
    </div>
  );
};