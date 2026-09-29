import { useState, type FormEvent } from "react";
import { AlertCircle, Loader2, LogIn, Mail, ShieldCheck } from "lucide-react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Field } from "@/components/common/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase";
import { GoogleIcon } from "./google-icon";

const AUTH_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Email 或密碼不正確。",
  "auth/invalid-login-credentials": "Email 或密碼不正確。",
  "auth/wrong-password": "Email 或密碼不正確。",
  "auth/user-not-found": "Email 或密碼不正確。",
  "auth/invalid-email": "Email 格式不正確，請重新確認。",
  "auth/user-disabled": "這個帳號已被停用，請聯絡系統管理者。",
  "auth/too-many-requests": "嘗試次數過多，請稍後再試。",
  "auth/network-request-failed": "網路連線異常，請確認網路後再試一次。",
  "auth/popup-blocked": "瀏覽器阻擋了 Google 登入視窗，請允許彈出式視窗。",
  "auth/popup-closed-by-user": "已取消 Google 登入。",
  "auth/operation-not-allowed": "這個登入方式尚未在 Firebase 啟用。",
  "auth/unauthorized-domain": "這個網址還沒加入 Firebase 的授權網域。",
};

const authErrorMessage = (error: unknown): string => {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  return AUTH_MESSAGES[code] ?? "操作失敗，請稍後再試。";
};

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (submitError) {
      setError(authErrorMessage(submitError));
    } finally {
      setPending(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (oauthError) {
      setError(authErrorMessage(oauthError));
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email" htmlFor="email" required>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-11 pl-9"
            />
          </div>
        </Field>

        <Field label="密碼" htmlFor="password" required>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••"
            className="h-11"
          />
        </Field>

        {error ? (
          <p className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          登入
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">或</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() => void handleGoogle()}
      >
        <GoogleIcon className="h-4 w-4" />
        使用 Google 帳號登入
      </Button>

      <p className="flex items-start gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        帳號由系統管理者在 Firebase 主控台建立，本系統不開放自行註冊。
      </p>
    </div>
  );
};
