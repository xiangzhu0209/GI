import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  htmlFor?: string;
  help?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export const Field = ({
  label,
  htmlFor,
  help,
  error,
  required,
  children,
  className,
}: FieldProps) => (
  <div className={cn("space-y-1.5", className)}>
    <Label htmlFor={htmlFor} className="text-sm font-medium">
      {label}
      {required ? <span className="ml-0.5 text-destructive">*</span> : null}
    </Label>
    {children}
    {error ? (
      <p className="text-xs text-destructive">{error}</p>
    ) : help ? (
      <p className="text-xs text-muted-foreground">{help}</p>
    ) : null}
  </div>
);