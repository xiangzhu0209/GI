import {
  Calculator,
  ClipboardList,
  HardHat,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { auth } from "@/lib/firebase";
import { LoginForm } from "./login-form";

const HIGHLIGHTS = [
  { icon: ClipboardList, text: "逐場記錄安裝項目，自動帶出師傅工資" },
  { icon: Calculator, text: "依地區自動加計油資，即時算出應付總額" },
  { icon: ShieldCheck, text: "師傅線上提交額外工資，審核後才計入" },
];

const Login = () => {
  const { user, isAdmin, isLoading } = useSession();

  if (!isLoading && user && isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-dvh w-full bg-background">
      <div className="sheen-hero hidden w-1/2 flex-col justify-between p-10 lg:flex xl:p-14">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-foreground/15 text-primary-foreground">
            <HardHat className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold text-primary-foreground">
            工班費用管理
          </span>
        </div>

        <div className="space-y-6">
          <h1 className="text-3xl font-semibold leading-snug text-primary-foreground xl:text-4xl">
            每一場的安裝工資與油資
            <br />
            一次算清楚
          </h1>
          <ul className="space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li
                key={item.text}
                className="flex items-center gap-3 text-sm text-primary-foreground/85"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-foreground/12">
                  <item.icon className="h-4 w-4" />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-primary-foreground/60">
          師傅不需要註冊帳號，用管理者發出的專屬連結即可提交額外工資。
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-5 py-10 lg:w-1/2">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <HardHat className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-foreground">
              工班費用管理
            </span>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              管理後台登入
            </h2>
            <p className="text-sm text-muted-foreground">
              只有管理者需要登入，師傅請使用專屬連結。
            </p>
          </div>

          {user && !isAdmin ? (
            <div className="space-y-3 rounded-md border border-warning/30 bg-warning/5 px-3 py-3">
              <p className="text-sm text-warning">
                這個帳號沒有管理權限。本系統只有管理者指定的帳號可以進入後台。
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => void signOut(auth)}
              >
                <LogOut className="h-4 w-4" />
                登出並改用其他帳號
              </Button>
            </div>
          ) : (
            <LoginForm />
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;