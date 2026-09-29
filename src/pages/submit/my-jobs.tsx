import { ClipboardList } from "lucide-react";
import { useMemo } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { Money } from "@/components/common/money";
import { Badge } from "@/components/ui/badge";
import type { PortalJobRecord } from "@/hooks/use-portal";
import { formatDateShort, monthKeyOf, monthLabel } from "@/lib/date";
import { formatAmount, formatQty } from "@/lib/format";

const itemSummary = (items: { name: string; qty: number }[]): string => {
  if (!items.length) return "無項目明細";
  const shown = items
    .slice(0, 3)
    .map((item) => `${item.name} ×${formatQty(item.qty)}`)
    .join("、");
  return items.length > 3 ? `${shown} 等 ${items.length} 項` : shown;
};

/** 師傅自己的安裝紀錄，依月份分組並顯示每月小計。 */
export const MyJobs = ({
  jobs,
  isLoading,
}: {
  jobs: PortalJobRecord[];
  isLoading: boolean;
}) => {
  const groups = useMemo(() => {
    const map = new Map<string, PortalJobRecord[]>();
    jobs.forEach((job) => {
      const key = monthKeyOf(job.job_date);
      map.set(key, [...(map.get(key) ?? []), job]);
    });
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [jobs]);

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">我的安裝紀錄</h2>

      {isLoading ? (
        <LoadingState />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="還沒有安裝紀錄"
          description="老闆建立場次後，這裡會顯示你每一場的工資與油資。"
        />
      ) : (
        <div className="space-y-5">
          {groups.map(([month, monthJobs]) => {
            const subtotal = monthJobs.reduce(
              (total, job) => total + Number(job.total),
              0,
            );
            return (
              <div key={month} className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {monthLabel(month)}
                  </h3>
                  <span className="num text-xs text-muted-foreground">
                    {monthJobs.length} 場 · NT${formatAmount(subtotal)}
                  </span>
                </div>

                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-e1">
                  {monthJobs.map((job) => (
                    <li key={job.id} className="space-y-1.5 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {job.customer_name || "未填客戶"}
                          </p>
                          <p className="num truncate text-xs text-muted-foreground">
                            {formatDateShort(job.job_date)}
                            {job.region_name ? ` · ${job.region_name}` : ""}
                          </p>
                        </div>
                        <Money value={job.total} size="md" />
                      </div>

                      <p className="truncate text-xs text-muted-foreground">
                        {itemSummary(job.items)}
                      </p>

                      <div className="num flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>工資 {formatAmount(job.labor)}</span>
                        <span>
                          油資{" "}
                          {formatAmount(
                            Number(job.fuel) + Number(job.extra_fuel),
                          )}
                        </span>
                        {Number(job.claims_approved) ? (
                          <span>
                            額外工資 {formatAmount(job.claims_approved)}
                          </span>
                        ) : null}
                      </div>

                      {Number(job.claims_pending) ? (
                        <Badge variant="warning">
                          有 NT${formatAmount(job.claims_pending)} 待審核
                        </Badge>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};