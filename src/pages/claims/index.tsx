import { Check, Inbox, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ClaimCard } from "@/components/claims/claim-card";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState, LoadingState } from "@/components/common/loading-state";
import { Money } from "@/components/common/money";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClaims } from "@/hooks/use-claims";
import { claimAmount } from "@/lib/calc";
import type { ClaimStatus, ClaimWithRefs } from "@/lib/types";
import { ReviewDialog } from "./review-dialog";

type TabValue = ClaimStatus | "all";

const TABS: { value: TabValue; label: string }[] = [
  { value: "pending", label: "待審核" },
  { value: "approved", label: "已核准" },
  { value: "rejected", label: "已駁回" },
  { value: "all", label: "全部" },
];

const Claims = () => {
  const [tab, setTab] = useState<TabValue>("pending");
  const { data, isLoading, isError } = useClaims("all");

  const [review, setReview] = useState<{
    claim: ClaimWithRefs;
    decision: Exclude<ClaimStatus, "pending">;
  } | null>(null);

  const claims = useMemo(() => data ?? [], [data]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      all: claims.length,
    };
    claims.forEach((claim) => {
      map[claim.status] = (map[claim.status] ?? 0) + 1;
    });
    return map;
  }, [claims]);

  const pendingAmount = useMemo(
    () =>
      claims
        .filter((claim) => claim.status === "pending")
        .reduce((sum, claim) => sum + claimAmount(claim), 0),
    [claims],
  );

  const visible = useMemo(
    () => (tab === "all" ? claims : claims.filter((claim) => claim.status === tab)),
    [claims, tab],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="額外工資審核"
        description="師傅提交的修改、拆卸與其他工資，核准後才會計入結算。"
        actions={
          <div className="rounded-lg border border-border bg-card px-4 py-2 text-right shadow-e1">
            <p className="text-xs text-muted-foreground">待審核金額</p>
            <Money value={pendingAmount} size="lg" className="text-warning" />
          </div>
        }
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value as TabValue)}>
        <TabsList className="w-full justify-start overflow-x-auto md:w-auto">
          {TABS.map((entry) => (
            <TabsTrigger key={entry.value} value={entry.value}>
              {entry.label}
              <span className="num ml-1.5 text-xs text-muted-foreground">
                {counts[entry.value] ?? 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message="無法載入提交紀錄。" />
      ) : visible.length === 0 ? (
        <SectionCard contentClassName="p-4">
          <EmptyState
            icon={Inbox}
            title={tab === "pending" ? "目前沒有待審核的項目" : "這裡還沒有紀錄"}
            description="師傅用專屬連結提交額外工資後，會出現在待審核清單。"
            className="border-0 bg-transparent"
          />
        </SectionCard>
      ) : (
        <div className="space-y-3">
          {visible.map((claim) => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              technicianName={claim.technicians?.name}
              jobLabel={claim.jobs?.customer_name ?? claim.job_label}
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  {claim.status !== "approved" ? (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() =>
                        setReview({ claim, decision: "approved" })
                      }
                    >
                      <Check className="h-4 w-4" />
                      核准
                    </Button>
                  ) : null}
                  {claim.status !== "rejected" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setReview({ claim, decision: "rejected" })
                      }
                    >
                      <X className="h-4 w-4" />
                      駁回
                    </Button>
                  ) : null}
                </div>
              }
            />
          ))}
        </div>
      )}

      <ReviewDialog
        open={Boolean(review)}
        onOpenChange={(open) => {
          if (!open) setReview(null);
        }}
        claim={review?.claim ?? null}
        decision={review?.decision ?? "approved"}
      />
    </div>
  );
};

export default Claims;