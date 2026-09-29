import { AlertCircle, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Field } from "@/components/common/field";
import { SectionCard } from "@/components/common/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useItems } from "@/hooks/use-items";
import { useSaveJob } from "@/hooks/use-jobs";
import { useRegions } from "@/hooks/use-regions";
import { useAllFuelFees } from "@/hooks/use-technician-fuel-fees";
import { useAllPrices } from "@/hooks/use-technician-prices";
import { useTechnicians } from "@/hooks/use-technicians";
import { approvedClaimTotal, jobBreakdown, resolveFuelFee } from "@/lib/calc";
import { todayISO } from "@/lib/date";
import { toNumber } from "@/lib/format";
import type { JobDraft, JobItemDraft, JobWithDetails } from "@/lib/types";
import { FeeSummary } from "./fee-summary";
import { JobItemsEditor } from "./job-items-editor";

const NO_REGION = "__none";

const emptyDraft = (): JobDraft => ({
  job_date: todayISO(),
  customer_name: "",
  address: "",
  region_id: null,
  region_name: null,
  fuel_fee: 0,
  fuel_overridden: false,
  extra_fuel: 0,
  technician_id: "",
  technician_name: null,
  note: "",
  items: [],
});

const draftFromJob = (job: JobWithDetails): JobDraft => ({
  id: job.id,
  job_date: job.job_date,
  customer_name: job.customer_name ?? "",
  address: job.address ?? "",
  region_id: job.region_id,
  region_name: job.region_name,
  fuel_fee: toNumber(job.fuel_fee),
  fuel_overridden: job.fuel_overridden,
  extra_fuel: toNumber(job.extra_fuel),
  technician_id: job.technician_id,
  technician_name: job.technician_name,
  note: job.note ?? "",
  items: job.job_items.map((item) => ({
    id: item.id,
    item_id: item.item_id,
    item_name: item.item_name,
    qty: toNumber(item.qty),
    unit_price: toNumber(item.unit_price),
    price_overridden: item.price_overridden,
    sort_order: item.sort_order,
  })),
});

type JobFormProps = {
  job?: JobWithDetails | null;
  onSaved?: (jobId: string) => void;
  onCancel?: () => void;
};

