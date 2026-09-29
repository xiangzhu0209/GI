import { BREAKDOWN_LABELS, type FeeBreakdown } from "@/lib/calc";
import { Money } from "@/components/common/money";
import { cn } from "@/lib/utils";

type FeeSummaryProps = {
  breakdown: FeeBreakdown;
  showClaims?: boolean;
  className?: string;
};

export const FeeSummary = ({
  breakdown,
  showClaims = true,
  className,
}: FeeSummaryProps) => {
  const rows: { label: string; value: number; muted?: boolean }[] = [
    { label: BREAKDOWN_LABELS.labor, value: breakdown.labor },
    { label: BREAKDOWN_LABELS.fuel, value: breakdown.fuel },
    ...(breakdown.extraFuel
      ? [{ label: BREAKDOWN_LABELS.extraFuel, value: breakdown.extraFuel }]
      : []),
    ...(showClaims
      ? [
          {
            label: BREAKDOWN_LABELS.claims,
            value: breakdown.claims,
            muted: breakdown.claims === 0,
          },
        ]
      : []),
  ];

  return (
    <div className={cn("rounded-lg border border-border bg-muted/40", className)}>
      <dl className="divide-y divide-border/70">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 px-4 py-2.5"
          >
            <dt
              className={cn(
                "text-sm",
                row.muted ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {row.label}
            </dt>
            <dd>
              <Money
                value={row.value}
                className={row.muted ? "text-muted-foreground" : undefined}
              />
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3">
        <span className="text-sm font-semibold text-foreground">
          {BREAKDOWN_LABELS.total}
        </span>
        <Money value={breakdown.total} size="xl" className="text-primary" />
      </div>
    </div>
  );
};