import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const LoadingState = ({
  label = "載入中…",
  className,
}: {
  label?: string;
  className?: string;
}) => (
  <div
    className={cn(
      "flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground",
      className,
    )}
  >
    <Loader2 className="h-4 w-4 animate-spin" />
    {label}
  </div>
);

export const ErrorState = ({
  message = "載入資料時發生問題，請重新整理頁面。",
  className,
}: {
  message?: string;
  className?: string;
}) => (
  <div
    className={cn(
      "rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive",
      className,
    )}
  >
    {message}
  </div>
);