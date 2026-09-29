import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore/lite";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

/**
 * Firebase 專案設定。apiKey 是「公開識別碼」，放在前端是正常的；
 * 真正的資料保護由 firebase/firestore.rules 與 firebase/storage.rules 決定。
 */
const firebaseConfig = {
  apiKey: "AIzaSyA6GTKYoX36POm61Vkuy0PeLj9QpBxUwaw",
  authDomain: "install-2ec19.firebaseapp.com",
  projectId: "install-2ec19",
  storageBucket: "install-2ec19.firebasestorage.app",
  messagingSenderId: "317472221567",
  appId: "1:317472221567:web:f01835099eab15be76124a",
};

/** 師傅提交用的 Cloud Functions 區域，必須與 firebase/functions/index.js 一致。 */
export const FUNCTIONS_REGION = "asia-east1";

/**
 * 管理員的 UID。
 *
 * 前端只用它決定「要不要顯示後台介面」，真正擋資料的是安全規則，
 * 因此新增管理員時要同時修改這裡與 firebase/firestore.rules、firebase/storage.rules。
 */
export const ADMIN_UIDS = ["XvUjeixONwOgLzKdtJ7AEueeIDq2"];

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const functions = getFunctions(firebaseApp, FUNCTIONS_REGION);
