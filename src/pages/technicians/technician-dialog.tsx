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
import { useSaveTechnician } from "@/hooks/use-technicians";
import type { Technician } from "@/lib/types";

type TechnicianDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technician: Technician | null;
};

export const TechnicianDialog = ({
  open,
  onOpenChange,
  technician,
}: TechnicianDialogProps) => {
  const saveTechnician = useSaveTechnician();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(technician?.name ?? "");
    setPhone(technician?.phone ?? "");
    setNote(technician?.note ?? "");
    setIsActive(technician?.is_active ?? true);
    setError(null);
  }, [open, technician]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("請填寫師傅姓名。");
      return;
    }
    try {
      await saveTechnician.mutateAsync({
        id: technician?.id,
        name,
        phone,
        note,
        is_active: isActive,
      });
      toast.success(technician ? "已更新師傅資料" : "已新增師傅");
      onOpenChange(false);
    } catch {
      setError("儲存失敗，請確認姓名沒有重複後再試一次。");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{technician ? "編輯師傅" : "新增師傅"}</DialogTitle>
          <DialogDescription>
            建立後系統會自動產生一組專屬提交連結。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="姓名" htmlFor="technician-name" required error={error ?? undefined}>
            <Input
              id="technician-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：陳師傅"
              className="h-11"
            />
          </Field>
          <Field label="聯絡電話" htmlFor="technician-phone">
            <Input
              id="technician-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="選填"
              className="h-11"
            />
          </Field>
          <Field label="備註" htmlFor="technician-note" help="例如專長或合作方式">
            <Input
              id="technician-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="選填"
              className="h-11"
            />
          </Field>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
            <Label htmlFor="technician-active" className="text-sm font-medium">
              啟用中
            </Label>
            <Switch
              id="technician-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={saveTechnician.isPending}
          >
            儲存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};