import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "warning" | "success";
  className?: string;
};

const TONE_VALUE: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-foreground",
  primary: "text-primary",
  warning: "text-warning",
  success: "text-success",
};

const TONE_ICON: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
};

export const StatCard = ({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
}: StatCardProps) => (
  <div
    className={cn(
      "surface-stat rounded-lg border border-border p-4 shadow-e1",
      className,
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      {Icon ? (
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
            TONE_ICON[tone],
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      ) : null}
    </div>
    <p
      className={cn(
        "num mt-2 text-2xl font-semibold tracking-tight",
        TONE_VALUE[tone],
      )}
    >
      {value}
    </p>
    {hint ? (
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    ) : null}
  </div>
);