import {
  ArrowRight,
  ClipboardList,
  Clock,
  Fuel,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { Money } from "@/components/common/money";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/common/section-card";
import { useClaims } from "@/hooks/use-claims";
import { useMonthJobs } from "@/hooks/use-jobs";
import { useTechnicians } from "@/hooks/use-technicians";
import { approvedClaimTotal, claimAmount, jobBreakdown } from "@/lib/calc";
import { currentMonthKey, formatDateShort, monthLabel } from "@/lib/date";

const Dashboard = () => {
  const month = currentMonthKey();
  const { data: jobs, isLoading } = useMonthJobs(month);
  const { data: pendingClaims } = useClaims("pending");
  const { data: technicians } = useTechnicians();

  const stats = useMemo(() => {
    let labor = 0;
    let fuel = 0;
    let claims = 0;
    let total = 0;
    (jobs ?? []).forEach((job) => {
      const breakdown = jobBreakdown(
        job,
        job.job_items,
        approvedClaimTotal(job.extra_claims),
      );
      labor += breakdown.labor;
      fuel += breakdown.fuel + breakdown.extraFuel;
      claims += breakdown.claims;
      total += breakdown.total;
    });
    return { labor, fuel, claims, total };
  }, [jobs]);

  const pendingAmount = (pendingClaims ?? []).reduce(
    (sum, claim) => sum + claimAmount(claim),
    0,
  );

  const recentJobs = useMemo(
    () => [...(jobs ?? [])].sort((a, b) => b.job_date.localeCompare(a.job_date)).slice(0, 5),
    [jobs],
  );

  return (
    <div className="space-y-6">
      <section className="sheen-hero relative overflow-hidden rounded-lg p-6 shadow-e2 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-primary-foreground/75">
              {monthLabel(month)}應付總額
            </p>
            <Money
              value={stats.total}
              size="xl"
              className="text-3xl text-primary-foreground"
            />
            <p className="text-sm text-primary-foreground/75">
              共 {(jobs ?? []).length} 場 · {(technicians ?? []).length} 位師傅
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" asChild>
              <Link to="/jobs/new">
                <ClipboardList className="h-4 w-4" />
                新增場次
              </Link>
            </Button>
            <Button
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              asChild
            >
              <Link to="/settlement">
                月結統計
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="安裝工資"
            value={`NT$${stats.labor.toLocaleString("zh-TW")}`}
            icon={TrendingUp}
            tone="primary"
          />
          <StatCard
            label="油資（含偏遠加價）"
            value={`NT$${stats.fuel.toLocaleString("zh-TW")}`}
            icon={Fuel}
          />
          <StatCard
            label="額外工資（已核准）"
            value={`NT$${stats.claims.toLocaleString("zh-TW")}`}
            icon={Receipt}
            tone="success"
          />
          <StatCard
            label="待審核件數"
            value={String((pendingClaims ?? []).length)}
            hint={`金額 NT$${pendingAmount.toLocaleString("zh-TW")}`}
            icon={Clock}
            tone={(pendingClaims ?? []).length ? "warning" : "default"}
          />
        </div>
      )}

      {(pendingClaims ?? []).length ? (
        <SectionCard
          title="有額外工資等待審核"
          description={`共 ${(pendingClaims ?? []).length} 筆、NT$${pendingAmount.toLocaleString("zh-TW")}，核准後才會計入師傅的結算金額。`}
          actions={
            <Button size="sm" asChild>
              <Link to="/claims">
                前往審核
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        >
          <ul className="divide-y divide-border">
            {(pendingClaims ?? []).slice(0, 4).map((claim) => (
              <li
                key={claim.id}
                className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <Badge variant="warning">
                  <Clock className="h-3 w-3" />
                  待審核
                </Badge>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {claim.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {claim.technicians?.name ?? "—"}
                </span>
                <Money value={claimAmount(claim)} />
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      <SectionCard
        title={`${monthLabel(month)}最近場次`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/jobs">
              查看全部
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
        contentClassName="p-0 md:p-0"
      >
        {recentJobs.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={ClipboardList}
              title="本月還沒有場次"
              description="建立第一場記錄，系統就會開始自動計算工資與油資。"
              action={
                <Button asChild>
                  <Link to="/jobs/new">新增場次</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recentJobs.map((job) => {
              const breakdown = jobBreakdown(
                job,
                job.job_items,
                approvedClaimTotal(job.extra_claims),
              );
              return (
                <li key={job.id}>
                  <Link
                    to={`/jobs/${job.id}`}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 md:px-5"
                  >
                    <span className="num flex h-10 w-12 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                      {formatDateShort(job.job_date)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {job.customer_name || "未填客戶"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[job.technician_name, job.region_name]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <Money value={breakdown.total} size="md" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title="師傅"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/technicians">
              <Users className="h-4 w-4" />
              管理師傅
            </Link>
          </Button>
        }
      >
        {(technicians ?? []).length === 0 ? (
          <EmptyState
            icon={Users}
            title="尚未建立師傅"
            description="建立師傅並設定價格表後，就能開始記錄場次。"
            action={
              <Button asChild>
                <Link to="/technicians">新增師傅</Link>
              </Button>
            }
            className="border-0 bg-transparent py-6"
          />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {(technicians ?? []).map((technician) => (
              <li key={technician.id}>
                <Link
                  to={`/prices?technician=${technician.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {technician.name.slice(0, 1)}
                  </span>
                  {technician.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
};

export default Dashboard;