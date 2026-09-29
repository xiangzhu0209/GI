import { PackageSearch, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState, LoadingState } from "@/components/common/loading-state";
import { SectionCard } from "@/components/common/section-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeleteItem, useItems } from "@/hooks/use-items";
import type { InstallItem } from "@/lib/types";
import { ItemDialog } from "./item-dialog";

export const ItemsPanel = () => {
  const { data, isLoading, isError } = useItems(true);
  const deleteItem = useDeleteItem();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InstallItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InstallItem | null>(null);

  const items = data ?? [];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem.mutateAsync(deleteTarget.id);
      toast.success("已刪除項目");
      setDeleteTarget(null);
    } catch {
      toast.error("刪除失敗，請稍後再試。");
    }
  };

  return (
    <>
      <SectionCard
        title="安裝項目"
        description="列出你提供的安裝服務，價格表會依這些項目逐一設定。"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            新增項目
          </Button>
        }
        contentClassName="p-0 md:p-0"
      >
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <div className="p-4">
            <ErrorState message="無法載入項目資料。" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={PackageSearch}
              title="尚無安裝項目"
              description="先建立項目，例如雙人床架、衣櫃、電視壁掛。"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead className="h-10 text-xs uppercase tracking-wide">
                    項目
                  </TableHead>
                  <TableHead className="h-10 text-xs uppercase tracking-wide">
                    分類
                  </TableHead>
                  <TableHead className="h-10 text-xs uppercase tracking-wide">
                    狀態
                  </TableHead>
                  <TableHead className="h-10 w-24 text-right text-xs uppercase tracking-wide">
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.category ?? "—"}
                    </TableCell>
                    <TableCell>
                      {item.is_active ? (
                        <Badge variant="success">啟用中</Badge>
                      ) : (
                        <Badge variant="secondary">未啟用</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`編輯 ${item.name}`}
                          onClick={() => {
                            setEditing(item);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`刪除 ${item.name}`}
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <ItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除 {deleteTarget?.name ?? ""}？</AlertDialogTitle>
            <AlertDialogDescription>
              會一併移除各師傅價格表中的這個項目，既有場次的金額不受影響。若只是暫時不提供，建議改為「未啟用」。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};