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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSaveItem } from "@/hooks/use-items";
import type { InstallItem } from "@/lib/types";

type ItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InstallItem | null;
};

export const ItemDialog = ({ open, onOpenChange, item }: ItemDialogProps) => {
  const saveItem = useSaveItem();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? "");
    setCategory(item?.category ?? "");
    setIsActive(item?.is_active ?? true);
    setError(null);
  }, [open, item]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("請填寫項目名稱。");
      return;
    }
    try {
      await saveItem.mutateAsync({
        id: item?.id,
        name,
        category,
        is_active: isActive,
      });
      toast.success(item ? "已更新項目" : "已新增項目");
      onOpenChange(false);
    } catch {
      setError("儲存失敗，請確認項目名稱沒有重複。");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "編輯安裝項目" : "新增安裝項目"}</DialogTitle>
          <DialogDescription>
            項目建立後，就能在各師傅的價格表設定對應工資。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="項目名稱" htmlFor="item-name" required error={error ?? undefined}>
            <Input
              id="item-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：雙人床架"
              className="h-11"
            />
          </Field>
          <Field label="分類" htmlFor="item-category" help="選填，例如：寢具、櫃類">
            <Input
              id="item-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="選填"
              className="h-11"
            />
          </Field>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
            <Label htmlFor="item-active" className="text-sm font-medium">
              啟用中
            </Label>
            <Switch
              id="item-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={saveItem.isPending}>
            儲存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};