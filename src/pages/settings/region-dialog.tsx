import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/common/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSaveRegion } from "@/hooks/use-regions";
import type { Region } from "@/lib/types";

type RegionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  region: Region | null;
};

export const RegionDialog = ({
  open,
  onOpenChange,
  region,
}: RegionDialogProps) => {
  const saveRegion = useSaveRegion();
  const [name, setName] = useState("");
  const [fuelFee, setFuelFee] = useState("0");
  const [sortOrder, setSortOrder] = useState("0");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(region?.name ?? "");
    setFuelFee(String(region?.fuel_fee ?? 0));
    setSortOrder(String(region?.sort_order ?? 0));
    setError(null);
  }, [open, region]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("請填寫地區名稱。");
      return;
    }
    if (Number.isNaN(Number(fuelFee))) {
      setError("油資金額請填數字。");
      return;
    }
    try {
      await saveRegion.mutateAsync({
        id: region?.id,
        name,
        fuel_fee: Number(fuelFee || 0),
        sort_order: Number(sortOrder || 0),
      });
      toast.success(region ? "已更新地區" : "已新增地區");
      onOpenChange(false);
    } catch {
      setError("儲存失敗，請確認地區名稱沒有重複。");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{region ? "編輯地區" : "新增地區"}</DialogTitle>
          <DialogDescription>
            這裡設定的油資是「預設值」。個別師傅若金額不同，請到師傅價目表為他單獨設定。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="地區名稱" htmlFor="region-name" required error={error ?? undefined}>
            <Input
              id="region-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：台北市、新北市"
              className="h-11"
            />
          </Field>
          <Field label="預設油資（NT$）" htmlFor="region-fee" required>
            <Input
              id="region-fee"
              inputMode="decimal"
              value={fuelFee}
              onChange={(event) => setFuelFee(event.target.value)}
              className="h-11 num"
            />
          </Field>
          <Field
            label="排序"
            htmlFor="region-sort"
            help="數字越小排在越前面"
          >
            <Input
              id="region-sort"
              inputMode="numeric"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="h-11 num"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={saveRegion.isPending}
          >
            儲存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};