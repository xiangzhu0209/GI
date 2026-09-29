import {
  Calculator,
  ClipboardList,
  HardHat,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Table2,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { LoadingState } from "@/components/common/loading-state";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSession } from "@/hooks/use-session";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";

type NavEntry = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

const NAV: NavEntry[] = [
  { to: "/", label: "總覽", icon: LayoutDashboard, end: true },
  { to: "/jobs", label: "場次記錄", icon: ClipboardList },
  { to: "/claims", label: "額外工資審核", icon: ShieldCheck },
  { to: "/prices", label: "師傅價格表", icon: Table2 },
  { to: "/technicians", label: "師傅管理", icon: HardHat },
  { to: "/settlement", label: "月結統計", icon: Calculator },
  { to: "/settings", label: "地區與項目", icon: Settings },
];

const Brand = () => (
  <div className="flex items-center gap-2.5">
    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
      <HardHat className="h-5 w-5" />
    </span>
    <span className="leading-tight">
      <span className="block text-sm font-semibold text-foreground">
        工班費用管理
      </span>
      <span className="block text-xs text-muted-foreground">安裝工資與油資</span>
    </span>
  </div>
);

const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
  <nav className="flex flex-1 flex-col gap-1 p-3">
    {NAV.map((entry) => (
      <NavLink
        key={entry.to}
        to={entry.to}
        end={entry.end}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          )
        }
      >
        <entry.icon className="h-4 w-4 shrink-0" />
        {entry.label}
      </NavLink>
    ))}
  </nav>
);

const SessionFooter = ({ email }: { email?: string }) => (
  <div className="border-t border-sidebar-border p-3">
    <p className="mb-2 truncate px-1 text-xs text-muted-foreground">
      {email ?? "已登入"}
    </p>
    <Button
      variant="outline"
      size="sm"
      className="w-full justify-start"
      onClick={() => void signOut(auth)}
    >
      <LogOut className="h-4 w-4" />
      登出
    </Button>
  </div>
);

export const AdminLayout = () => {
  const { user, isAdmin, isLoading } = useSession();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <LoadingState label="正在確認登入狀態…" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!isAdmin) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <HardHat className="h-8 w-8 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-base font-semibold">此帳號沒有管理權限</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            本系統只有管理者指定的帳號具備管理權限。請改用管理員帳號登入。
          </p>
        </div>
        <Button variant="outline" onClick={() => void signOut(auth)}>
          <LogOut className="h-4 w-4" />
          登出並改用其他帳號
        </Button>
      </div>
    );
  }

  const currentTitle =
    NAV.find((entry) =>
      entry.end
        ? location.pathname === entry.to
        : location.pathname.startsWith(entry.to),
    )?.label ?? "工班費用管理";

  return (
    <div className="flex min-h-dvh w-full bg-background">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <Brand />
        </div>
        <NavList />
        <SessionFooter email={user.email ?? undefined} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="開啟選單"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-72 flex-col gap-0 bg-sidebar p-0"
            >
              <SheetHeader className="flex h-14 justify-center border-b border-sidebar-border px-4 text-left">
                <SheetTitle asChild>
                  <div>
                    <Brand />
                  </div>
                </SheetTitle>
              </SheetHeader>
              <NavList onNavigate={() => setMobileOpen(false)} />
              <SessionFooter email={user.email ?? undefined} />
            </SheetContent>
          </Sheet>

          <span className="truncate text-base font-semibold text-foreground">
            {currentTitle}
          </span>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};