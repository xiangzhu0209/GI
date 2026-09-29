import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { claimPhotoUrl } from "@/lib/storage";

export const ClaimPhotos = ({
  paths,
  size = "md",
}: {
  paths: string[];
  size?: "sm" | "md";
}) => {
  const [active, setActive] = useState<string | null>(null);

  if (!paths.length) return null;

  const boxClass = size === "sm" ? "h-14 w-14" : "h-16 w-16";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {paths.map((path) => (
          <button
            key={path}
            type="button"
            onClick={() => setActive(path)}
            className="overflow-hidden rounded-md border border-border transition-opacity hover:opacity-80"
          >
            <img
              src={claimPhotoUrl(path)}
              alt="工作佐證照片"
              loading="lazy"
              className={`${boxClass} object-cover`}
            />
          </button>
        ))}
      </div>

      <Dialog
        open={Boolean(active)}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
      >
        <DialogContent className="max-w-2xl p-2" aria-describedby={undefined}>
          <DialogTitle className="sr-only">工作佐證照片</DialogTitle>
          {active ? (
            <img
              src={claimPhotoUrl(active)}
              alt="工作佐證照片"
              className="w-full rounded-md"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};