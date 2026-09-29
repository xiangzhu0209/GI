import { Copy } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCopyPrices } from "@/hooks/use-technician-prices";
import type { Technician } from "@/lib/types";

type CopyPricesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technicians: Technician[];
  targetTechnicianId: string;
};

export const CopyPricesDialog = ({
  open,
  onOpenChange,
  technicians,
  targetTechnicianId,
}: CopyPricesDialogProps) => {
  const copyPrices = useCopyPrices();
  const [sourceId, setSourceId] = useState<string>("");

  useEffect(() => {
    if (open) setSourceId("");
  }, [open]);

  const candidates = technicians.filter(
    (technician) => technician.id !== targetTechnicianId,
  );

  const handleCopy = async () => {
    if (!sourceId) return;
    try {
      const result = await copyPrices.mutateAsync({
        fromTechnicianId: sourceId,
        toTechnicianId: targetTechnicianId,
      });
      toast.success(
        result.prices || result.fuelFees
          ? `已複製 ${result.prices} 筆項目工資、${result.fuelFees} 筆地區油資`
          : "來源師傅尚未設定任何工資或油資",
      );
      onOpenChange(false);
    } catch {
      toast.error("複製失敗，請稍後再試。");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>複製其他師傅的價目表</DialogTitle>
          <DialogDescription>
            會複製來源師傅的項目工資與各地區油資，並覆蓋目前師傅已設定的部分，方便快速建立新師傅的價目。
          </DialogDescription>
        </DialogHeader>

        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            目前沒有其他師傅可以複製。
          </p>
        ) : (
          <Select value={sourceId} onValueChange={setSourceId}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="選擇來源師傅" />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((technician) => (
                <SelectItem key={technician.id} value={technician.id}>
                  {technician.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={() => void handleCopy()}
            disabled={!sourceId || copyPrices.isPending}
          >
            <Copy className="h-4 w-4" />
            複製價格
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};