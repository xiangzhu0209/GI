import {
  HardHat,
  Link2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Table2,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CopyLinkDialog } from "@/components/common/copy-link-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState, LoadingState } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import { SectionCard } from "@/components/common/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  buildSubmitUrl,
  useCreateTechnicianToken,
  useDeleteTechnician,
  useTechnicians,
} from "@/hooks/use-technicians";
import type { Technician } from "@/lib/types";
import { TechnicianDialog } from "./technician-dialog";

const Technicians = () => {
  const { data, isLoading, isError } = useTechnicians(true);
  const deleteTechnician = useDeleteTechnician();
  const regenerateToken = useCreateTechnicianToken();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Technician | null>(null);
  const [shareTarget, setShareTarget] = useState<Technician | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Technician | null>(null);

  const technicians = data ?? [];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTechnician.mutateAsync(deleteTarget.id);
      toast.success("已刪除師傅");
      setDeleteTarget(null);
    } catch {
      toast.error("刪除失敗：這位師傅可能已有場次或提交紀錄。");
    }
  };

  const handleRegenerate = async (technician: Technician) => {
    try {
      const token = await regenerateToken.mutateAsync(technician.id);
      if (token) {
        toast.success("已重新產生連結，舊連結立即失效");
        setShareTarget({ ...technician, access_token: token });
      }
    } catch {
      toast.error("重新產生連結失敗，請稍後再試。");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="師傅管理"
        description="每一位師傅都有專屬的提交連結，不需要註冊帳號。"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            新增師傅
          </Button>
        }
      />

      <SectionCard
        title={`共 ${technicians.length} 位師傅`}
        contentClassName="p-0 md:p-0"
      >
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <div className="p-4">
            <ErrorState message="無法載入師傅名單。" />
          </div>
        ) : technicians.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={HardHat}
              title="尚無師傅資料"
              description="先建立師傅，才能設定價格表與記錄場次。"
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {technicians.map((technician) => (
              <li
                key={technician.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 md:px-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {technician.name.slice(0, 1)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {technician.name}
                    </span>
                    {!technician.is_active ? (
                      <Badge variant="secondary">未啟用</Badge>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {[technician.phone, technician.note]
                      .filter(Boolean)
                      .join(" · ") || "未填寫聯絡資訊"}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShareTarget(technician)}
                  >
                    <Link2 className="h-4 w-4" />
                    專屬連結
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link
                      to={`/prices?technician=${technician.id}`}
                      aria-label={`${technician.name} 的價格表`}
                    >
                      <Table2 className="h-4 w-4" />
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`${technician.name} 更多操作`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(technician);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        編輯資料
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => void handleRegenerate(technician)}
                      >
                        <RefreshCw className="h-4 w-4" />
                        重新產生連結
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(technician)}
                      >
                        <Trash2 className="h-4 w-4" />
                        刪除師傅
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <TechnicianDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        technician={editing}
      />

      <CopyLinkDialog
        open={Boolean(shareTarget)}
        onOpenChange={(open) => {
          if (!open) setShareTarget(null);
        }}
        title={`${shareTarget?.name ?? ""} 的專屬提交連結`}
        description="師傅用這個連結就能提交額外工資，不需要帳號密碼。"
        url={shareTarget ? buildSubmitUrl(shareTarget.access_token) : ""}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              刪除 {deleteTarget?.name ?? ""}？
            </AlertDialogTitle>
            <AlertDialogDescription>
              刪除後會一併移除他的價格表與提交紀錄，且無法復原。若只是暫時不合作，建議改為「未啟用」。
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
    </div>
  );
};

export default Technicians;