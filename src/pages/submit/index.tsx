import { HardHat, Unlink } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { LoadingState } from "@/components/common/loading-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  usePortalClaims,
  usePortalJobs,
  usePortalTechnician,
} from "@/hooks/use-portal";
import { ClaimForm } from "./claim-form";
import { EarningsSummary } from "./earnings-summary";
import { MyClaims } from "./my-claims";
import { MyJobs } from "./my-jobs";

const Submit = () => {
  const { token = "" } = useParams<{ token: string }>();
  const [tab, setTab] = useState("submit");
  const { data, isLoading, isError } = usePortalTechnician(token);
  const { data: jobs, isLoading: jobsLoading } = usePortalJobs(token);
  const { data: claims, isLoading: claimsLoading } = usePortalClaims(token);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <LoadingState label="正在載入你的資料…" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Unlink className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">
            這個連結無法使用
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            連結可能已失效或被重新產生。請向老闆索取新的專屬連結。
          </p>
        </div>
      </div>
    );
  }

  const pendingAmount = (claims ?? [])
    .filter((claim) => claim.status === "pending")
    .reduce((total, claim) => total + Number(claim.amount), 0);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-xl items-center gap-2.5 px-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <HardHat className="h-4 w-4" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-foreground">
              {data.technician.name}，你好
            </p>
            <p className="text-xs text-muted-foreground">安裝紀錄與額外工資</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl space-y-4 px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <EarningsSummary
          jobs={jobs ?? []}
          pendingAmount={pendingAmount}
          isLoading={jobsLoading}
        />

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="grid h-12 w-full grid-cols-3">
            <TabsTrigger value="submit" className="text-sm">
              回報
            </TabsTrigger>
            <TabsTrigger value="jobs" className="text-sm">
              安裝紀錄
            </TabsTrigger>
            <TabsTrigger value="claims" className="text-sm">
              額外工資
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submit" className="mt-0">
            <ClaimForm
              token={token}
              jobs={data.jobs}
              onSubmitted={() => setTab("claims")}
            />
          </TabsContent>

          <TabsContent value="jobs" className="mt-0">
            <MyJobs jobs={jobs ?? []} isLoading={jobsLoading} />
          </TabsContent>

          <TabsContent value="claims" className="mt-0">
            <MyClaims claims={claims ?? []} isLoading={claimsLoading} />
          </TabsContent>
        </Tabs>

        <p className="pt-2 text-center text-xs text-muted-foreground">
          送出後需等待老闆審核，核准後才會計入你的結算金額。
        </p>
      </main>
    </div>
  );
};

export default Submit;