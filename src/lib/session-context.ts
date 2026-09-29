import { createContext } from "react";
import type { User } from "firebase/auth";

export type SessionState = {
  /** 目前登入的 Firebase 使用者，未登入時為 null。 */
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
};

export const SessionContext = createContext<SessionState>({
  user: null,
  isAdmin: false,
  isLoading: true,
});
