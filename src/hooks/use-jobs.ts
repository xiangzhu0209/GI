import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
  writeBatch,
  type QueryConstraint,
} from "firebase/firestore/lite";
import { monthBounds } from "@/lib/date";
import { db } from "@/lib/firebase";
import {
  COLLECTIONS,
  mapClaim,
  mapJob,
  mapJobItems,
  toJobItemRecords,
} from "@/lib/firestore-records";
import type { ExtraClaim, Job, JobDraft, JobWithDetails } from "@/lib/types";

const KEY = ["jobs"] as const;

/** 單次最多載入的場次數，避免資料累積後一次讀取過多文件。 */
const MAX_JOBS = 300;

/** 依場次分批取出額外工資，回傳以 job_id 分組的結果。 */
const fetchClaimsByJobIds = async (
  jobIds: string[],
): Promise<Map<string, ExtraClaim[]>> => {
  const grouped = new Map<string, ExtraClaim[]>();
  const unique = [...new Set(jobIds.filter(Boolean))];
  if (!unique.length) return grouped;

  // Firestore 的 `in` 條件一次最多 30 個值，超過要分批查詢。
  const chunks: string[][] = [];
  for (let index = 0; index < unique.length; index += 30) {
    chunks.push(unique.slice(index, index + 30));
  }

  const snapshots = await Promise.all(
    chunks.map((chunk) =>
      getDocs(
        query(
          collection(db, COLLECTIONS.extraClaims),
          where("job_id", "in", chunk),
        ),
      ),
    ),
  );

  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((entry) => {
      const claim = mapClaim(entry.id, entry.data());
      if (!claim.job_id) return;
      const list = grouped.get(claim.job_id) ?? [];
      list.push(claim);
      grouped.set(claim.job_id, list);
    });
  });

  grouped.forEach((list) =>
    list.sort((a, b) => a.created_at.localeCompare(b.created_at)),
  );
  return grouped;
};

export type JobFilters = {
  month?: string;
  technicianId?: string;
  limit?: number;
};

export const useJobs = (filters: JobFilters = {}) =>
  useQuery({
    queryKey: [
      ...KEY,
      "list",
      filters.month ?? "all",
      filters.technicianId ?? "all",
      filters.limit ?? "all",
    ],
    queryFn: async (): Promise<Job[]> => {
      const constraints: QueryConstraint[] = [];
      if (filters.month) {
        const { start, end } = monthBounds(filters.month);
        constraints.push(
          where("job_date", ">=", start),
          where("job_date", "<=", end),
        );
      }
      constraints.push(orderBy("job_date", "desc"));
      if (!filters.month) constraints.push(limit(MAX_JOBS));

      const snapshot = await getDocs(
        query(collection(db, COLLECTIONS.jobs), ...constraints),
      );

      let jobs = snapshot.docs.map((entry) => mapJob(entry.id, entry.data()));
      if (filters.technicianId) {
        jobs = jobs.filter((job) => job.technician_id === filters.technicianId);
      }
      jobs.sort(
        (a, b) =>
          b.job_date.localeCompare(a.job_date) ||
          b.created_at.localeCompare(a.created_at),
      );
      return jobs.slice(0, filters.limit ?? MAX_JOBS);
    },
  });

/** 月份內的場次（含明細與額外工資），供結算與儀表板使用。 */
export const useMonthJobs = (month: string) =>
  useQuery({
    queryKey: [...KEY, "month", month],
    queryFn: async (): Promise<JobWithDetails[]> => {
      const { start, end } = monthBounds(month);
      const snapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.jobs),
          where("job_date", ">=", start),
          where("job_date", "<=", end),
          orderBy("job_date", "asc"),
        ),
      );

      const claimsByJob = await fetchClaimsByJobIds(
        snapshot.docs.map((entry) => entry.id),
      );

      return snapshot.docs.map((entry) => {
        const data = entry.data();
        return {
          ...mapJob(entry.id, data),
          job_items: mapJobItems(entry.id, data),
          extra_claims: claimsByJob.get(entry.id) ?? [],
        };
      });
    },
  });

export const useJob = (jobId?: string) =>
  useQuery({
    queryKey: [...KEY, "detail", jobId],
    enabled: Boolean(jobId),
    queryFn: async (): Promise<JobWithDetails | null> => {
      const snapshot = await getDoc(
        doc(db, COLLECTIONS.jobs, jobId as string),
      );
      if (!snapshot.exists()) return null;

      const claimSnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.extraClaims),
          where("job_id", "==", jobId as string),
        ),
      );
      const claims = claimSnapshot.docs
        .map((entry) => mapClaim(entry.id, entry.data()))
        .sort((a, b) => a.created_at.localeCompare(b.created_at));

      const data = snapshot.data();
      return {
        ...mapJob(snapshot.id, data),
        job_items: mapJobItems(snapshot.id, data),
        extra_claims: claims,
      };
    },
  });

export const useSaveJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: JobDraft): Promise<string> => {
      const payload = {
        job_date: draft.job_date,
        customer_name: draft.customer_name.trim() || null,
        address: draft.address.trim() || null,
        region_id: draft.region_id ?? null,
        region_name: draft.region_name ?? null,
        fuel_fee: draft.fuel_fee,
        fuel_overridden: draft.fuel_overridden,
        extra_fuel: draft.extra_fuel,
        technician_id: draft.technician_id,
        technician_name: draft.technician_name ?? null,
        note: draft.note.trim() || null,
        items: toJobItemRecords(draft.items),
      };

      if (draft.id) {
        // 明細整批覆寫，created_at 由 merge 保留。
        await setDoc(doc(db, COLLECTIONS.jobs, draft.id), payload, {
          merge: true,
        });
        return draft.id;
      }

      const reference = doc(collection(db, COLLECTIONS.jobs));
      await setDoc(reference, {
        ...payload,
        created_at: new Date().toISOString(),
      });
      return reference.id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // 與原本的資料庫設定一致：場次刪除後額外工資保留，只解除關聯。
      const claimSnapshot = await getDocs(
        query(collection(db, COLLECTIONS.extraClaims), where("job_id", "==", id)),
      );
      const batch = writeBatch(db);
      claimSnapshot.forEach((entry) => batch.update(entry.ref, { job_id: null }));
      batch.delete(doc(db, COLLECTIONS.jobs, id));
      await batch.commit();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
      void queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
  });
};
