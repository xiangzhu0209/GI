import {
  ArrowLeft,
  ClipboardList,
  Pencil,
  Receipt,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ClaimCard } from "@/components/claims/claim-card";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState, LoadingState } from "@/components/common/loading-state";
import { Money } from "@/components/common/money";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeleteJob, useJob } from "@/hooks/use-jobs";
import { approvedClaimTotal, jobBreakdown, lineAmount } from "@/lib/calc";
import { formatDate } from "@/lib/date";
import { formatQty, toNumber } from "@/lib/format";
import { JobForm } from "../job-form";
import { FeeSummary } from "../fee-summary";

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading, isError } = useJob(id);
  const deleteJob = useDeleteJob();

  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="場次明細" />
        <LoadingState />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="場次明細" />
        <ErrorState message="無法載入這場次的資料。" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-6">
        <PageHeader title="場次明細" />
        <EmptyState
          icon={ClipboardList}
          title="找不到這場次"
          description="這場次可能已經被刪除。"
          action={
            <Button asChild>
              <Link to="/jobs">回到場次列表</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const claimsTotal = approvedClaimTotal(job.extra_claims);
  const breakdown = jobBreakdown(job, job.job_items, claimsTotal);

  const handleDelete = async () => {
    try {
      await deleteJob.mutateAsync(job.id);
      toast.success("已刪除場次");
      navigate("/jobs", { replace: true });
    } catch {
      toast.error("刪除失敗，請稍後再試。");
    }
  };

  const infoRows: { label: string; value: string }[] = [
    { label: "施工日期", value: formatDate(job.job_date) },
    { label: "負責師傅", value: job.technician_name ?? "—" },
    { label: "地區", value: job.region_name ?? "未指定" },
    {
      label: "油資",
      value:
        job.fuel_overridden && toNumber(job.fuel_fee) === 0
          ? "本場不收油資"
          : `NT$${toNumber(job.fuel_fee)}`,
    },
    {
      label: "偏遠加價",
      value: toNumber(job.extra_fuel) ? `NT$${toNumber(job.extra_fuel)}` : "—",
    },
    { label: "客戶地址", value: job.address || "—" },
    { label: "備註", value: job.note || "—" },
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
        <Link to="/jobs">
          <ArrowLeft className="h-4 w-4" />
          回到場次列表
        </Link>
      </Button>

      <PageHeader
        title={job.customer_name || "未填客戶"}
        description={`${formatDate(job.job_date)} · ${job.technician_name ?? "未指定師傅"}`}
        actions={
          editing ? null : (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4" />
                編輯
              </Button>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                刪除
              </Button>
            </>
          )
        }
      />

      {editing ? (
        <JobForm
          job={job}
          onSaved={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <SectionCard title="場次資訊">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {infoRows.map((row) => (
                <div key={row.label} className="space-y-0.5">
                  <dt className="text-xs text-muted-foreground">
                    {row.label}
                  </dt>
                  <dd className="text-sm text-foreground">{row.value}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>

          <SectionCard
            title="安裝項目明細"
            description={`共 ${job.job_items.length} 個項目`}
            contentClassName="p-0 md:p-0"
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60">
                    <TableHead className="h-10 text-xs uppercase tracking-wide">
                      項目
                    </TableHead>
                    <TableHead className="h-10 text-right text-xs uppercase tracking-wide">
                      數量
                    </TableHead>
                    <TableHead className="h-10 text-right text-xs uppercase tracking-wide">
                      單價
                    </TableHead>
                    <TableHead className="h-10 text-right text-xs uppercase tracking-wide">
                      小計
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {job.job_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.item_name}
                      </TableCell>
                      <TableCell className="num text-right">
                        {formatQty(item.qty)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Money value={item.unit_price} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money value={lineAmount(item)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>

          <FeeSummary breakdown={breakdown} />

          <SectionCard
            title="額外工資"
            description="師傅自行提交的修改、拆卸與其他工資。"
            actions={
              <Button variant="outline" size="sm" asChild>
                <Link to="/claims">
                  <Receipt className="h-4 w-4" />
                  前往審核
                </Link>
              </Button>
            }
          >
            {job.extra_claims.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="這場還沒有額外工資紀錄"
                description="師傅用專屬連結提交後，會出現在這裡等待審核。"
                className="border-0 bg-transparent py-6"
              />
            ) : (
              <div className="space-y-3">
                {job.extra_claims.map((claim) => (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
                    technicianName={job.technician_name}
                    jobLabel={job.customer_name}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除這場次？</AlertDialogTitle>
            <AlertDialogDescription>
              明細會一併刪除，師傅的額外工資紀錄會保留下來但不再連結到這場次。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default JobDetail;