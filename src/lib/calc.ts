import { toNumber } from "./format";
import type { ExtraClaim, Job, JobItem } from "./types";

export const lineAmount = (item: Pick<JobItem, "qty" | "unit_price">): number =>
  toNumber(item.qty) * toNumber(item.unit_price);

/** 額外工資的金額就是師傅填寫的總額。 */
export const claimAmount = (claim: Pick<ExtraClaim, "amount">): number =>
  toNumber(claim.amount);

export const approvedClaimTotal = (
  claims: Pick<ExtraClaim, "amount" | "status">[],
): number =>
  claims
    .filter((claim) => claim.status === "approved")
    .reduce((sum, claim) => sum + claimAmount(claim), 0);

export const laborTotal = (
  items: Pick<JobItem, "qty" | "unit_price">[],
): number => items.reduce((sum, item) => sum + lineAmount(item), 0);

/**
 * 油資解析順序：師傅自訂的地區油資 → 該地區的預設油資 → 0。
 * 未指定地區時一律 0。
 */
export const resolveFuelFee = (input: {
  regionId: string | null;
  customFee?: number;
  defaultFee?: number;
}): number => {
  if (!input.regionId) return 0;
  if (input.customFee !== undefined) return toNumber(input.customFee);
  return toNumber(input.defaultFee);
};

export type FeeBreakdown = {
  labor: number;
  fuel: number;
  extraFuel: number;
  claims: number;
  total: number;
};

/**
 * 單場費用 = 安裝工資合計 + 該地區油資 + 偏遠加價 + 已核准的額外工資。
 * 油資與單價皆為寫入時的快照，調整價目表不會回頭改動既有場次。
 */
export const jobBreakdown = (
  job: Pick<Job, "fuel_fee" | "extra_fuel">,
  items: Pick<JobItem, "qty" | "unit_price">[],
  approvedClaims: number = 0,
): FeeBreakdown => {
  const labor = laborTotal(items);
  const fuel = toNumber(job.fuel_fee);
  const extraFuel = toNumber(job.extra_fuel);
  const claims = toNumber(approvedClaims);
  return {
    labor,
    fuel,
    extraFuel,
    claims,
    total: labor + fuel + extraFuel + claims,
  };
};

export const BREAKDOWN_LABELS = {
  labor: "安裝工資",
  fuel: "地區油資",
  extraFuel: "偏遠加價",
  claims: "額外工資（已核准）",
  total: "本場應付總額",
} as const;