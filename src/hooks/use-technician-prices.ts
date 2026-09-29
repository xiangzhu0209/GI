import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { COLLECTIONS, mapTechnicianPrice } from "@/lib/firestore-records";
import type { TechnicianPrice } from "@/lib/types";

const KEY = ["technician-prices"] as const;

/** 價格文件的 ID 由師傅與項目決定，因此同一組只會有一筆。 */
const priceId = (technicianId: string, itemId: string) =>
  `${technicianId}_${itemId}`;

const priceRef = (technicianId: string, itemId: string) =>
  doc(db, COLLECTIONS.technicianPrices, priceId(technicianId, itemId));

export const useTechnicianPrices = (technicianId: string | null) =>
  useQuery({
    queryKey: [...KEY, technicianId],
    enabled: Boolean(technicianId),
    queryFn: async (): Promise<TechnicianPrice[]> => {
      const snapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.technicianPrices),
          where("technician_id", "==", technicianId),
        ),
      );
      return snapshot.docs.map((entry) =>
        mapTechnicianPrice(entry.id, entry.data()),
      );
    },
  });

/** 一次取出全部價格，供場次表單即時換算（資料量小）。 */
export const useAllPrices = () =>
  useQuery({
    queryKey: [...KEY, "all"],
    queryFn: async (): Promise<TechnicianPrice[]> => {
      const snapshot = await getDocs(collection(db, COLLECTIONS.technicianPrices));
      return snapshot.docs.map((entry) =>
        mapTechnicianPrice(entry.id, entry.data()),
      );
    },
  });

export const useSavePrice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      technician_id: string;
      item_id: string;
      price: number;
    }) => {
      await setDoc(priceRef(input.technician_id, input.item_id), {
        technician_id: input.technician_id,
        item_id: input.item_id,
        price: input.price,
        updated_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
};

/** 刪除該師傅該項目的價格設定（回到「未設定」狀態）。 */
export const useClearPrice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { technician_id: string; item_id: string }) => {
      await deleteDoc(priceRef(input.technician_id, input.item_id));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
};

/** 把來源師傅的價格表與地區油資整批複製到目標師傅。 */
export const useCopyPrices = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      fromTechnicianId: string;
      toTechnicianId: string;
    }) => {
      const [priceSnapshot, fuelSnapshot] = await Promise.all([
        getDocs(
          query(
            collection(db, COLLECTIONS.technicianPrices),
            where("technician_id", "==", input.fromTechnicianId),
          ),
        ),
        getDocs(
          query(
            collection(db, COLLECTIONS.technicianFuelFees),
            where("technician_id", "==", input.fromTechnicianId),
          ),
        ),
      ]);

      const now = new Date().toISOString();
      const batch = writeBatch(db);

      priceSnapshot.docs.forEach((entry) => {
        const record = mapTechnicianPrice(entry.id, entry.data());
        batch.set(priceRef(input.toTechnicianId, record.item_id), {
          technician_id: input.toTechnicianId,
          item_id: record.item_id,
          price: record.price,
          updated_at: now,
        });
      });

      fuelSnapshot.docs.forEach((entry) => {
        const record = entry.data();
        batch.set(
          doc(
            db,
            COLLECTIONS.technicianFuelFees,
            `${input.toTechnicianId}_${String(record.region_id)}`,
          ),
          {
            technician_id: input.toTechnicianId,
            region_id: record.region_id,
            fuel_fee: record.fuel_fee,
            updated_at: now,
          },
        );
      });

      await batch.commit();

      return {
        prices: priceSnapshot.size,
        fuelFees: fuelSnapshot.size,
      };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
      void queryClient.invalidateQueries({
        queryKey: ["technician-fuel-fees"],
      });
    },
  });
};
