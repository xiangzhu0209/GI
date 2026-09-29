/**
 * 師傅端（免登入）用的 Cloud Functions。
 *
 * 為什麼一定要放在後端：師傅的專屬連結只有一組權杖，
 * 如果讓瀏覽器直接讀「師傅」集合，任何拿到設定值的人都能讀走所有人的權杖並假冒提交。
 * 這裡用 Admin SDK 驗證權杖後只回傳該師傅自己的資料。
 *
 * 部署：
 *   cd firebase/functions && npm install && cd ../..
 *   firebase deploy --only functions
 */
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { setGlobalOptions } from "firebase-functions/v2";
import { HttpsError, onCall } from "firebase-functions/v2/https";

initializeApp();

// 區域必須與 src/lib/firebase.ts 的 FUNCTIONS_REGION 一致。
setGlobalOptions({ region: "asia-east1", maxInstances: 10 });

const db = getFirestore();

const COLLECTIONS = {
  technicians: "technicians",
  jobs: "jobs",
  extraClaims: "extra_claims",
};

const CLAIM_TYPES = ["modify", "dismantle", "other"];

/** 前端會用這些代碼對照中文說明，請與 src/hooks/use-portal.ts 保持一致。 */
const ERRORS = {
  invalidToken: new HttpsError("invalid-argument", "INVALID_TOKEN"),
  invalidJob: new HttpsError("invalid-argument", "INVALID_JOB"),
  invalidType: new HttpsError("invalid-argument", "INVALID_TYPE"),
  titleRequired: new HttpsError("invalid-argument", "TITLE_REQUIRED"),
  invalidAmount: new HttpsError("invalid-argument", "INVALID_AMOUNT"),
};

const asNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const asText = (value) => (typeof value === "string" ? value.trim() : "");

const asNullableText = (value) => {
  const trimmed = asText(value);
  return trimmed.length ? trimmed : null;
};

/** 以權杖找出啟用中的師傅；找不到就代表連結失效。 */
const requireTechnician = async (token) => {
  const raw = asText(token);
  if (!raw) throw ERRORS.invalidToken;

  const snapshot = await db
    .collection(COLLECTIONS.technicians)
    .where("access_token", "==", raw)
    .limit(1)
    .get();

  if (snapshot.empty) throw ERRORS.invalidToken;

  const document = snapshot.docs[0];
  const data = document.data();
  if (data.is_active !== true) throw ERRORS.invalidToken;

  return { id: document.id, name: asText(data.name) };
};

/**
 * 該師傅的所有場次（新到舊）。
 * 資料量小，排序在程式內完成，就不需要在資料庫建立複合索引。
 */
const listTechnicianJobs = async (technicianId) => {
  const snapshot = await db
    .collection(COLLECTIONS.jobs)
    .where("technician_id", "==", technicianId)
    .get();

  return snapshot.docs
    .map((document) => ({ id: document.id, ...document.data() }))
    .sort((a, b) =>
      String(b.job_date ?? "").localeCompare(String(a.job_date ?? "")),
    );
};

/** 一次取出該師傅的全部額外工資，再依場次分組，避免逐場查詢。 */
const groupClaimsByJob = async (technicianId) => {
  const snapshot = await db
    .collection(COLLECTIONS.extraClaims)
    .where("technician_id", "==", technicianId)
    .get();

  const grouped = new Map();
  snapshot.docs.forEach((document) => {
    const claim = document.data();
    if (!claim.job_id) return;
    const list = grouped.get(claim.job_id) ?? [];
    list.push(claim);
    grouped.set(claim.job_id, list);
  });
  return grouped;
};

/** 師傅名稱與可選的場次清單，供回報表單使用。 */
export const portalGetTechnician = onCall(async (request) => {
  const technician = await requireTechnician(request.data?.token);
  const jobs = await listTechnicianJobs(technician.id);

  return {
    technician: { id: technician.id, name: technician.name },
    jobs: jobs.slice(0, 60).map((job) => ({
      id: job.id,
      job_date: job.job_date ?? "",
      customer_name: job.customer_name ?? null,
      region_name: job.region_name ?? null,
    })),
  };
});

