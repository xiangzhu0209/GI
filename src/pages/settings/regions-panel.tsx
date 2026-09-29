import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState, LoadingState } from "@/components/common/loading-state";
import { Money } from "@/components/common/money";
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
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeleteRegion, useRegions } from "@/hooks/use-regions";
import type { Region } from "@/lib/types";
import { RegionDialog } from "./region-dialog";

export const RegionsPanel = () => {
  const { data, isLoading, isError } = useRegions();
  const deleteRegion = useDeleteRegion();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Region | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Region | null>(null);

  const regions = data ?? [];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRegion.mutateAsync(deleteTarget.id);
      toast.success("已刪除地區");
      setDeleteTarget(null);
    } catch {
      toast.error("刪除失敗，請稍後再試。");
    }
  };

  return (
    <>
      <SectionCard
        title="地區與預設油資"
        description="這裡是各地區的預設油資；個別師傅金額不同時，請到師傅價目表為他單獨設定。"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            新增地區
          </Button>
        }
        contentClassName="p-0 md:p-0"
      >
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <div className="p-4">
            <ErrorState message="無法載入地區資料。" />
          </div>
        ) : regions.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={MapPin}
              title="尚無地區資料"
              description="建立地區並設定油資金額，場次就能自動計算交通費。"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead className="h-10 text-xs uppercase tracking-wide">
                    地區
                  </TableHead>
                  <TableHead className="h-10 text-right text-xs uppercase tracking-wide">
                    預設油資
                  </TableHead>
                  <TableHead className="h-10 w-24 text-right text-xs uppercase tracking-wide">
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regions.map((region) => (
                  <TableRow key={region.id}>
                    <TableCell className="font-medium">
                      {region.name}
                    </TableCell>
                    <TableCell className="text-right">
                      <Money value={region.fuel_fee} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`編輯 ${region.name}`}
                          onClick={() => {
                            setEditing(region);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`刪除 ${region.name}`}
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(region)}
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

      <RegionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        region={editing}
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
              既有場次的金額已經記錄下來，不會受到影響。
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