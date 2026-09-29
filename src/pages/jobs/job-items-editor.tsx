import { AlertTriangle, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Money } from "@/components/common/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { lineAmount } from "@/lib/calc";
import { formatQty } from "@/lib/format";
import type { InstallItem, JobItemDraft } from "@/lib/types";

type JobItemsEditorProps = {
  rows: JobItemDraft[];
  itemOptions: InstallItem[];
  priceLookup: Record<string, number>;
  hasTechnician: boolean;
  onChange: (rows: JobItemDraft[]) => void;
  onRefreshPrices: () => void;
};

const emptyRow = (): JobItemDraft => ({
  item_id: null,
  item_name: "",
  qty: 1,
  unit_price: 0,
  price_overridden: false,
  sort_order: 0,
});

export const JobItemsEditor = ({
  rows,
  itemOptions,
  priceLookup,
  hasTechnician,
  onChange,
  onRefreshPrices,
}: JobItemsEditorProps) => {
  const updateRow = (index: number, patch: Partial<JobItemDraft>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const handleItemChange = (index: number, itemId: string) => {
    const item = itemOptions.find((option) => option.id === itemId);
    const price = priceLookup[itemId];
    updateRow(index, {
      item_id: itemId,
      item_name: item?.name ?? "",
      ...(price !== undefined
        ? { unit_price: price, price_overridden: false }
        : {}),
    });
  };

  return (
    <div className="space-y-3">
      <div className="hidden grid-cols-12 gap-2 px-1 text-xs uppercase tracking-wide text-muted-foreground md:grid">
        <span className="col-span-5">安裝項目</span>
        <span className="col-span-2">數量</span>
        <span className="col-span-3">單價</span>
        <span className="col-span-1 text-right">小計</span>
        <span className="col-span-1" />
      </div>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          還沒有安裝項目，請按下方「新增項目」。
        </p>
      ) : null}

      <div className="space-y-2">
        {rows.map((row, index) => {
          const missingPrice =
            Boolean(row.item_id) && priceLookup[row.item_id as string] === undefined;

          return (
            <div
              key={row.id ?? `row-${index}`}
              className="grid grid-cols-12 items-start gap-2 rounded-md border border-border bg-card p-3 md:border-0 md:bg-transparent md:p-0"
            >
              <div className="col-span-12 md:col-span-5">
                <Select
                  value={row.item_id ?? ""}
                  onValueChange={(value) => handleItemChange(index, value)}
                >
                  <SelectTrigger
                    className="h-11"
                    aria-label={`第 ${index + 1} 列的安裝項目`}
                  >
                    <SelectValue placeholder="選擇品項" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-4 md:col-span-2">
                <Input
                  inputMode="decimal"
                  value={String(row.qty)}
                  placeholder="數量"
                  aria-label={`第 ${index + 1} 列的數量`}
                  onChange={(event) =>
                    updateRow(index, {
                      qty: Number(event.target.value.replace(/[^\d.]/g, "")) || 0,
                    })
                  }
                  className="num h-11 text-center"
                />
              </div>

              <div className="col-span-8 md:col-span-3">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    NT$
                  </span>
                  <Input
                    inputMode="decimal"
                    value={String(row.unit_price)}
                    placeholder="單價"
                    aria-label={`第 ${index + 1} 列的單價`}
                    onChange={(event) =>
                      updateRow(index, {
                        unit_price:
                          Number(event.target.value.replace(/[^\d.]/g, "")) || 0,
                        price_overridden: true,
                      })
                    }
                    className="num h-11 pl-10 text-right"
                  />
                </div>
              </div>

              <div className="col-span-10 flex items-center justify-end pt-3 md:col-span-1 md:pt-0">
                <Money value={lineAmount(row)} />
              </div>

              <div className="col-span-2 flex justify-end md:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`移除第 ${index + 1} 列`}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onChange(rows.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {missingPrice ? (
                <p className="col-span-12 flex items-start gap-1.5 text-xs text-warning">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {row.item_name}：這位師傅還沒設定價格
                  {hasTechnician ? "，請手動輸入單價。" : "。"}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 border-dashed md:flex-none"
          onClick={() => onChange([...rows, emptyRow()])}
        >
          <Plus className="h-4 w-4" />
          新增項目
        </Button>
        {rows.length ? (
          <Button type="button" variant="ghost" onClick={onRefreshPrices}>
            <RefreshCw className="h-4 w-4" />
            重新帶入價格
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        單價欄顯示為未設定時，代表該師傅的價格表還沒有這個項目。共{" "}
        <span className="num">{formatQty(rows.length)}</span> 個項目。
      </p>
    </div>
  );
};