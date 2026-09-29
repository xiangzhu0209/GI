import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import type { ClaimType } from "@/lib/types";

export type PortalJob = {
  id: string;
  job_date: string;
  customer_name: string | null;
  region_name: string | null;
};

export type PortalTechnician = {
  technician: { id: string; name: string };
  jobs: PortalJob[];
};

/** 師傅自己的安裝紀錄，含該場工資、油資與額外工資。 */
export type PortalJobRecord = {
  id: string;
  job_date: string;
  customer_name: string | null;
  region_name: string | null;
  labor: number;
  fuel: number;
  extra_fuel: number;
  claims_approved: number;
  claims_pending: number;
  total: number;
  items: { name: string; qty: number }[];
};

export type PortalClaim = {
  id: string;
  work_date: string;
  claim_type: string;
  title: string | null;
  amount: number;
  note: string | null;
  photo_paths: string[];
  status: string;
  review_note: string | null;
  created_at: string;
  job_label: string | null;
  job_date: string | null;
};

export type PortalClaimInput = {
  token: string;
  job_id: string | null;
  job_label: string | null;
  work_date: string;
  claim_type: ClaimType;
  title: string | null;
  amount: number;
  note: string | null;
  photo_paths: string[];
};

const PORTAL_ERRORS: Record<string, string> = {
  INVALID_TOKEN: "此連結已失效，請向管理者索取新的連結。",
  INVALID_JOB: "選擇的場次不屬於你，請重新選擇。",
  INVALID_TYPE: "請選擇正確的工作類型。",
  TITLE_REQUIRED: "工作類型選「其他」時，請填寫工作內容。",
  INVALID_AMOUNT: "費用請填 0 以上的數字。",
};

/** 把後端函式回傳的錯誤代碼轉成師傅看得懂的說明。 */
export const portalErrorMessage = (error: unknown): string => {
  const raw =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error ?? "");
  const key = Object.keys(PORTAL_ERRORS).find((code) => raw.includes(code));
  return key ? PORTAL_ERRORS[key] : "送出失敗，請稍後再試或聯絡管理者。";
};

/** 呼叫 firebase/functions 內的師傅端函式。 */
const callPortal = async <TResult,>(
  name: string,
  payload: Record<string, unknown>,
): Promise<TResult> => {
  const callable = httpsCallable<Record<string, unknown>, TResult>(
    functions,
    name,
  );
  const result = await callable(payload);
  return result.data;
};

export const usePortalTechnician = (token?: string) =>
  useQuery({
    queryKey: ["portal", "technician", token],
    enabled: Boolean(token),
    retry: false,
    queryFn: async (): Promise<PortalTechnician | null> =>
      callPortal<PortalTechnician>("portalGetTechnician", {
        token: token as string,
      }),
  });

export const usePortalJobs = (token?: string) =>
  useQuery({
    queryKey: ["portal", "jobs", token],
    enabled: Boolean(token),
    retry: false,
    queryFn: async (): Promise<PortalJobRecord[]> =>
      callPortal<PortalJobRecord[]>("portalListJobs", { token: token as string }),
  });

export const usePortalClaims = (token?: string) =>
  useQuery({
    queryKey: ["portal", "claims", token],
    enabled: Boolean(token),
    retry: false,
    queryFn: async (): Promise<PortalClaim[]> =>
      callPortal<PortalClaim[]>("portalListClaims", {
        token: token as string,
      }),
  });

export const useSubmitPortalClaim = (token?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PortalClaimInput) =>
      callPortal<{ id: string; status: string }>("portalSubmitClaim", {
        ...input,
        token: input.token || token,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
};
