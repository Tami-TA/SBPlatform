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
  Flame, Settings, Camera, ChevronDown, UserCircle,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/bible", label: "Bible", icon: BookOpen },
  { href: "/dashboard/context", label: "Context", icon: Layers },
  { href: "/dashboard/groups", label: "Groups", icon: Users },
  { href: "/dashboard/friends", label: "Friends", icon: UserPlus },
  { href: "/dashboard/plans", label: "Reading Plans", icon: ListChecks },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useThemeStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    getUserNotifications(user.uid).then(setNotifications).catch(() => {});
  }, [user]);

  // Close panels on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl mx-auto mb-3 animate-pulse"
            style={{ background: "linear-gradient(135deg, #D4AF37, #F59E0B)" }} />
          <p className="text-secondary-page text-sm">Loading...</p>
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const currentPage = NAV_ITEMS.find((n) => isActive(n.href, n.exact))?.label || "Profile";

  return (
    <div className="min-h-screen bg-page flex">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 w-60 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "var(--bg-card)", borderRight: "1px solid var(--border)" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-page">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #D4AF37, #F59E0B)" }}>
              <BookOpen size={15} className="text-gray-900" />
            </div>
            <span className="font-display text-base font-bold text-page">Scripture</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-page hover:text-page">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`nav-item ${isActive(item.href, item.exact) ? "active" : ""}`}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
              {isActive(item.href, item.exact) && (
                <ChevronRight size={13} className="ml-auto opacity-50" />
              )}
            </Link>
          ))}
        </nav>

        {/* Profile section at bottom */}
        <div className="border-t border-page p-3 space-y-1">
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all hover:opacity-80"
              style={{ background: "var(--bg-secondary)" }}
            >
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-900 overflow-hidden"
                style={{ background: "linear-gradient(135deg, #D4AF37, #F59E0B)" }}>
                {user.photoURL
                  ? <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full object-cover" />
                  : getInitials(user.displayName)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-page truncate leading-tight">{user.displayName}</p>
                <p className="text-xs text-muted-page truncate">@{user.username}</p>
              </div>
              <ChevronDown size={13} className="text-muted-page flex-shrink-0" />
            </button>

            {/* Profile dropdown — opens upward */}
            {profileOpen && (
              <div
                className="absolute bottom-full left-0 right-0 mb-1 rounded-xl shadow-lg z-50 py-1 overflow-hidden"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <Link href="/dashboard/profile" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-secondary-page hover:text-page hover:bg-[var(--bg-secondary)] transition-colors">
                  <UserCircle size={15} /> View Profile
                </Link>
                <Link href="/dashboard/profile" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-secondary-page hover:text-page hover:bg-[var(--bg-secondary)] transition-colors">
                  <Camera size={15} /> Change Photo
                </Link>
                <Link href="/dashboard/profile" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-secondary-page hover:text-page hover:bg-[var(--bg-secondary)] transition-colors">
                  <Settings size={15} /> Settings
                </Link>
                <div className="h-px my-1" style={{ background: "var(--border)" }} />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm text-muted-page hover:text-page transition-colors"
            style={{ background: "transparent" }}
          >
            {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
            <span className="text-xs">{theme === "dark" ? "Dark mode" : "Light mode"}</span>
            <span className={`ml-auto toggle-track ${theme === "dark" ? "" : "on"}`} aria-hidden>
              <span className="toggle-thumb" />
            </span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-page sticky top-0 z-30"
          style={{ background: "var(--bg-card)" }}
        >
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-page hover:text-page">
              <Menu size={20} />
            </button>
            {/* Desktop: page title */}
            <div className="hidden lg:block">
              <h1 className="text-base font-semibold text-page">{currentPage}</h1>
              <p className="text-xs text-muted-page">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
            {/* Mobile: logo */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #D4AF37, #F59E0B)" }}>
                <BookOpen size={13} className="text-gray-900" />
              </div>
              <span className="font-display font-bold text-page text-sm">Scripture</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Streak pill — icon only, no emoji */}
            {user.currentStreak > 0 && (
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-orange-400"
                style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.2)" }}
              >
                <Flame size={12} />
                {user.currentStreak}
              </div>
            )}

            {/* Theme toggle (desktop) */}
            <button
              onClick={toggleTheme}
              className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg text-muted-page hover:text-page transition-colors"
              style={{ background: "var(--bg-secondary)" }}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
            </button>

            {/* Theme toggle (mobile) */}
            <button
              onClick={toggleTheme}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-muted-page hover:text-page transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Notification bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative w-8 h-8 flex items-center justify-center rounded-lg text-muted-page hover:text-page transition-colors"
                style={{ background: "var(--bg-secondary)" }}
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white bg-red-500">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification panel */}
              {notifOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-lg z-50 overflow-hidden"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-page">
                    <h3 className="font-semibold text-sm text-page">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <span className="text-xs text-muted-page">{unreadCount} new</span>
                      )}
                      <button onClick={() => setNotifOpen(false)} className="text-muted-page hover:text-page">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center">
                      <Bell size={22} className="mx-auto mb-2 text-muted-page opacity-40" />
                      <p className="text-sm text-muted-page">No notifications</p>
                      <p className="text-xs text-muted-page mt-1 opacity-60">You&apos;re all caught up</p>
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto divide-y" style={{ borderColor: "var(--border)" }}>
                      {notifications.slice(0, 20).map((n) => (
                        <div
                          key={n.id}
                          className="px-4 py-3 transition-colors hover:bg-[var(--bg-secondary)]"
                          style={!n.isRead ? { background: "rgba(212,175,55,0.04)" } : {}}
                        >
                          <div className="flex items-start gap-2">
                            {!n.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-blue-400" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-page leading-tight">{n.title}</p>
                              <p className="text-xs text-muted-page mt-0.5 leading-relaxed">{n.body}</p>
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
