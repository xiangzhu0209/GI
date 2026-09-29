import { HardHat, PackageSearch, Search, Table2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useItems } from "@/hooks/use-items";
import {
  useClearPrice,
  useSavePrice,
  useTechnicianPrices,
} from "@/hooks/use-technician-prices";
import { useTechnicians } from "@/hooks/use-technicians";
import { CopyPricesDialog } from "./copy-prices-dialog";
import { FuelFeesPanel } from "./fuel-fees-panel";
import { PriceRow } from "./price-row";

const Prices = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: technicians, isLoading: techniciansLoading } = useTechnicians();
  const { data: items, isLoading: itemsLoading } = useItems(true);

  const requestedId = searchParams.get("technician") ?? "";
  const technicianId = requestedId || technicians?.[0]?.id || "";

  const { data: prices, isLoading: pricesLoading } = useTechnicianPrices(
    technicianId || null,
  );
  const savePrice = useSavePrice();
  const clearPrice = useClearPrice();

  const [draft, setDraft] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [copyOpen, setCopyOpen] = useState(false);

  useEffect(() => {
    setDraft({});
  }, [technicianId]);

  const savedPrices = useMemo(() => {
    const map: Record<string, number> = {};
    (prices ?? []).forEach((row) => {
      map[row.item_id] = Number(row.price);
    });
    return map;
  }, [prices]);

  const activeTechnician = technicians?.find(
    (technician) => technician.id === technicianId,
  );

  const visibleItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const list = items ?? [];
    if (!keyword) return list;
    return list.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        (item.category ?? "").toLowerCase().includes(keyword),
    );
  }, [items, search]);

  const configuredCount = (items ?? []).filter(
    (item) => savedPrices[item.id] !== undefined,
  ).length;

  const handleCommit = async (itemId: string) => {
    const raw = draft[itemId];
    if (raw === undefined) return;
    const trimmed = raw.trim();
    const saved = savedPrices[itemId];

    if (trimmed === "") {
      if (saved === undefined) return;
      setSavingItemId(itemId);
      try {
        await clearPrice.mutateAsync({
          technician_id: technicianId,
          item_id: itemId,
        });
        toast.success("已清除此項目的價格");
      } catch {
        toast.error("清除失敗，請稍後再試。");
      } finally {
        setSavingItemId(null);
      }
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("請輸入 0 以上的數字。");
      return;
    }
    if (saved !== undefined && Number(saved) === parsed) return;

    setSavingItemId(itemId);
    try {
      await savePrice.mutateAsync({
        technician_id: technicianId,
        item_id: itemId,
        price: parsed,
      });
    } catch {
      toast.error("儲存失敗，請稍後再試。");
    } finally {
      setSavingItemId(null);
    }
  };

  if (techniciansLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="師傅價目表" />
        <LoadingState />
      </div>
    );
  }

  if (!technicians || technicians.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="師傅價目表" />
        <EmptyState
          icon={HardHat}
          title="請先建立師傅"
          description="價目表是「師傅 × 安裝項目」的工資與「師傅 × 地區」的油資，需要至少一位師傅。"
          action={
            <Button asChild>
              <Link to="/technicians">前往師傅管理</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="師傅價目表"
        description="設定每位師傅的安裝工資與各地區油資，記錄場次時會自動帶入。"
        actions={
          <Button variant="outline" onClick={() => setCopyOpen(true)}>
            <Table2 className="h-4 w-4" />
            複製其他師傅價目
          </Button>
        }
      />

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-3 md:flex-row md:items-center">
        <div className="md:w-56">
          <Select
            value={technicianId}
            onValueChange={(value) =>
              setSearchParams({ technician: value }, { replace: true })
            }
          >
            <SelectTrigger className="h-11 bg-card">
              <SelectValue placeholder="選擇師傅" />
            </SelectTrigger>
            <SelectContent>
              {technicians.map((technician) => (
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
            placeholder="搜尋安裝項目名稱或分類"
            className="h-11 bg-card pl-9"
          />
        </div>

        <p className="num text-sm text-muted-foreground md:w-40 md:text-right">
          已設定 {configuredCount} / {(items ?? []).length} 項
        </p>
      </div>

      <FuelFeesPanel
        technicianId={technicianId}
        technicianName={activeTechnician?.name}
      />

      <SectionCard
        title={`${activeTechnician?.name ?? "師傅"} 的安裝項目工資`}
        description="直接在欄位輸入金額，離開欄位就會自動儲存；清空可取消設定。"
        contentClassName="p-0 md:p-0"
      >
        {itemsLoading || pricesLoading ? (
          <LoadingState />
        ) : !items || items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={PackageSearch}
              title="請先建立安裝項目"
              description="先建立項目清單，才能為師傅逐一設定工資。"
              action={
                <Button asChild>
                  <Link to="/settings">前往地區與項目</Link>
                </Button>
              }
            />
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={PackageSearch}
              title="找不到符合的項目"
              description="換個關鍵字試試，或清除搜尋條件。"
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {visibleItems.map((item) => (
              <PriceRow
                key={item.id}
                item={item}
                savedPrice={
                  savedPrices[item.id] === undefined
                    ? null
                    : savedPrices[item.id]
                }
                value={
                  draft[item.id] ??
                  (savedPrices[item.id] === undefined
                    ? ""
                    : String(savedPrices[item.id]))
                }
                isSaving={savingItemId === item.id}
                onChange={(value) =>
                  setDraft((previous) => ({ ...previous, [item.id]: value }))
                }
                onCommit={() => void handleCommit(item.id)}
              />
            ))}
          </ul>
        )}
      </SectionCard>

      <p className="text-xs text-muted-foreground">
        提示：價目隨時可以調整，既有場次的金額不會跟著變動。單一場次若臨時不收油資，可以在場次表單裡單獨設定。
      </p>

      <CopyPricesDialog
        open={copyOpen}
        onOpenChange={setCopyOpen}
        technicians={technicians}
        targetTechnicianId={technicianId}
      />
    </div>
  );
};

export default Prices;