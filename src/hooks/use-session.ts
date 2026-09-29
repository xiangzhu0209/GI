import { useContext } from "react";
import { SessionContext, type SessionState } from "@/lib/session-context";

/** 取得目前的管理端登入狀態。 */
export const useSession = (): SessionState => useContext(SessionContext);