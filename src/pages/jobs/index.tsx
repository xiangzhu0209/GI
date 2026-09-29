import { ClipboardList, Clock, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState, LoadingState } from "@/components/common/loading-state";
import { Money } from "@/components/common/money";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMonthJobs } from "@/hooks/use-jobs";
import { useTechnicians } from "@/hooks/use-technicians";
import { approvedClaimTotal, jobBreakdown } from "@/lib/calc";
import { currentMonthKey, formatDateShort, monthLabel } from "@/lib/date";
import type { JobWithDetails } from "@/lib/types";

const ALL_TECHNICIANS = "__all";

const Jobs = () => {
  const [month, setMonth] = useState(currentMonthKey());
  const [technicianId, setTechnicianId] = useState(ALL_TECHNICIANS);
  const [search, setSearch] = useState("");

  const { data: technicians } = useTechnicians();
  const { data, isLoading, isError } = useMonthJobs(month);

  const jobs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return (data ?? []).filter((job) => {
      if (technicianId !== ALL_TECHNICIANS && job.technician_id !== technicianId) {
        return false;
      }
      if (!keyword) return true;
      return (
        (job.customer_name ?? "").toLowerCase().includes(keyword) ||
        (job.address ?? "").toLowerCase().includes(keyword) ||
        (job.technician_name ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [data, technicianId, search]);

  const rows = jobs.map((job: JobWithDetails) => {
    const claims = approvedClaimTotal(job.extra_claims);
    const pending = job.extra_claims.filter(
      (claim) => claim.status === "pending",
    ).length;
    return { job, total: jobBreakdown(job, job.job_items, claims).total, pending };
  });

  const monthTotal = rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="場次記錄"
        description="每一場的安裝工資、油資與已核准的額外工資。"
        actions={
          <Button asChild>
            <Link to="/jobs/new">
              <Plus className="h-4 w-4" />
              新增場次
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-3 md:flex-row md:items-center">
        <Input
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value || currentMonthKey())}
          className="num h-11 bg-card md:w-44"
          aria-label="選擇月份"
        />
        <div className="md:w-52">
          <Select value={technicianId} onValueChange={setTechnicianId}>
            <SelectTrigger className="h-11 bg-card">
              <SelectValue placeholder="全部師傅" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_TECHNICIANS}>全部師傅</SelectItem>
              {(technicians ?? []).map((technician) => (
                <SelectItem key={technician.id} value={technician.id}>
                  {technician.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜尋客戶、地址或師傅"
            className="h-11 bg-card pl-9"
          />
        </div>
      </div>

      <SectionCard
        title={`${monthLabel(month)} · ${rows.length} 場`}
        actions={
          <span className="num text-sm text-muted-foreground">
            合計 <Money value={monthTotal} size="md" />
          </span>
        }
        contentClassName="p-0 md:p-0"
      >
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <div className="p-4">
            <ErrorState message="無法載入場次資料。" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={ClipboardList}
              title="這個月還沒有場次"
              description="建立場次後，系統會自動計算安裝工資、油資與額外工資。"
              action={
                <Button asChild>
                  <Link to="/jobs/new">新增第一場</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map(({ job, total, pending }) => (
              <li key={job.id}>
                <Link
                  to={`/jobs/${job.id}`}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 md:px-5"
                >
                  <span className="num flex h-10 w-12 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                    {formatDateShort(job.job_date)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {job.customer_name || "未填客戶"}
                      </span>
                      {pending ? (
                        <Badge variant="warning">
                          <Clock className="h-3 w-3" />
                          {pending} 筆待審核
                        </Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {[
                        job.technician_name,
                        job.region_name,
                        `${job.job_items.length} 個項目`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>

                  <Money value={total} size="md" className="shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
};

export default Jobs;