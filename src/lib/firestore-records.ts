import type { DocumentData } from "firebase/firestore/lite";
import type {
  ClaimStatus,
  ClaimType,
  ClaimWithRefs,
  ExtraClaim,
  InstallItem,
  Job,
  JobItem,
  JobItemDraft,
  Region,
  Technician,
  TechnicianFuelFee,
  TechnicianPrice,
} from "./types";

/** Firestore 集合名稱，必須與 firebase/firestore.rules 一致。 */
export const COLLECTIONS = {
  technicians: "technicians",
  regions: "regions",
  items: "items",
  technicianPrices: "technician_prices",
  technicianFuelFees: "technician_fuel_fees",
  jobs: "jobs",
  extraClaims: "extra_claims",
} as const;

/** 場次文件內嵌的明細，讀取時會補上 `job_id`。 */
export type JobItemRecord = {
  id: string;
  item_id: string | null;
  item_name: string;
  qty: number;
  unit_price: number;
  price_overridden: boolean;
  sort_order: number;
};

const text = (value: unknown): string => (typeof value === "string" ? value : "");

const nullableText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const numeric = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const boolean = (value: unknown, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;

const textList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export const mapTechnician = (id: string, data: DocumentData): Technician => ({
  id,
  name: text(data.name),
  phone: nullableText(data.phone),
  access_token: text(data.access_token),
  is_active: boolean(data.is_active, true),
  note: nullableText(data.note),
  created_at: text(data.created_at),
});

export const mapRegion = (id: string, data: DocumentData): Region => ({
  id,
  name: text(data.name),
  fuel_fee: numeric(data.fuel_fee),
  sort_order: numeric(data.sort_order),
  created_at: text(data.created_at),
});

export const mapItem = (id: string, data: DocumentData): InstallItem => ({
  id,
  name: text(data.name),
  category: nullableText(data.category),
  is_active: boolean(data.is_active, true),
  created_at: text(data.created_at),
});

export const mapTechnicianPrice = (
  id: string,
  data: DocumentData,
): TechnicianPrice => ({
  id,
  technician_id: text(data.technician_id),
  item_id: text(data.item_id),
  price: numeric(data.price),
  updated_at: text(data.updated_at),
});

export const mapTechnicianFuelFee = (
  id: string,
  data: DocumentData,
): TechnicianFuelFee => ({
  id,
  technician_id: text(data.technician_id),
  region_id: text(data.region_id),
  fuel_fee: numeric(data.fuel_fee),
  updated_at: text(data.updated_at),
});

export const mapJob = (id: string, data: DocumentData): Job => ({
  id,
  job_date: text(data.job_date),
  customer_name: nullableText(data.customer_name),
  address: nullableText(data.address),
  region_id: nullableText(data.region_id),
  region_name: nullableText(data.region_name),
  fuel_fee: numeric(data.fuel_fee),
  fuel_overridden: boolean(data.fuel_overridden),
  extra_fuel: numeric(data.extra_fuel),
  technician_id: text(data.technician_id),
  technician_name: nullableText(data.technician_name),
  note: nullableText(data.note),
  created_at: text(data.created_at),
});

/** 場次內嵌明細 → `JobItem`。 */
export const mapJobItems = (jobId: string, data: DocumentData): JobItem[] => {
  const records: JobItemRecord[] = Array.isArray(data.items) ? data.items : [];
  return records
    .map((record) => ({
      id: text(record.id),
      job_id: jobId,
      item_id: nullableText(record.item_id),
      item_name: text(record.item_name),
      qty: numeric(record.qty),
      unit_price: numeric(record.unit_price),
      price_overridden: boolean(record.price_overridden),
      sort_order: numeric(record.sort_order),
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
};

/** 表單草稿 → 場次文件的內嵌明細。 */
export const toJobItemRecords = (items: JobItemDraft[]): JobItemRecord[] =>
  items.map((item, index) => ({
    id: item.id ?? crypto.randomUUID(),
    item_id: item.item_id ?? null,
    item_name: item.item_name,
    qty: item.qty,
    unit_price: item.unit_price,
    price_overridden: item.price_overridden,
    sort_order: index,
  }));

export const mapClaim = (id: string, data: DocumentData): ExtraClaim => ({
  id,
  technician_id: text(data.technician_id),
  job_id: nullableText(data.job_id),
  job_label: nullableText(data.job_label),
  technician_name: nullableText(data.technician_name),
  job_date: nullableText(data.job_date),
  work_date: text(data.work_date),
  claim_type: (text(data.claim_type) || "other") as ClaimType,
  title: nullableText(data.title),
  amount: numeric(data.amount),
  note: nullableText(data.note),
  photo_paths: textList(data.photo_paths),
  status: (text(data.status) || "pending") as ClaimStatus,
  reviewed_at: nullableText(data.reviewed_at),
  review_note: nullableText(data.review_note),
  created_at: text(data.created_at),
});

/** 額外工資 + 關聯名稱（由文件上的快照欄位組成，不需要額外查詢）。 */
export const mapClaimWithRefs = (id: string, data: DocumentData): ClaimWithRefs => {
  const claim = mapClaim(id, data);
  const jobId = claim.job_id;
  return {
    ...claim,
    technicians: claim.technician_name
      ? { id: claim.technician_id, name: claim.technician_name }
      : null,
    jobs: jobId
      ? { id: jobId, customer_name: claim.job_label, job_date: claim.job_date ?? "" }
      : null,
  };
};
