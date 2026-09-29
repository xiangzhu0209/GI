import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { InstallItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type PriceRowProps = {
  item: InstallItem;
  savedPrice: number | null;
  value: string;
  isSaving: boolean;
  onChange: (value: string) => void;
  onCommit: () => void;
};

export const PriceRow = ({
  item,
  savedPrice,
  value,
  isSaving,
  onChange,
  onCommit,
}: PriceRowProps) => {
  const hasPrice = savedPrice !== null;

  return (
    <li className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-muted/40 md:flex-row md:items-center md:gap-4 md:px-5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {item.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {item.category ?? "未分類"}
          {!item.is_active ? " · 已停用" : ""}
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
            placeholder="未設定"
            onChange={(event) => onChange(event.target.value)}
            onBlur={onCommit}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            className={cn(
              "num h-11 pl-10 text-right",
              !hasPrice && !value ? "border-dashed" : "",
            )}
            aria-label={`${item.name} 的安裝工資`}
          />
        </div>
      </div>

      <div className="flex items-center md:w-24 md:justify-end">
        {isSaving ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            儲存中
          </span>
        ) : hasPrice ? (
          <Badge variant="success">已設定</Badge>
        ) : (
          <Badge variant="warning">未設定</Badge>
        )}
      </div>
    </li>
  );
};