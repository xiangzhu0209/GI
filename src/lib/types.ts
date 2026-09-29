export type Technician = {
  id: string;
  name: string;
  phone: string | null;
  /** 師傅免登入連結用的權杖，只有管理員能讀取。 */
  access_token: string;
  is_active: boolean;
  note: string | null;
  created_at: string;
};

export type Region = {
  id: string;
  name: string;
  fuel_fee: number;
  sort_order: number;
  created_at: string;
};

export type InstallItem = {
  id: string;
  name: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
};

export type TechnicianPrice = {
  /** 文件 ID：`{technician_id}_{item_id}`。 */
  id: string;
  technician_id: string;
  item_id: string;
  price: number;
  updated_at: string;
};

export type TechnicianFuelFee = {
  /** 文件 ID：`{technician_id}_{region_id}`。 */
  id: string;
  technician_id: string;
  region_id: string;
  fuel_fee: number;
  updated_at: string;
};

export type Job = {
  id: string;
  job_date: string;
  customer_name: string | null;
  address: string | null;
  region_id: string | null;
  /** 寫入時的地區名稱快照。 */
  region_name: string | null;
  /** 寫入時的油資快照。 */
  fuel_fee: number;
  /** 管理者手動指定油資（含本場不收油資）時為 true。 */
  fuel_overridden: boolean;
  extra_fuel: number;
  technician_id: string;
  /** 寫入時的師傅名稱快照。 */
  technician_name: string | null;
  note: string | null;
  created_at: string;
};

export type JobItem = {
  id: string;
  job_id: string;
  item_id: string | null;
  item_name: string;
  qty: number;
  /** 寫入時的單價快照。 */
  unit_price: number;
  price_overridden: boolean;
  sort_order: number;
};

export const CLAIM_TYPE_VALUES = ["modify", "dismantle", "other"] as const;
export type ClaimType = (typeof CLAIM_TYPE_VALUES)[number];

export const CLAIM_STATUS_VALUES = ["pending", "approved", "rejected"] as const;
export type ClaimStatus = (typeof CLAIM_STATUS_VALUES)[number];

export type ExtraClaim = {
  id: string;
  technician_id: string;
  job_id: string | null;
  job_label: string | null;
  /** 寫入時的師傅名稱快照，讓審核清單不必再查師傅。 */
  technician_name: string | null;
  /** 關聯場次的日期快照。 */
  job_date: string | null;
  work_date: string;
  claim_type: ClaimType;
  /** 只有「其他」類型才會有工作內容。 */
  title: string | null;
  amount: number;
  note: string | null;
  photo_paths: string[];
  status: ClaimStatus;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
};

/** 場次 + 明細 + 額外工資。 */
export type JobWithDetails = Job & {
  job_items: JobItem[];
  extra_claims: ExtraClaim[];
};

/** 額外工資 + 關聯的師傅與場次名稱。 */
export type ClaimWithRefs = ExtraClaim & {
  technicians: { id: string; name: string } | null;
  jobs: { id: string; customer_name: string | null; job_date: string } | null;
};

export type JobItemDraft = {
  id?: string;
  item_id: string | null;
  item_name: string;
  qty: number;
  unit_price: number;
  price_overridden: boolean;
  sort_order: number;
};

export type JobDraft = {
  id?: string;
  job_date: string;
  customer_name: string;
  address: string;
  region_id: string | null;
  region_name: string | null;
  fuel_fee: number;
  /** 管理者手動指定油資（含本場不收油資），為 true 時不隨師傅／地區自動重算。 */
  fuel_overridden: boolean;
  extra_fuel: number;
  technician_id: string;
  technician_name: string | null;
  note: string;
  items: JobItemDraft[];
};
