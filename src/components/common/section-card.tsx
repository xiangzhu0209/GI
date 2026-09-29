import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export const SectionCard = ({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: SectionCardProps) => (
  <section
    className={cn(
      "rounded-lg border border-border bg-card shadow-e1",
      className,
    )}
  >
    {title || actions ? (
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 md:px-5">
        <div className="min-w-0">
          {title ? (
            <h2 className="truncate text-sm font-semibold text-foreground">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </header>
    ) : null}
    <div className={cn("p-4 md:p-5", contentClassName)}>{children}</div>
  </section>
);