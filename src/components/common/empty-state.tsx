import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      "rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center",
      className,
    )}
  >
    <Icon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
    <p className="text-base font-semibold text-foreground">{title}</p>
    {description ? (
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
    ) : null}
    {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
  </div>
);