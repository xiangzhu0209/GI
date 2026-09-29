import { Inbox } from "lucide-react";
import { ClaimCard } from "@/components/claims/claim-card";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { Money } from "@/components/common/money";
import type { PortalClaim } from "@/hooks/use-portal";
import { claimAmount } from "@/lib/calc";

export const MyClaims = ({
  claims,
  isLoading,
}: {
  claims: PortalClaim[];
  isLoading: boolean;
}) => {
  const approved = claims
    .filter((claim) => claim.status === "approved")
    .reduce((sum, claim) => sum + claimAmount(claim), 0);
  const pending = claims
    .filter((claim) => claim.status === "pending")
    .reduce((sum, claim) => sum + claimAmount(claim), 0);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">我的提交紀錄</h2>
        <div className="flex flex-wrap gap-4 text-right">
          <div>
            <p className="text-xs text-muted-foreground">待審核</p>
            <Money value={pending} size="md" className="text-warning" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">已核准</p>
            <Money value={approved} size="md" className="text-success" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : claims.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="還沒有提交紀錄"
          description="用上面的表單回報額外工資，送出後會顯示在這裡。"
        />
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              jobLabel={claim.job_label}
            />
          ))}
        </div>
      )}
    </section>
  );
};