export const JobForm = ({ job, onSaved, onCancel }: JobFormProps) => {
  const navigate = useNavigate();
  const { data: technicians } = useTechnicians();
  const { data: regions } = useRegions();
  const { data: items } = useItems();
  const { data: allPrices } = useAllPrices();
  const { data: allFuelFees } = useAllFuelFees();
  const saveJob = useSaveJob();

  const [draft, setDraft] = useState<JobDraft>(() =>
    job ? draftFromJob(job) : emptyDraft(),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(job ? draftFromJob(job) : emptyDraft());
    setError(null);
  }, [job]);

  const pricesByTechnician = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    (allPrices ?? []).forEach((row) => {
      map[row.technician_id] = map[row.technician_id] ?? {};
      map[row.technician_id][row.item_id] = toNumber(row.price);
    });
    return map;
  }, [allPrices]);

  const technicianPrices = pricesByTechnician[draft.technician_id] ?? {};

  const fuelByTechnician = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    (allFuelFees ?? []).forEach((row) => {
      map[row.technician_id] = map[row.technician_id] ?? {};
      map[row.technician_id][row.region_id] = toNumber(row.fuel_fee);
    });
    return map;
  }, [allFuelFees]);

  /** 師傅自訂油資優先，其次才是地區預設油資。 */
  const fuelFeeFor = (
    technicianId: string,
    regionId: string | null,
  ): number =>
    resolveFuelFee({
      regionId,
      customFee:
        technicianId && regionId
          ? fuelByTechnician[technicianId]?.[regionId]
          : undefined,
      defaultFee: regions?.find((region) => region.id === regionId)?.fuel_fee,
    });

  const approvedClaims = useMemo(
    () => approvedClaimTotal(job?.extra_claims ?? []),
    [job],
  );

  const breakdown = useMemo(
    () =>
      jobBreakdown(
        { fuel_fee: draft.fuel_fee, extra_fuel: draft.extra_fuel },
        draft.items,
        approvedClaims,
      ),
    [draft.fuel_fee, draft.extra_fuel, draft.items, approvedClaims],
  );

  const noFuel = draft.fuel_overridden && toNumber(draft.fuel_fee) === 0;

  const handleTechnicianChange = (technicianId: string) => {
    const technician = technicians?.find((entry) => entry.id === technicianId);
    const lookup = pricesByTechnician[technicianId] ?? {};
    setDraft((previous) => ({
      ...previous,
      technician_id: technicianId,
      technician_name: technician?.name ?? null,
      fuel_fee: previous.fuel_overridden
        ? previous.fuel_fee
        : fuelFeeFor(technicianId, previous.region_id),
      items: previous.items.map((item) =>
        item.price_overridden || !item.item_id || lookup[item.item_id] === undefined
          ? item
          : { ...item, unit_price: lookup[item.item_id] },
      ),
    }));
  };

  const handleRegionChange = (value: string) => {
    if (value === NO_REGION) {
      setDraft((previous) => ({
        ...previous,
        region_id: null,
        region_name: null,
        fuel_fee: previous.fuel_overridden ? previous.fuel_fee : 0,
      }));
      return;
    }
    const region = regions?.find((entry) => entry.id === value);
    setDraft((previous) => ({
      ...previous,
      region_id: value,
      region_name: region?.name ?? null,
      fuel_fee: previous.fuel_overridden
        ? previous.fuel_fee
        : fuelFeeFor(previous.technician_id, value),
    }));
  };

  const handleNoFuelChange = (waived: boolean) => {
    setDraft((previous) => ({
      ...previous,
      fuel_overridden: waived,
      fuel_fee: waived
        ? 0
        : fuelFeeFor(previous.technician_id, previous.region_id),
    }));
  };

  const handleRefreshPrices = () => {
    setDraft((previous) => ({
      ...previous,
      items: previous.items.map((item) => {
        if (item.price_overridden || !item.item_id) return item;
        const price = technicianPrices[item.item_id];
        return price === undefined ? item : { ...item, unit_price: price };
      }),
    }));
    toast.success("已重新帶入未手動修改的單價");
  };

  const handleSave = async () => {
    if (!draft.technician_id) {
      setError("請選擇負責的師傅。");
      return;
    }
    if (draft.items.length === 0) {
      setError("請至少加入一個安裝項目。");
      return;
    }
    if (draft.items.some((item) => !item.item_id)) {
      setError("有明細列還沒選擇安裝項目。");
      return;
    }
    setError(null);
    try {
      const savedId = await saveJob.mutateAsync(draft);
      toast.success(job ? "已更新場次" : "已建立場次");
      if (onSaved) onSaved(savedId);
      else navigate(`/jobs/${savedId}`, { replace: true });
    } catch {
      setError("儲存失敗，請稍後再試。");
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="場次資訊"
        description="選擇地區會自動帶入該地區的油資，選擇師傅會自動帶入他的工資。"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="施工日期" htmlFor="job-date" required>
            <Input
              id="job-date"
              type="date"
              value={draft.job_date}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  job_date: event.target.value,
                }))
              }
              className="h-11"
            />
          </Field>

          <Field label="負責師傅" htmlFor="job-technician" required>
            <Select
              value={draft.technician_id || ""}
              onValueChange={handleTechnicianChange}
            >
              <SelectTrigger id="job-technician" className="h-11">
                <SelectValue placeholder="選擇師傅" />
              </SelectTrigger>
              <SelectContent>
                {(technicians ?? []).map((technician) => (
                  <SelectItem key={technician.id} value={technician.id}>
                    {technician.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="客戶名稱" htmlFor="job-customer">
            <Input
              id="job-customer"
              value={draft.customer_name}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  customer_name: event.target.value,
                }))
              }
              placeholder="例如：王先生"
              className="h-11"
            />
          </Field>

          <Field label="客戶地址" htmlFor="job-address">
            <Input
              id="job-address"
              value={draft.address}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  address: event.target.value,
                }))
              }
              placeholder="選填"
              className="h-11"
            />
          </Field>

          <Field
            label="地區"
            htmlFor="job-region"
            help="選擇地區後會自動帶入油資"
          >
            <Select
              value={draft.region_id ?? NO_REGION}
              onValueChange={handleRegionChange}
            >
              <SelectTrigger id="job-region" className="h-11">
                <SelectValue placeholder="選擇地區" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_REGION}>不指定（油資 0）</SelectItem>
                {(regions ?? []).map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}（NT$
                    {toNumber(fuelFeeFor(draft.technician_id, region.id))}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label="油資（NT$）"
            htmlFor="job-fuel"
            help={
              noFuel
                ? "本場不收油資"
                : draft.fuel_overridden
                  ? "已手動指定，不會隨師傅或地區變動"
                  : draft.region_id
                    ? "自動帶入師傅在此地區的油資"
                    : "選擇地區後自動帶入"
            }
          >
            <div className="space-y-2">
              <Input
                id="job-fuel"
                inputMode="decimal"
                value={String(draft.fuel_fee)}
                disabled={noFuel}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    fuel_fee:
                      Number(event.target.value.replace(/[^\d.]/g, "")) || 0,
                    fuel_overridden: true,
                  }))
                }
                className="num h-11"
              />
              <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                <Label htmlFor="job-no-fuel" className="text-sm font-normal">
                  本場不收油資
                </Label>
                <Switch
                  id="job-no-fuel"
                  checked={noFuel}
                  onCheckedChange={handleNoFuelChange}
                />
              </div>
            </div>
          </Field>

          <Field
            label="偏遠加價（NT$）"
            htmlFor="job-extra-fuel"
            help="偏遠地區或特殊狀況可另外加計，不需填 0"
          >
            <Input
              id="job-extra-fuel"
              inputMode="decimal"
              value={String(draft.extra_fuel)}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  extra_fuel:
                    Number(event.target.value.replace(/[^\d.]/g, "")) || 0,
                }))
              }
              className="num h-11"
            />
          </Field>

          <Field label="備註" htmlFor="job-note" className="md:col-span-2">
            <Input
              id="job-note"
              value={draft.note}
              onChange={(event) =>
                setDraft((previous) => ({ ...previous, note: event.target.value }))
              }
              placeholder="選填，例如電梯狀況或特殊要求"
              className="h-11"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="安裝項目明細"
        description="單價會自動從師傅價格表帶入，可以手動調整。"
      >
        <JobItemsEditor
          rows={draft.items}
          itemOptions={items ?? []}
          priceLookup={technicianPrices}
          hasTechnician={Boolean(draft.technician_id)}
          onChange={(rows: JobItemDraft[]) =>
            setDraft((previous) => ({ ...previous, items: rows }))
          }
          onRefreshPrices={handleRefreshPrices}
        />
      </SectionCard>

      <FeeSummary breakdown={breakdown} />

      {error ? (
        <p className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="lg"
          onClick={() => void handleSave()}
          disabled={saveJob.isPending}
        >
          <Save className="h-4 w-4" />
          {job ? "儲存變更" : "建立場次"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => (onCancel ? onCancel() : navigate("/jobs"))}
        >
          <X className="h-4 w-4" />
          取消
        </Button>
      </div>
    </div>
  );
};