import { AlertCircle, Camera, Loader2, Send, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Field } from "@/components/common/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  portalErrorMessage,
  useSubmitPortalClaim,
  type PortalJob,
} from "@/hooks/use-portal";
import { CLAIM_TYPES } from "@/lib/claim-meta";
import { todayISO } from "@/lib/date";
import { claimPhotoUrl, uploadClaimPhoto } from "@/lib/storage";
import type { ClaimType } from "@/lib/types";
import { cn } from "@/lib/utils";

const OTHER_JOB = "__other";
const MAX_PHOTOS = 4;
const QUICK_AMOUNTS = [500, 1000, 1500, 2000];

type ClaimFormProps = {
  token: string;
  jobs: PortalJob[];
  onSubmitted?: () => void;
};

export const ClaimForm = ({ token, jobs, onSubmitted }: ClaimFormProps) => {
  const submitClaim = useSubmitPortalClaim(token);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [jobId, setJobId] = useState<string>(OTHER_JOB);
  const [customLabel, setCustomLabel] = useState("");
  const [claimType, setClaimType] = useState<ClaimType>("modify");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [workDate, setWorkDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleRequired = claimType === "other";

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
    if (!selected.length) {
      toast.error(`最多只能上傳 ${MAX_PHOTOS} 張照片`);
      return;
    }
    setUploading(true);
    try {
      const paths = await Promise.all(
        selected.map((file) => uploadClaimPhoto(file)),
      );
      setPhotos((previous) => [...previous, ...paths]);
    } catch {
      toast.error("照片上傳失敗，請確認網路後再試一次。");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const reset = () => {
    setJobId(OTHER_JOB);
    setCustomLabel("");
    setClaimType("modify");
    setTitle("");
    setAmount("");
    setWorkDate(todayISO());
    setNote("");
    setPhotos([]);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (titleRequired && !title.trim()) {
      setError("工作類型選「其他」時，請填寫工作內容。");
      return;
    }
    if (amount === "" || Number(amount) < 0) {
      setError("請填寫這次的費用。");
      return;
    }
    setError(null);
    try {
      await submitClaim.mutateAsync({
        token,
        job_id: jobId === OTHER_JOB ? null : jobId,
        job_label: jobId === OTHER_JOB ? customLabel : null,
        work_date: workDate,
        claim_type: claimType,
        title: title.trim() || null,
        amount: Number(amount),
        note: note.trim() || null,
        photo_paths: photos,
      });
      toast.success("已送出，等待老闆審核");
      reset();
      onSubmitted?.();
    } catch (submitError) {
      setError(portalErrorMessage(submitError));
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="rounded-lg border border-border bg-card shadow-e1"
    >
      <div className="space-y-5 p-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">
            提交額外工資
          </h2>
          <p className="text-sm text-muted-foreground">
            修改、拆卸或其他額外工作都可以在這裡回報。
          </p>
        </div>

        <Field label="哪一場？" htmlFor="claim-job">
          <Select value={jobId} onValueChange={setJobId}>
            <SelectTrigger id="claim-job" className="h-12 text-base">
              <SelectValue placeholder="選擇場次" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={OTHER_JOB} className="py-3 text-base">
                其他（自行填寫）
              </SelectItem>
              {jobs.map((job) => (
                <SelectItem
                  key={job.id}
                  value={job.id}
                  className="py-3 text-base"
                >
                  {job.job_date} · {job.customer_name ?? "未填客戶"}
                  {job.region_name ? `（${job.region_name}）` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {jobId === OTHER_JOB ? (
          <Field
            label="客戶／地點"
            htmlFor="claim-label"
            help="例如：王先生 板橋，方便老闆對帳"
          >
            <Input
              id="claim-label"
              value={customLabel}
              onChange={(event) => setCustomLabel(event.target.value)}
              placeholder="選填"
              enterKeyHint="next"
              className="h-12 text-base"
            />
          </Field>
        ) : null}

        <Field label="工作類型" required>
          <div className="grid grid-cols-3 gap-2">
            {CLAIM_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setClaimType(type.value)}
                className={cn(
                  "flex h-12 items-center justify-center rounded-md border text-base font-medium transition-colors active:scale-[0.98]",
                  claimType === type.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background text-foreground hover:bg-muted",
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="space-y-2">
          <Field
            label="這次的費用（總額）"
            htmlFor="claim-amount"
            required
            help="直接填這筆額外工作要請款的總金額"
          >
            <Input
              id="claim-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value.replace(/[^\d.]/g, ""))
              }
              placeholder="0"
              enterKeyHint="done"
              className="num h-14 text-right text-2xl font-semibold"
            />
          </Field>

          <div className="grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(String(value))}
                className={cn(
                  "num h-10 rounded-full border text-sm transition-colors active:scale-[0.97]",
                  Number(amount) === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                {value.toLocaleString("zh-TW")}
              </button>
            ))}
          </div>
        </div>

        <Field
          label="工作內容"
          htmlFor="claim-title"
          required={titleRequired}
          help={
            titleRequired
              ? "選擇「其他」時需要簡單說明做了什麼"
              : "選填，例如：現場修改床架尺寸"
          }
        >
          <Input
            id="claim-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={titleRequired ? "例如：協助搬運鋼琴" : "選填"}
            enterKeyHint="next"
            className="h-12 text-base"
          />
        </Field>

        <Field label="工作日期" htmlFor="claim-date" required>
          <Input
            id="claim-date"
            type="date"
            value={workDate}
            onChange={(event) => setWorkDate(event.target.value)}
            className="num h-12 text-base"
          />
        </Field>

        <Field
          label="補充說明"
          htmlFor="claim-note"
          help="選填，例如客戶要求或現場狀況"
        >
          <Textarea
            id="claim-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="選填"
            className="text-base"
          />
        </Field>

        <Field
          label="照片佐證"
          help={`選填，最多 ${MAX_PHOTOS} 張，建議拍施工前後`}
        >
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => void handleFiles(event.target.files)}
            />
            <div className="flex flex-wrap gap-2.5">
              {photos.map((path) => (
                <div key={path} className="relative">
                  <img
                    src={claimPhotoUrl(path)}
                    alt="已上傳的照片"
                    className="h-24 w-24 rounded-md border border-border object-cover"
                  />
                  <button
                    type="button"
                    aria-label="移除這張照片"
                    onClick={() =>
                      setPhotos((previous) =>
                        previous.filter((entry) => entry !== path),
                      )
                    }
                    className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-e1 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {photos.length < MAX_PHOTOS ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-input text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                  {uploading ? "上傳中" : "加照片"}
                </button>
              ) : null}
            </div>
          </div>
        </Field>
      </div>

      {error ? (
        <p className="mx-4 mb-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : null}

      {/* 手機固定在畫面底部，不必滑到最下面才能送出 */}
      <div className="sticky bottom-0 z-10 flex items-center gap-3 rounded-b-lg border-t border-border bg-card/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={submitClaim.isPending || uploading}
        >
          {submitClaim.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          送出等待審核
        </Button>
      </div>
    </form>
  );
};