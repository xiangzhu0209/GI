import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { COLLECTIONS, mapTechnician } from "@/lib/firestore-records";
import type { Technician } from "@/lib/types";

const KEY = ["technicians"] as const;

export const useTechnicians = (includeInactive = false) =>
  useQuery({
    queryKey: [...KEY, includeInactive ? "all" : "active"],
    queryFn: async (): Promise<Technician[]> => {
      const snapshot = await getDocs(collection(db, COLLECTIONS.technicians));
      return snapshot.docs
        .map((entry) => mapTechnician(entry.id, entry.data()))
        .filter((technician) => includeInactive || technician.is_active)
        .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
    },
  });

export const useSaveTechnician = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      name: string;
      phone?: string;
      note?: string;
      is_active?: boolean;
    }) => {
      const payload = {
        name: input.name.trim(),
        phone: input.phone?.trim() || null,
        note: input.note?.trim() || null,
        is_active: input.is_active ?? true,
      };
      if (input.id) {
        await updateDoc(doc(db, COLLECTIONS.technicians, input.id), payload);
        return;
      }
      await setDoc(doc(collection(db, COLLECTIONS.technicians)), {
        ...payload,
        access_token: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
      void queryClient.invalidateQueries({ queryKey: ["claims"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
};

/** 刪除師傅，並一併清除他的價目表、地區油資設定與提交紀錄。 */
export const useDeleteTechnician = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const jobSnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.jobs),
          where("technician_id", "==", id),
          limit(1),
        ),
      );
      // 與原本資料庫的外鍵限制一致：還有場次時不允許刪除。
      if (!jobSnapshot.empty) throw new Error("HAS_JOBS");

      const batch = writeBatch(db);
      const related = [
        COLLECTIONS.technicianPrices,
        COLLECTIONS.technicianFuelFees,
        COLLECTIONS.extraClaims,
      ];
      for (const name of related) {
        const snapshot = await getDocs(
          query(collection(db, name), where("technician_id", "==", id)),
        );
        snapshot.forEach((entry) => batch.delete(entry.ref));
      }
      batch.delete(doc(db, COLLECTIONS.technicians, id));
      await batch.commit();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
      void queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
  });
};

export const useCreateTechnicianToken = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = crypto.randomUUID();
      await updateDoc(doc(db, COLLECTIONS.technicians, id), {
        access_token: token,
      });
      return token;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
};

/** 產生師傅專屬提交連結（免登入）。 */
export const buildSubmitUrl = (token: string): string =>
  `${window.location.origin}/submit/${token}`;
