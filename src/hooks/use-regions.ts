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
import { COLLECTIONS, mapRegion } from "@/lib/firestore-records";
import type { Region } from "@/lib/types";

const KEY = ["regions"] as const;

export const useRegions = () =>
  useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Region[]> => {
      const snapshot = await getDocs(collection(db, COLLECTIONS.regions));
      return snapshot.docs
        .map((entry) => mapRegion(entry.id, entry.data()))
        .sort(
          (a, b) =>
            a.sort_order - b.sort_order ||
            a.name.localeCompare(b.name, "zh-Hant"),
        );
    },
  });

export const useSaveRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      name: string;
      fuel_fee: number;
      sort_order?: number;
    }) => {
      const payload = {
        name: input.name.trim(),
        fuel_fee: input.fuel_fee,
        sort_order: input.sort_order ?? 0,
      };
      if (input.id) {
        await updateDoc(doc(db, COLLECTIONS.regions, input.id), payload);
        return;
      }
      await setDoc(doc(collection(db, COLLECTIONS.regions)), {
        ...payload,
        created_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
};

export const useDeleteRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, COLLECTIONS.regions, id));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
};
