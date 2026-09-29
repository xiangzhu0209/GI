import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

type MoneyProps = {
  value: unknown;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showSymbol?: boolean;
  /** 在深色底（例如漸層卡片）上使用時，覆寫 NT$ 前綴的顏色。 */
  symbolClassName?: string;
};

const SIZES: Record<NonNullable<MoneyProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-2xl",
};

export const Money = ({
  value,
  size = "sm",
  className,
  showSymbol = true,
  symbolClassName,
}: MoneyProps) => (
  <span
    className={cn("num font-semibold tracking-tight", SIZES[size], className)}
  >
    {showSymbol ? (
      <span
        className={cn(
          "text-[0.85em] font-normal text-muted-foreground",
          symbolClassName,
        )}
      >
        NT$
      </span>
    ) : null}
    {formatAmount(value)}
  </span>
);