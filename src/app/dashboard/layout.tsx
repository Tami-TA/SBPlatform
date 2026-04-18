"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { useAuth } from "@/hooks/useAuth";
import { getUserNotifications } from "@/lib/firestore";
import { getInitials } from "@/lib/utils";
import type { Notification } from "@/types";
import {
  BookOpen, LayoutDashboard, Users, UserPlus, ListChecks,
  Sun, Moon, Bell, Menu, X, LogOut, ChevronRight, Layers,
  Flame, Settings, ChevronDown, UserCircle,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",         label: "Dashboard",   icon: LayoutDashboard, exact: true },
  { href: "/dashboard/bible",   label: "Bible",        icon: BookOpen },
  { href: "/dashboard/context", label: "Context",      icon: Layers },
  { href: "/dashboard/groups",  label: "Groups",       icon: Users },
  { href: "/dashboard/friends", label: "Friends",      icon: UserPlus },
  { href: "/dashboard/plans",   label: "Reading Plans",icon: ListChecks },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useThemeStore();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    getUserNotifications(user.uid).then(setNotifications).catch(() => {});
  }, [user]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 rounded-lg mx-auto mb-3 animate-pulse bg-primary/20" />
          <p className="text-muted-foreground text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  async function handleSignOut() {
    setProfileOpen(false);
    await signOut();
    router.replace("/");
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const currentPage = NAV_ITEMS.find(n => isActive(n.href, n.exact))?.label ?? "Profile";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 w-56 flex flex-col
        border-r border-sidebar-border bg-sidebar
        transition-transform duration-200
        lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-sidebar-border flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
              <BookOpen size={14} className="text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">Scripture</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground p-1">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`nav-item ${isActive(item.href, item.exact) ? "active" : ""}`}
            >
              <item.icon size={16} strokeWidth={1.75} />
              <span>{item.label}</span>
              {isActive(item.href, item.exact) && (
                <ChevronRight size={12} className="ml-auto opacity-40" />
              )}
            </Link>
          ))}
        </nav>

        {/* Profile section */}
        <div className="border-t border-sidebar-border p-3 space-y-1 flex-shrink-0">
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-sidebar-accent transition-colors"
            >
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold text-primary-foreground bg-primary overflow-hidden">
                {user.photoURL
                  ? <img src={user.photoURL} alt={user.displayName} className="w-7 h-7 rounded-full object-cover" />
                  : getInitials(user.displayName)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold text-sidebar-foreground truncate">{user.displayName}</p>
                <p className="text-[11px] text-muted-foreground truncate">@{user.username}</p>
              </div>
              <ChevronDown size={12} className="text-muted-foreground flex-shrink-0" />
            </button>

            {profileOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-border bg-popover shadow-md z-50 py-1 overflow-hidden">
                <Link href="/dashboard/profile" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <UserCircle size={14} strokeWidth={1.75} /> View Profile
                </Link>
                <Link href="/dashboard/profile" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <Settings size={14} strokeWidth={1.75} /> Settings
                </Link>
                <div className="h-px my-1 bg-border" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent transition-colors"
                >
                  <LogOut size={14} strokeWidth={1.75} /> Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
          >
            {theme === "dark" ? <Moon size={14} strokeWidth={1.75} /> : <Sun size={14} strokeWidth={1.75} />}
            <span className="text-xs">{theme === "dark" ? "Dark" : "Light"}</span>
            <span className={`ml-auto toggle-track ${theme !== "dark" ? "on" : ""}`} aria-hidden>
              <span className="toggle-thumb" />
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground p-1">
              <Menu size={18} />
            </button>
            {/* Desktop title */}
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-foreground">{currentPage}</p>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <BookOpen size={12} className="text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">Scripture</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Streak */}
            {user.currentStreak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-muted-foreground bg-secondary border border-border">
                <Flame size={11} className="text-orange-400" />
                {user.currentStreak}
              </div>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Moon size={14} strokeWidth={1.75} /> : <Sun size={14} strokeWidth={1.75} />}
            </button>

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Bell size={15} strokeWidth={1.75} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white bg-primary">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 rounded-lg border border-border bg-popover shadow-md z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                    <p className="text-sm font-semibold text-foreground">Notifications</p>
                    <button onClick={() => setNotifOpen(false)} className="text-muted-foreground hover:text-foreground">
                      <X size={13} />
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell size={18} className="mx-auto mb-2 text-muted-foreground opacity-30" />
                      <p className="text-sm text-muted-foreground">No notifications</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto divide-y divide-border">
                      {notifications.slice(0, 20).map(n => (
                        <div key={n.id} className={`px-4 py-2.5 hover:bg-accent transition-colors ${!n.isRead ? "bg-primary/[0.03]" : ""}`}>
                          <div className="flex items-start gap-2">
                            {!n.isRead && <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-primary" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground leading-tight">{n.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
