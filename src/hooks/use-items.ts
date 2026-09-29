import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { COLLECTIONS, mapItem } from "@/lib/firestore-records";
import type { InstallItem } from "@/lib/types";

const KEY = ["items"] as const;

export const useItems = (includeInactive = false) =>
  useQuery({
    queryKey: [...KEY, includeInactive ? "all" : "active"],
    queryFn: async (): Promise<InstallItem[]> => {
      const snapshot = await getDocs(collection(db, COLLECTIONS.items));
      return snapshot.docs
        .map((entry) => mapItem(entry.id, entry.data()))
        .filter((item) => includeInactive || item.is_active)
        .sort(
          (a, b) =>
            (a.category ?? "").localeCompare(b.category ?? "", "zh-Hant") ||
            a.name.localeCompare(b.name, "zh-Hant"),
        );
    },
  });

export const useSaveItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      name: string;
      category?: string;
      is_active?: boolean;
    }) => {
      const payload = {
        name: input.name.trim(),
        category: input.category?.trim() || null,
        is_active: input.is_active ?? true,
      };
      if (input.id) {
        await updateDoc(doc(db, COLLECTIONS.items, input.id), payload);
        return;
      }
      await setDoc(doc(collection(db, COLLECTIONS.items)), {
        ...payload,
        created_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
      void queryClient.invalidateQueries({ queryKey: ["technician-prices"] });
    },
  });
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, COLLECTIONS.items, id));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
      void queryClient.invalidateQueries({ queryKey: ["technician-prices"] });
    },
  });
};
