import { Clock } from "lucide-react";
import { LoadingState } from "@/components/common/loading-state";
import { Money } from "@/components/common/money";
import type { PortalJobRecord } from "@/hooks/use-portal";
import { currentMonthKey, monthKeyOf, monthLabel } from "@/lib/date";

const sum = (jobs: PortalJobRecord[]) =>
  jobs.reduce(
    (acc, job) => ({
      labor: acc.labor + Number(job.labor),
      fuel: acc.fuel + Number(job.fuel) + Number(job.extra_fuel),
      claims: acc.claims + Number(job.claims_approved),
      total: acc.total + Number(job.total),
    }),
    { labor: 0, fuel: 0, claims: 0, total: 0 },
  );

/** 師傅開啟連結後第一眼看到的：本月應得金額。 */
export const EarningsSummary = ({
  jobs,
  pendingAmount,
  isLoading,
}: {
  jobs: PortalJobRecord[];
  pendingAmount: number;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <LoadingState />
      </div>
    );
  }

  const month = currentMonthKey();
  const monthJobs = jobs.filter((job) => monthKeyOf(job.job_date) === month);
  const totals = sum(monthJobs);

  const cells: { label: string; value: number }[] = [
    { label: "安裝工資", value: totals.labor },
    { label: "油資", value: totals.fuel },
    { label: "額外工資", value: totals.claims },
  ];

  return (
    <section className="sheen-hero rounded-lg p-5 shadow-e2">
      <p className="text-sm text-primary-foreground/75">
        {monthLabel(month)}應得
      </p>
      <Money
        value={totals.total}
        size="xl"
        className="text-3xl text-primary-foreground"
        symbolClassName="text-primary-foreground/70"
      />
      <p className="mt-1 text-xs text-primary-foreground/70">
        共 {monthJobs.length} 場
      </p>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-primary-foreground/15 pt-4">
        {cells.map((cell) => (
          <div key={cell.label}>
            <dt className="text-xs text-primary-foreground/70">{cell.label}</dt>
            <dd>
              <Money
                value={cell.value}
                className="text-primary-foreground"
                symbolClassName="text-primary-foreground/70"
              />
            </dd>
          </div>
        ))}
      </dl>

      {pendingAmount > 0 ? (
        <p className="mt-4 flex items-start gap-2 rounded-md bg-primary-foreground/10 px-3 py-2 text-xs leading-relaxed text-primary-foreground">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            另有 NT${pendingAmount.toLocaleString("zh-TW")}{" "}
            的額外工資待老闆審核，核准後才會計入。
          </span>
        </p>
      ) : null}
    </section>
  );
};