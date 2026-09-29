import { MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { SectionCard } from "@/components/common/section-card";
import { Button } from "@/components/ui/button";
import { useRegions } from "@/hooks/use-regions";
import {
  useClearFuelFee,
  useSaveFuelFee,
  useTechnicianFuelFees,
} from "@/hooks/use-technician-fuel-fees";
import { FuelFeeRow } from "./fuel-fee-row";

export const FuelFeesPanel = ({
  technicianId,
  technicianName,
}: {
  technicianId: string;
  technicianName?: string;
}) => {
  const { data: regions, isLoading: regionsLoading } = useRegions();
  const { data: fuelFees, isLoading: feesLoading } =
    useTechnicianFuelFees(technicianId);
  const saveFuelFee = useSaveFuelFee();
  const clearFuelFee = useClearFuelFee();

  const [draft, setDraft] = useState<Record<string, string>>({});
  const [savingRegionId, setSavingRegionId] = useState<string | null>(null);

  useEffect(() => {
    setDraft({});
  }, [technicianId]);

  const savedFees = useMemo(() => {
    const map: Record<string, number> = {};
    (fuelFees ?? []).forEach((row) => {
      map[row.region_id] = Number(row.fuel_fee);
    });
    return map;
  }, [fuelFees]);

  const customCount = Object.keys(savedFees).length;

  const handleCommit = async (regionId: string) => {
    const raw = draft[regionId];
    if (raw === undefined) return;
    const trimmed = raw.trim();
    const saved = savedFees[regionId];

    if (trimmed === "") {
      if (saved === undefined) return;
      setSavingRegionId(regionId);
      try {
        await clearFuelFee.mutateAsync({
          technician_id: technicianId,
          region_id: regionId,
        });
        toast.success("已改回地區預設油資");
      } catch {
        toast.error("清除失敗，請稍後再試。");
      } finally {
        setSavingRegionId(null);
      }
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("請輸入 0 以上的數字。");
      return;
    }
    if (saved !== undefined && Number(saved) === parsed) return;

    setSavingRegionId(regionId);
    try {
      await saveFuelFee.mutateAsync({
        technician_id: technicianId,
        region_id: regionId,
        fuel_fee: parsed,
      });
    } catch {
      toast.error("儲存失敗，請稍後再試。");
    } finally {
      setSavingRegionId(null);
    }
  };

  if (regionsLoading || feesLoading) {
    return (
      <SectionCard title="各地區油資">
        <LoadingState />
      </SectionCard>
    );
  }

  if (!regions || regions.length === 0) {
    return (
      <SectionCard title="各地區油資">
        <EmptyState
          icon={MapPin}
          title="尚無地區資料"
          description="先建立地區與預設油資，就能為這位師傅設定不同金額。"
          action={
            <Button asChild>
              <Link to="/settings">前往地區與項目</Link>
            </Button>
          }
          className="border-0 bg-transparent py-6"
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={`${technicianName ?? "師傅"} 的各地區油資`}
      description="留空＝沿用該地區的預設油資；填入金額則這位師傅跑該地區時以此計算。"
      actions={
        <span className="num text-sm text-muted-foreground">
          {customCount} / {regions.length} 個地區自訂
        </span>
      }
      contentClassName="p-0 md:p-0"
    >
      <ul className="divide-y divide-border">
        {regions.map((region) => (
          <FuelFeeRow
            key={region.id}
            region={region}
            savedFee={
              savedFees[region.id] === undefined ? null : savedFees[region.id]
            }
            value={
              draft[region.id] ??
              (savedFees[region.id] === undefined
                ? ""
                : String(savedFees[region.id]))
            }
            isSaving={savingRegionId === region.id}
            onChange={(value) =>
              setDraft((previous) => ({ ...previous, [region.id]: value }))
            }
            onCommit={() => void handleCommit(region.id)}
          />
        ))}
      </ul>
    </SectionCard>
  );
};