import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { COLLECTIONS, mapTechnicianFuelFee } from "@/lib/firestore-records";
import type { TechnicianFuelFee } from "@/lib/types";

const KEY = ["technician-fuel-fees"] as const;

const fuelFeeRef = (technicianId: string, regionId: string) =>
  doc(db, COLLECTIONS.technicianFuelFees, `${technicianId}_${regionId}`);

/** 指定師傅的地區油資設定。 */
export const useTechnicianFuelFees = (technicianId: string | null) =>
  useQuery({
    queryKey: [...KEY, technicianId],
    enabled: Boolean(technicianId),
    queryFn: async (): Promise<TechnicianFuelFee[]> => {
      const snapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.technicianFuelFees),
          where("technician_id", "==", technicianId),
        ),
      );
      return snapshot.docs.map((entry) =>
        mapTechnicianFuelFee(entry.id, entry.data()),
      );
    },
  });

/** 一次取出全部師傅的油資設定，供場次表單即時換算。 */
export const useAllFuelFees = () =>
  useQuery({
    queryKey: [...KEY, "all"],
    queryFn: async (): Promise<TechnicianFuelFee[]> => {
      const snapshot = await getDocs(
        collection(db, COLLECTIONS.technicianFuelFees),
      );
      return snapshot.docs.map((entry) =>
        mapTechnicianFuelFee(entry.id, entry.data()),
      );
    },
  });

export const useSaveFuelFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      technician_id: string;
      region_id: string;
      fuel_fee: number;
    }) => {
      await setDoc(
        fuelFeeRef(input.technician_id, input.region_id),
        {
          technician_id: input.technician_id,
          region_id: input.region_id,
          fuel_fee: input.fuel_fee,
          updated_at: new Date().toISOString(),
        },
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
};

/** 清除該師傅該地區的設定，回到地區預設油資。 */
export const useClearFuelFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { technician_id: string; region_id: string }) => {
      await deleteDoc(fuelFeeRef(input.technician_id, input.region_id));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
};
