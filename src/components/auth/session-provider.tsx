import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ADMIN_UIDS, auth } from "@/lib/firebase";
import { SessionContext, type SessionState } from "@/lib/session-context";

/**
 * 管理端登入狀態。帳號一律在 Firebase 主控台建立，
 * 只有 ADMIN_UIDS 名單內的帳號會被視為管理員。
 */
export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SessionState["user"]>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAdmin: Boolean(user && ADMIN_UIDS.includes(user.uid)),
      isLoading,
    }),
    [user, isLoading],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};
