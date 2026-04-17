"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";
import {
  BookOpen, LayoutDashboard, Users, UserPlus, ListChecks,
  User, Sun, Moon, Bell, Menu, X, LogOut, ChevronRight, Layers,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/bible", label: "Bible", icon: BookOpen },
  { href: "/dashboard/context", label: "Context", icon: Layers },
  { href: "/dashboard/groups", label: "Groups", icon: Users },
  { href: "/dashboard/friends", label: "Friends", icon: UserPlus },
  { href: "/dashboard/plans", label: "Reading Plans", icon: ListChecks },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useThemeStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl mx-auto mb-4 animate-pulse"
            style={{ background: "linear-gradient(135deg, #D4AF37, #F59E0B)" }} />
          <p className="text-secondary-page text-sm">Loading Scripture...</p>
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
    await signOut();
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-page flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-50 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "var(--bg-card)", borderRight: "1px solid var(--border)" }}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-page">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #D4AF37, #F59E0B)" }}>
              <BookOpen size={18} className="text-gray-900" />
            </div>
            <span className="font-display text-lg font-bold text-page">Scripture</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-page hover:text-page">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`nav-item ${isActive(item.href, item.exact) ? "active" : ""}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {isActive(item.href, item.exact) && (
                <ChevronRight size={14} className="ml-auto opacity-60" />
              )}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-page p-4">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-gray-900 flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #D4AF37, #F59E0B)" }}>
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-9 h-9 rounded-full object-cover" />
              ) : getInitials(user.displayName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-page truncate">{user.displayName}</p>
              <p className="text-xs text-muted-page truncate">@{user.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="flex-1 btn-ghost text-sm py-2 px-3 flex items-center justify-center gap-2">
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <button onClick={handleSignOut} className="btn-ghost text-sm py-2 px-3 flex items-center justify-center gap-2 flex-1" title="Sign out">
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-page sticky top-0 z-30"
          style={{ background: "var(--bg-card)" }}>
          <button onClick={() => setSidebarOpen(true)} className="text-muted-page hover:text-page">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #D4AF37, #F59E0B)" }}>
              <BookOpen size={14} className="text-gray-900" />
            </div>
            <span className="font-display font-bold text-page">Scripture</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="text-muted-page hover:text-page p-1.5">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setNotifOpen(!notifOpen)} className="text-muted-page hover:text-page p-1.5 relative">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-page sticky top-0 z-30"
          style={{ background: "var(--bg-card)" }}>
          <div>
            <h1 className="text-lg font-semibold text-page">
              {NAV_ITEMS.find((n) => isActive(n.href, n.exact))?.label || "Dashboard"}
            </h1>
            <p className="text-xs text-muted-page">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user.currentStreak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: "rgba(251, 146, 60, 0.15)", border: "1px solid rgba(251, 146, 60, 0.3)" }}>
                <span className="text-base">🔥</span>
                <span className="text-sm font-bold text-orange-400">{user.currentStreak}</span>
              </div>
            )}
            <button onClick={toggleTheme} className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-page hover:text-page transition-colors"
              style={{ background: "var(--bg-secondary)" }}>
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-page hover:text-page relative transition-colors"
              style={{ background: "var(--bg-secondary)" }}>
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
