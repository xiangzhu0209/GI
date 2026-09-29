import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

/** Cloud Storage 內存放額外工資照片的前綴，與 firebase/storage.rules 對應。 */
export const CLAIM_PHOTO_PREFIX = "claim-photos";

/**
 * 上傳佐證照片並回傳可直接顯示的下載網址。
 * 資料庫存的是完整網址（含存取權杖），因此舊的「路徑」格式已不再使用。
 */
export const uploadClaimPhoto = async (file: File): Promise<string> => {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${CLAIM_PHOTO_PREFIX}/claims/${crypto.randomUUID()}.${extension}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file, { contentType: file.type || "image/jpeg" });
  return getDownloadURL(fileRef);
};

/** 保留給顯示端使用；目前存的就是完整網址。 */
export const claimPhotoUrl = (value: string): string => value;
