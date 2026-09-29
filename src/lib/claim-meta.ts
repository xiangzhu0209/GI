import type { ClaimStatus, ClaimType } from "./types";

export const CLAIM_TYPES: {
  value: ClaimType;
  label: string;
  hint: string;
}[] = [
  { value: "modify", label: "修改", hint: "現場尺寸或做法變更" },
  { value: "dismantle", label: "拆卸", hint: "拆除舊件或重新拆裝" },
  { value: "other", label: "其他", hint: "其他額外工資項目" },
];

export const claimTypeLabel = (value: string): string =>
  CLAIM_TYPES.find((type) => type.value === value)?.label ?? value;

export const CLAIM_STATUS_META: Record<
  ClaimStatus,
  { label: string; tone: "warning" | "success" | "destructive" }
> = {
  pending: { label: "待審核", tone: "warning" },
  approved: { label: "已核准", tone: "success" },
  rejected: { label: "已駁回", tone: "destructive" },
};

export const claimStatusLabel = (value: string): string =>
  CLAIM_STATUS_META[value as ClaimStatus]?.label ?? value;