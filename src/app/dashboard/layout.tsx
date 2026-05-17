"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { useAuth } from "@/hooks/useAuth";
import { getUserNotifications } from "@/lib/firestore";
import { getInitials } from "@/lib/utils";
import type { Notification } from "@/types";
import { TutorialModal } from "@/components/TutorialModal";

function IcoStar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
      <path d="M12 2l2.7 8.3H23l-7 5.1 2.7 8.3-7-5.1-7 5.1 2.7-8.3-7-5.1h8.3z"/>
    </svg>
  );
}
function IcoDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/>
      <rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
    </svg>
  );
}
function IcoBible({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5a1.5 1.5 0 0 0 0 3H19"/><path d="M19 18v3"/>
    </svg>
  );
}
function IcoPlans({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>
    </svg>
  );
}
function IcoGroups({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.3"/>
      <path d="M3 19c0-2.8 2.7-5 6-5s6 2.2 6 5M15 19c0-2 1.6-3.6 4-3.6"/>
    </svg>
  );
}
function IcoFriends({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3"/><path d="M19 16c1.5.5 3 1.5 3 3v1"/>
      <circle cx="9" cy="8" r="3"/><path d="M3 20v-1c0-2.2 2.7-4 6-4s6 1.8 6 4v1"/>
    </svg>
  );
}
function IcoContext({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M12 3l8 4v6c0 4-3.3 7-8 8-4.7-1-8-4-8-8V7z"/>
    </svg>
  );
}
function IcoSettings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 14.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
    </svg>
  );
}

function IcoHelp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <circle cx="12" cy="12" r="9"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5" fill="currentColor"/>
    </svg>
  );
}
function IcoBell({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 19a2 2 0 0 0 4 0"/>
    </svg>
  );
}
function IcoFlame({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
      <path d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 11 8 13 8 14a4 4 0 0 0 8 0"/>
    </svg>
  );
}
function IcoMenu({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M4 6h16M4 12h16M4 18h16"/>
    </svg>
  );
}
function IcoX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  );
}
function IcoLogout({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
    </svg>
  );
}

// ── Nav config ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/dashboard",          label: "Dashboard",    Icon: IcoDashboard,  exact: true },
  { href: "/dashboard/bible",    label: "Bible",         Icon: IcoBible },
  { href: "/dashboard/plans",    label: "Study Plans",   Icon: IcoPlans },
  { href: "/dashboard/groups",   label: "Groups",        Icon: IcoGroups },
  { href: "/dashboard/friends",  label: "Friends",       Icon: IcoFriends },
  { href: "/dashboard/context",  label: "Context",       Icon: IcoContext },
];