/** 師傅自己的安裝紀錄，含該場工資、油資與額外工資。 */
export const portalListJobs = onCall(async (request) => {
  const technician = await requireTechnician(request.data?.token);
  const [jobs, claimsByJob] = await Promise.all([
    listTechnicianJobs(technician.id),
    groupClaimsByJob(technician.id),
  ]);

  return jobs.slice(0, 200).map((job) => {
    const items = Array.isArray(job.items) ? job.items : [];
    const labor = items.reduce(
      (sum, item) => sum + asNumber(item.qty) * asNumber(item.unit_price),
      0,
    );
    const fuel = asNumber(job.fuel_fee);
    const extraFuel = asNumber(job.extra_fuel);

    const claims = claimsByJob.get(job.id) ?? [];
    const sumByStatus = (status) =>
      claims
        .filter((claim) => claim.status === status)
        .reduce((sum, claim) => sum + asNumber(claim.amount), 0);

    const approved = sumByStatus("approved");

    return {
      id: job.id,
      job_date: job.job_date ?? "",
      customer_name: job.customer_name ?? null,
      region_name: job.region_name ?? null,
      labor,
      fuel,
      extra_fuel: extraFuel,
      claims_approved: approved,
      claims_pending: sumByStatus("pending"),
      total: labor + fuel + extraFuel + approved,
      items: items
        .slice()
        .sort((a, b) => asNumber(a.sort_order) - asNumber(b.sort_order))
        .map((item) => ({
          name: String(item.item_name ?? ""),
          qty: asNumber(item.qty),
        })),
    };
  });
});

/** 師傅自己的提交紀錄（最近 50 筆）。 */
export const portalListClaims = onCall(async (request) => {
  const technician = await requireTechnician(request.data?.token);
  const snapshot = await db
    .collection(COLLECTIONS.extraClaims)
    .where("technician_id", "==", technician.id)
    .get();

  return snapshot.docs
    .map((document) => {
      const claim = document.data();
      return {
        id: document.id,
        work_date: claim.work_date ?? "",
        claim_type: claim.claim_type ?? "other",
        title: claim.title ?? null,
        amount: asNumber(claim.amount),
        note: claim.note ?? null,
        photo_paths: Array.isArray(claim.photo_paths) ? claim.photo_paths : [],
        status: claim.status ?? "pending",
        review_note: claim.review_note ?? null,
        created_at: claim.created_at ?? "",
        job_label: claim.job_label ?? null,
        job_date: claim.job_date ?? null,
      };
    })
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 50);
});

/** 送出額外工資。 */
export const portalSubmitClaim = onCall(async (request) => {
  const data = request.data ?? {};
  const technician = await requireTechnician(data.token);

  const claimType = asText(data.claim_type);
  if (!CLAIM_TYPES.includes(claimType)) throw ERRORS.invalidType;

  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount < 0) throw ERRORS.invalidAmount;

  const title = asNullableText(data.title);
  if (claimType === "other" && !title) throw ERRORS.titleRequired;

  const jobId = asNullableText(data.job_id);
  let jobLabel = asNullableText(data.job_label);
  let jobDate = null;

  if (jobId) {
    const jobSnapshot = await db.collection(COLLECTIONS.jobs).doc(jobId).get();
    if (!jobSnapshot.exists) throw ERRORS.invalidJob;

    const job = jobSnapshot.data();
    if (job.technician_id !== technician.id) throw ERRORS.invalidJob;

    jobLabel = asText(job.customer_name) || asText(job.address) || "此場次";
    jobDate = job.job_date ?? null;
  }

  const photos = Array.isArray(data.photo_paths)
    ? data.photo_paths
        .filter((value) => typeof value === "string" && value.length > 0)
        .slice(0, 10)
    : [];

  const today = new Date().toISOString().slice(0, 10);
  const rawDate = asText(data.work_date);
  const workDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : today;

  const reference = db.collection(COLLECTIONS.extraClaims).doc();
  await reference.set({
    technician_id: technician.id,
    technician_name: technician.name,
    job_id: jobId,
    job_label: jobLabel,
    job_date: jobDate,
    work_date: workDate,
    claim_type: claimType,
    title,
    amount,
    note: asNullableText(data.note),
    photo_paths: photos,
    status: "pending",
    reviewed_at: null,
    review_note: null,
    created_at: new Date().toISOString(),
  });

  return { id: reference.id, status: "pending" };
});
