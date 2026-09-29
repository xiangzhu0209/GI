import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatAmount } from "@/lib/format";
import type { Region } from "@/lib/types";

type FuelFeeRowProps = {
  region: Region;
  /** 該師傅自訂的油資；null 表示沿用預設。 */
  savedFee: number | null;
  value: string;
  isSaving: boolean;
  onChange: (value: string) => void;
  onCommit: () => void;
};

export const FuelFeeRow = ({
  region,
  savedFee,
  value,
  isSaving,
  onChange,
  onCommit,
}: FuelFeeRowProps) => {
  const custom = savedFee !== null;

  return (
    <li className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-muted/40 md:flex-row md:items-center md:gap-4 md:px-5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {region.name}
        </p>
        <p className="num truncate text-xs text-muted-foreground">
          地區預設 NT${formatAmount(region.fuel_fee)}
        </p>
      </div>

      <div className="flex items-center gap-2 md:w-48">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            NT$
          </span>
          <Input
            inputMode="decimal"
            value={value}
            placeholder={formatAmount(region.fuel_fee)}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onCommit}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            className={`num h-11 pl-10 text-right${custom ? "" : " border-dashed"}`}
            aria-label={`${region.name} 的油資`}
          />
        </div>
      </div>

      <div className="flex items-center md:w-24 md:justify-end">
        {isSaving ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            儲存中
          </span>
        ) : custom ? (
          <Badge>自訂</Badge>
        ) : (
          <Badge variant="secondary">用預設</Badge>
        )}
      </div>
    </li>
  );
};