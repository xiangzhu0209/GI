import {
  Calculator,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState, LoadingState } from "@/components/common/loading-state";
import { Money } from "@/components/common/money";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMonthJobs } from "@/hooks/use-jobs";
import { approvedClaimTotal, jobBreakdown } from "@/lib/calc";
import { downloadCsv } from "@/lib/csv";
import {
  currentMonthKey,
  formatDate,
  monthLabel,
  shiftMonthKey,
  todayISO,
} from "@/lib/date";
import type { JobWithDetails } from "@/lib/types";

type TechnicianSummary = {
  technicianId: string;
  technicianName: string;
  jobCount: number;
  labor: number;
  fuel: number;
  extraFuel: number;
  claims: number;
  pendingClaims: number;
  total: number;
  jobs: JobWithDetails[];
};

const Settlement = () => {
  const [month, setMonth] = useState(currentMonthKey());
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data, isLoading, isError } = useMonthJobs(month);

  const summaries = useMemo<TechnicianSummary[]>(() => {
    const map = new Map<string, TechnicianSummary>();
    (data ?? []).forEach((job) => {
      const claimsTotal = approvedClaimTotal(job.extra_claims);
      const breakdown = jobBreakdown(job, job.job_items, claimsTotal);
      const key = job.technician_id;
      const entry =
        map.get(key) ??
        ({
          technicianId: key,
          technicianName: job.technician_name ?? "未指定師傅",
          jobCount: 0,
          labor: 0,
          fuel: 0,
          extraFuel: 0,
          claims: 0,
          pendingClaims: 0,
          total: 0,
          jobs: [],
        } satisfies TechnicianSummary);

      entry.jobCount += 1;
      entry.labor += breakdown.labor;
      entry.fuel += breakdown.fuel;
      entry.extraFuel += breakdown.extraFuel;
      entry.claims += breakdown.claims;
      entry.pendingClaims += job.extra_claims.filter(
        (claim) => claim.status === "pending",
      ).length;
      entry.total += breakdown.total;
      entry.jobs.push(job);
      map.set(key, entry);
    });

    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [data]);

  const grandTotal = summaries.reduce((sum, row) => sum + row.total, 0);
  const pendingTotal = summaries.reduce(
    (sum, row) => sum + row.pendingClaims,
    0,
  );

  const handleExport = () => {
    const rows: (string | number)[][] = [
      ["期間", monthLabel(month)],
      [
        "師傅",
        "場次數",
        "安裝工資",
        "地區油資",
        "偏遠加價",
        "額外工資(已核准)",
        "應付總額",
      ],
      ...summaries.map((row) => [
        row.technicianName,
        row.jobCount,
        row.labor,
        row.fuel,
        row.extraFuel,
        row.claims,
        row.total,
      ]),
      [],
      ["合計", "", "", "", "", "", grandTotal],
    ];
    downloadCsv(`師傅結算_${month}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="月結統計"
        description="依月份彙總每位師傅的安裝工資、油資與已核准的額外工資。"
        actions={
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={summaries.length === 0}
          >
            <Download className="h-4 w-4" />
            匯出 CSV
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMonth(shiftMonthKey(month, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
          上個月
        </Button>
        <Input
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value || currentMonthKey())}
          className="num h-11 bg-card md:w-44"
          aria-label="選擇月份"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMonth(shiftMonthKey(month, 1))}
        >
          下個月
          <ChevronRight className="h-4 w-4" />
        </Button>
        {month !== currentMonthKey() ? (
          <Button variant="ghost" size="sm" onClick={() => setMonth(currentMonthKey())}>
            回到本月
          </Button>
        ) : null}
        <span className="ml-auto text-sm text-muted-foreground">
          {monthLabel(month)}
          {todayISO().startsWith(month) ? "（進行中）" : ""}
        </span>
      </div>

      <SectionCard
        title={`應付總額 ${monthLabel(month)}`}
        description={
          pendingTotal
            ? `另有 ${pendingTotal} 筆待審核的額外工資尚未計入`
            : "所有額外工資皆已審核完畢"
        }
        actions={<Money value={grandTotal} size="xl" className="text-primary" />}
        contentClassName="p-0 md:p-0"
      >
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <div className="p-4">
            <ErrorState message="無法載入結算資料。" />
          </div>
        ) : summaries.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Calculator}
              title="這個月還沒有場次"
              description="選擇其他月份，或先建立場次記錄。"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead className="h-10 w-10" />
                  <TableHead className="h-10 text-xs uppercase tracking-wide">
                    師傅
                  </TableHead>
                  <TableHead className="h-10 text-right text-xs uppercase tracking-wide">
                    場次
                  </TableHead>
                  <TableHead className="h-10 text-right text-xs uppercase tracking-wide">
                    安裝工資
                  </TableHead>
                  <TableHead className="h-10 text-right text-xs uppercase tracking-wide">
                    油資
                  </TableHead>
                  <TableHead className="h-10 text-right text-xs uppercase tracking-wide">
                    額外工資
                  </TableHead>
                  <TableHead className="h-10 text-right text-xs uppercase tracking-wide">
                    應付總額
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.map((row) => {
                  const isOpen = expanded === row.technicianId;
                  return (
                    <Fragment key={row.technicianId}>
                      <TableRow>
                        <TableCell className="pr-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`${isOpen ? "收合" : "展開"} ${row.technicianName} 的場次明細`}
                            onClick={() =>
                              setExpanded(isOpen ? null : row.technicianId)
                            }
                          >
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {row.technicianName}
                            {row.pendingClaims ? (
                              <Badge variant="warning">
                                {row.pendingClaims} 筆待審核
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="num text-right">
                          {row.jobCount}
                        </TableCell>
                        <TableCell className="text-right">
                          <Money value={row.labor} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Money value={row.fuel + row.extraFuel} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Money value={row.claims} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Money value={row.total} size="md" />
                        </TableCell>
                      </TableRow>

                      {isOpen ? (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30 p-0">
                            <ul className="divide-y divide-border/70">
                              {row.jobs.map((job) => {
                                const breakdown = jobBreakdown(
                                  job,
                                  job.job_items,
                                  approvedClaimTotal(job.extra_claims),
                                );
                                return (
                                  <li
                                    key={job.id}
                                    className="flex flex-wrap items-center gap-3 px-4 py-2.5"
                                  >
                                    <span className="num w-16 shrink-0 text-xs text-muted-foreground">
                                      {formatDate(job.job_date)}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-sm">
                                      {job.customer_name || "未填客戶"}
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        {job.job_items.length} 項
                                      </span>
                                    </span>
                                    <Money value={breakdown.total} />
                                  </li>
                                );
                              })}
                            </ul>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default Settlement;