// ── Layout ────────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const { firebaseUser } = useAuthStore();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [profileOpen,   setProfileOpen]   = useState(false);
  const [tutorialOpen,  setTutorialOpen]  = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) { router.replace("/auth/login"); return; }
    if (!user) { router.replace("/auth/setup"); return; }
  }, [user, firebaseUser, loading, router]);

  useEffect(() => {
    if (!user) return;
    getUserNotifications(user.uid).then(setNotifications).catch(() => {});
  }, [user]);

  // Auto-open tutorial for first-time users
  useEffect(() => {
    if (!user) return;
    try {
      if (!localStorage.getItem("tutorial_v1_seen")) setTutorialOpen(true);
    } catch { /* private browsing */ }
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
      <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--accent-btn)", color: "white", margin: "0 auto 12px", display: "grid", placeItems: "center" }}><IcoStar /></div>
          <p style={{ fontSize: 13, color: "var(--ink-3)" }}>Loading…</p>
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
  const initials = getInitials(user.displayName);

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--paper)", overflow: "hidden" }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 40, background: "oklch(0% 0 0 / 0.4)" }}
          className="lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px 18px 8px" }}>
          <div style={{
            width: 22, height: 22, borderRadius: 5,
            background: "var(--accent-btn)", color: "white",
            display: "grid", placeItems: "center", flexShrink: 0,
          }}><IcoStar /></div>
          <span style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ink-1)", lineHeight: 1.2 }}>Bible Study Tracker</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto" style={{ color: "var(--ink-3)", background: "none", border: "none", cursor: "pointer", padding: 2 }}>
            <IcoX />
          </button>
        </div>

        {/* Study section */}
        <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-4)", padding: "14px 8px 6px", fontWeight: 500 }}>Study</div>
        {NAV_ITEMS.map(({ href, label, Icon, exact }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setSidebarOpen(false)}
            className={`nav-item ${isActive(href, exact) ? "active" : ""}`}
          >
            <Icon />
            <span>{label}</span>
          </Link>
        ))}

        {/* Personal section */}
        <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-4)", padding: "14px 8px 6px", fontWeight: 500 }}>Personal</div>
        <Link href="/dashboard/profile" onClick={() => setSidebarOpen(false)}
          className={`nav-item ${pathname.startsWith("/dashboard/profile") ? "active" : ""}`}>
          <IcoSettings />
          <span>Settings</span>
        </Link>
        <button
          onClick={() => { setSidebarOpen(false); setTutorialOpen(true); }}
          className="nav-item"
          style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
        >
          <IcoHelp />
          <span>Help Tour</span>
        </button>

        {/* Footer: streak pill */}
        <div style={{ marginTop: "auto", borderTop: "1px solid var(--hairline)", paddingTop: 12 }}>
          {user.currentStreak > 0 && (
            <div ref={profileRef} style={{ position: "relative" }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "4px 8px", background: "var(--paper)", border: "1px solid var(--hairline)",
                  borderRadius: 999, fontSize: 11.5, color: "var(--ink-2)", cursor: "pointer",
                  fontFamily: "var(--font-ui)",
                }}
              >
                <IcoFlame />
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{user.currentStreak} day streak</span>
              </button>
              {profileOpen && (
                <div style={{
                  position: "absolute", bottom: "100%", left: 0, marginBottom: 6,
                  background: "var(--paper)", border: "1px solid var(--hairline)", borderRadius: 8,
                  boxShadow: "var(--shadow-modal)", zIndex: 50, minWidth: 160, overflow: "hidden",
                }}>
                  <Link href="/dashboard/profile" onClick={() => setProfileOpen(false)}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 13, color: "var(--ink-2)", textDecoration: "none" }}
                    className="hover:bg-[var(--paper-2)]">
                    View Profile
                  </Link>
                  <div style={{ height: 1, background: "var(--hairline)", margin: "2px 0" }} />
                  <button onClick={handleSignOut}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 13, color: "oklch(0.577 0.245 27.325)", background: "none", border: "none", cursor: "pointer", width: "100%", fontFamily: "var(--font-ui)" }}>
                    <IcoLogout /> Sign out
                  </button>
                </div>
              )}
            </div>
          )}
          {!user.currentStreak && (
            <div ref={profileRef} style={{ position: "relative" }}>
              <button onClick={() => setProfileOpen(!profileOpen)}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6, fontFamily: "var(--font-ui)" }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: "var(--ds-accent)", color: "white",
                  display: "grid", placeItems: "center", fontSize: 11, fontWeight: 500,
                }}>{initials}</div>
                <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{user.displayName.split(" ")[0]}</span>
              </button>
              {profileOpen && (
                <div style={{
                  position: "absolute", bottom: "100%", left: 0, marginBottom: 6,
                  background: "var(--paper)", border: "1px solid var(--hairline)", borderRadius: 8,
                  boxShadow: "var(--shadow-modal)", zIndex: 50, minWidth: 160, overflow: "hidden",
                }}>
                  <Link href="/dashboard/profile" onClick={() => setProfileOpen(false)}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 13, color: "var(--ink-2)", textDecoration: "none" }}>
                    View Profile
                  </Link>
                  <div style={{ height: 1, background: "var(--hairline)", margin: "2px 0" }} />
                  <button onClick={handleSignOut}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 13, color: "oklch(0.577 0.245 27.325)", background: "none", border: "none", cursor: "pointer", width: "100%", fontFamily: "var(--font-ui)" }}>
                    <IcoLogout /> Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Topbar */}
        <header style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "0 28px", borderBottom: "1px solid var(--hairline)",
          background: "var(--paper)", height: 56, flexShrink: 0,
          position: "sticky", top: 0, zIndex: 30,
        }}>
          {/* Mobile menu button */}
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden"
            style={{ color: "var(--ink-3)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <IcoMenu />
          </button>

          <div style={{ flex: 1 }} />

          {/* Notification bell */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              style={{
                width: 32, height: 32, display: "grid", placeItems: "center",
                borderRadius: 6, color: "var(--ink-2)", background: "transparent",
                border: "1px solid transparent", cursor: "pointer", position: "relative",
              }}
              title="Notifications"
            >
              <IcoBell />
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: 7, right: 8,
                  width: 6, height: 6, borderRadius: "50%",
                  background: "var(--ds-accent)", border: "1.5px solid var(--paper)",
                }} />
              )}
            </button>

            {notifOpen && (
              <div style={{
                position: "absolute", right: 0, top: "100%", marginTop: 6,
                width: 288, borderRadius: 8, border: "1px solid var(--hairline)",
                background: "var(--paper)", boxShadow: "var(--shadow-modal)", zIndex: 50, overflow: "hidden",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--hairline)" }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-1)", margin: 0 }}>Notifications</p>
                  <button onClick={() => setNotifOpen(false)} style={{ color: "var(--ink-3)", background: "none", border: "none", cursor: "pointer" }}><IcoX /></button>
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: "32px 16px", textAlign: "center" }}>
                    <IcoBell className="mx-auto" />
                    <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 8 }}>No notifications</p>
                  </div>
                ) : (
                  <div style={{ maxHeight: 256, overflowY: "auto" }}>
                    {notifications.slice(0, 20).map(n => (
                      <div key={n.id} style={{
                        padding: "10px 16px", borderTop: "1px solid var(--hairline)",
                        background: !n.isRead ? "var(--ds-accent-soft)" : "transparent",
                      }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-1)", margin: "0 0 2px" }}>{n.title}</p>
                        <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>{n.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Avatar */}
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "var(--ds-accent)", color: "white",
            display: "grid", placeItems: "center", fontSize: 11, fontWeight: 500,
            cursor: "pointer", border: "1px solid var(--hairline)", flexShrink: 0, overflow: "hidden",
          }}>
            {user.photoURL
              ? <img src={user.photoURL} alt={user.displayName} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
              : initials}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </main>
      </div>

      <TutorialModal open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
    </div>
  );
}
