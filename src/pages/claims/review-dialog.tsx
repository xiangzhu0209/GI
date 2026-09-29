import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useReviewClaim } from "@/hooks/use-claims";
import { formatMoney } from "@/lib/format";
import type { ClaimStatus, ExtraClaim } from "@/lib/types";

type ReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claim: ExtraClaim | null;
  decision: Exclude<ClaimStatus, "pending">;
};

export const ReviewDialog = ({
  open,
  onOpenChange,
  claim,
  decision,
}: ReviewDialogProps) => {
  const reviewClaim = useReviewClaim();
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) setNote("");
  }, [open]);

  const approved = decision === "approved";

  const handleConfirm = async () => {
    if (!claim) return;
    try {
      await reviewClaim.mutateAsync({
        id: claim.id,
        status: decision,
        review_note: note,
      });
      toast.success(approved ? "已核准這筆額外工資" : "已駁回這筆額外工資");
      onOpenChange(false);
    } catch {
      toast.error("操作失敗，請稍後再試。");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{approved ? "核准額外工資" : "駁回額外工資"}</DialogTitle>
          <DialogDescription>
            {claim?.title} · {formatMoney(Number(claim?.amount ?? 0))}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="review-note" className="text-sm font-medium">
            {approved ? "審核備註（選填）" : "駁回原因（建議填寫）"}
          </Label>
          <Textarea
            id="review-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder={
              approved ? "例如：同意，計入本月結算" : "例如：金額與實際不符"
            }
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            variant={approved ? "success" : "destructive"}
            onClick={() => void handleConfirm()}
            disabled={reviewClaim.isPending}
          >
            {approved ? "確認核准" : "確認駁回"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};