import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
  type QueryConstraint,
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { COLLECTIONS, mapClaimWithRefs } from "@/lib/firestore-records";
import type { ClaimStatus, ClaimWithRefs } from "@/lib/types";

const KEY = ["claims"] as const;

/** 「全部」頁籤單次最多載入的筆數。 */
const MAX_CLAIMS = 500;

export const useClaims = (status: ClaimStatus | "all" = "all") =>
  useQuery({
    queryKey: [...KEY, "list", status],
    queryFn: async (): Promise<ClaimWithRefs[]> => {
      const constraints: QueryConstraint[] =
        status === "all"
          ? [orderBy("created_at", "desc"), limit(MAX_CLAIMS)]
          : [where("status", "==", status)];

      const snapshot = await getDocs(
        query(collection(db, COLLECTIONS.extraClaims), ...constraints),
      );
      const claims = snapshot.docs.map((entry) =>
        mapClaimWithRefs(entry.id, entry.data()),
      );
      return claims.sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
  });

export const useReviewClaim = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      status: Exclude<ClaimStatus, "pending">;
      review_note?: string;
    }) => {
      await updateDoc(doc(db, COLLECTIONS.extraClaims, input.id), {
        status: input.status,
        review_note: input.review_note?.trim() || null,
        reviewed_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
};

/** 管理員刪除不正確的提交（例如師傅重複填寫）。 */
export const useDeleteClaim = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, COLLECTIONS.extraClaims, id));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
};
