"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { updateUserProfile, checkUsernameAvailable, updateUsername, deleteUserAccount } from "@/lib/firestore";
import { getInitials, getStreakLevel } from "@/lib/utils";
import { TRANSLATIONS } from "@/lib/bible-data";
import { THEMES } from "@/lib/themes";
import type { BibleTranslation } from "@/types";
import type { ThemeId } from "@/lib/themes";
import {
  Edit2, Save, X, Flame, Star, Trophy, BookOpen,
  Bell, BellOff, ChevronRight, Shield, Check, Loader2,
  Users, BookMarked, Zap, Award, ListChecks, Palette,
  AtSign, AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

const STAT_ICONS: Record<string, React.ElementType> = {
  "Days Read": BookOpen, "Current Streak": Flame, "Longest Streak": Star,
  "Friends": Users, "Groups": Users, "Badges": Trophy,
};
const MILESTONE_ICONS: Record<number, React.ElementType> = {
  7: Flame, 30: Star, 100: Zap, 365: Award,
};
const BADGE_ICONS: Record<string, React.ElementType> = {
  streak_1: BookOpen, streak_7: Flame, streak_30: Star,
  streak_100: Zap, streak_365: Award,
  reading_10: BookMarked, reading_50: Star, reading_200: BookOpen,
  social_friend: Users, social_group: Users,
  achievement_plan: ListChecks, achievement_longest_7: Trophy,
};

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "unchanged" | "short";

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const { theme: activeTheme, setTheme } = useThemeStore();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm]     = useState("");
  const [deleting, setDeleting]               = useState(false);
  const [usernameStatus, setUsernameStatus]   = useState<UsernameStatus>("idle");
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [form, setForm] = useState({
    displayName:          user?.displayName || "",
    username:             user?.username || "",
    bio:                  user?.bio || "",
    preferredTranslation: user?.preferredTranslation || "KJV",
    notificationsEnabled: user?.notificationsEnabled ?? true,
  });

  if (!user) return null;

  const streakLevel = getStreakLevel(user.currentStreak);

  function handleUsernameInput(raw: string) {
    const val = raw.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setForm(f => ({ ...f, username: val }));
    clearTimeout(usernameTimer.current);
    if (val === (user?.username ?? "")) { setUsernameStatus("unchanged"); return; }
    if (val.length < 3) { setUsernameStatus("short"); return; }
    setUsernameStatus("checking");
    usernameTimer.current = setTimeout(async () => {
      try {
        const ok = await checkUsernameAvailable(val);
        setUsernameStatus(ok ? "available" : "taken");
      } catch { setUsernameStatus("idle"); }
    }, 500);
  }

  async function handleSave() {
    if (!user) return;
    if (form.username !== user.username) {
      if (usernameStatus === "taken")  { toast.error("That username is already taken"); return; }
      if (usernameStatus === "short")  { toast.error("Username must be at least 3 characters"); return; }
      if (usernameStatus === "checking") { toast.error("Still checking username — try again"); return; }
    }
    setSaving(true);
    try {
      if (form.username !== user.username) {
        await updateUsername(user.uid, user.username, form.username);
      }
      const updates = {
        displayName:          form.displayName,
        bio:                  form.bio,
        preferredTranslation: form.preferredTranslation as BibleTranslation,
        notificationsEnabled: form.notificationsEnabled,
      };
      await updateUserProfile(user.uid, updates);
      setUser({ ...user, ...updates, username: form.username });
      setEditing(false);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    if (!user) return;
    setForm({
      displayName:          user.displayName,
      username:             user.username,
      bio:                  user.bio || "",
      preferredTranslation: user.preferredTranslation,
      notificationsEnabled: user.notificationsEnabled,
    });
    setUsernameStatus("idle");
    setEditing(false);
  }

  async function handleThemeChange(themeId: ThemeId) {
    setTheme(themeId);
    if (!user) return;
    try {
      await updateUserProfile(user.uid, { theme: themeId });
      setUser({ ...user, theme: themeId });
    } catch { /* non-critical */ }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE" || !user) return;
    setDeleting(true);
    try {
      await deleteUserAccount(user.uid, user.username);
      const { getAuth, deleteUser } = await import("firebase/auth");
      const auth = getAuth();
      if (auth.currentUser) await deleteUser(auth.currentUser);
      setUser(null);
      router.replace("/");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/requires-recent-login") {
        toast.error("Please sign out and sign back in, then try again.");
      } else {
        toast.error("Failed to delete account. Please try again.");
      }
      setDeleting(false);
    }
  }

  const STATS = [
    { label: "Days Read",       value: user.totalDaysRead },
    { label: "Current Streak",  value: `${user.currentStreak}d` },
    { label: "Longest Streak",  value: `${user.longestStreak}d` },
    { label: "Friends",         value: user.friendIds?.length || 0 },
    { label: "Groups",          value: user.groupIds?.length || 0 },
    { label: "Badges",          value: user.badges.length },
  ];

  const MILESTONES = [
    { streak: 7,   name: "Week Warrior",    desc: "Read for 7 consecutive days" },
    { streak: 30,  name: "Monthly Devotee", desc: "Read for 30 consecutive days" },
    { streak: 100, name: "Century Scholar", desc: "Read for 100 consecutive days" },
    { streak: 365, name: "Year of Faith",   desc: "Read for 365 consecutive days" },
  ];

  const lightThemes = THEMES.filter(t => !t.isDark);
  const darkThemes  = THEMES.filter(t =>  t.isDark);

  const uStatus = usernameStatus;
  const usernameHint =
    uStatus === "checking"  ? { text: "Checking…",   color: "var(--ink-4)" } :
    uStatus === "available" ? { text: "Available ✓",  color: "oklch(52% 0.14 145)" } :
    uStatus === "taken"     ? { text: "Already taken", color: "oklch(57.7% 0.245 27.3)" } :
    uStatus === "short"     ? { text: "Min 3 characters", color: "var(--ink-4)" } :
    null;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 24px 56px" }}>

      {/* ── Profile header ─────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: "28px 24px 20px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 64, background: "var(--accent-soft)" }} />

        <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 18, flexWrap: "wrap", paddingTop: 8 }}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 76, height: 76, borderRadius: 16,
              background: "var(--accent-soft-2)",
              border: "3px solid var(--paper)",
              overflow: "hidden",
              display: "grid", placeItems: "center",
              fontSize: 22, fontWeight: 600, color: "var(--accent-ink)",
            }}>
              {user.photoURL
                ? <img src={user.photoURL} alt={user.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : getInitials(user.displayName)}
            </div>
          </div>

          {/* Name + username */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {editing ? (
              <>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                  className="input-field"
                  style={{ fontSize: 18, fontWeight: 600, marginBottom: 6, maxWidth: 260 }}
                  placeholder="Display name"
                />
                <div style={{ position: "relative", maxWidth: 220 }}>
                  <AtSign size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", pointerEvents: "none" }} />
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => handleUsernameInput(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: 28, fontSize: 13, height: 30 }}
                    placeholder="username"
                  />
                </div>
                {usernameHint && (
                  <p style={{ fontSize: 11.5, color: usernameHint.color, margin: "4px 0 0", fontWeight: 500 }}>
                    {usernameHint.text}
                  </p>
                )}
              </>
            ) : (
              <>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink-1)", margin: "0 0 2px", letterSpacing: "-0.01em" }}>
                  {user.displayName}
                </h1>
                <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: "0 0 6px" }}>@{user.username}</p>
              </>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-ink)" }}>{streakLevel.label}</span>
              {user.currentStreak > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "oklch(65% 0.18 42)", fontWeight: 600 }}>
                  <Flame size={13} /> {user.currentStreak} day streak
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {editing ? (
              <>
                <button onClick={handleCancelEdit} className="btn btn-sm"><X size={13} /> Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary btn-sm">
                  {saving ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={13} />}
                  {saving ? "Saving…" : "Save"}
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="btn btn-sm"><Edit2 size={13} /> Edit</button>
            )}
          </div>
        </div>

        {/* Bio */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--hairline)" }}>
          {editing ? (
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Write a short bio…"
              rows={2}
              className="input-field"
              style={{ resize: "none", fontSize: 13, width: "100%" }}
            />
          ) : (
            <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0, lineHeight: 1.6, fontStyle: user.bio ? "normal" : "italic" }}>
              {user.bio || "No bio yet — add one to let friends know about you."}
            </p>
          )}
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <div className="card-label" style={{ marginBottom: 10 }}>Stats</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {STATS.map(stat => {
            const Icon = STAT_ICONS[stat.label] || Star;
            return (
              <div key={stat.label} className="card" style={{ padding: "14px 12px", textAlign: "center" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent-soft)", margin: "0 auto 8px", display: "grid", placeItems: "center" }}>
                  <Icon size={14} style={{ color: "var(--accent-ink)" }} />
                </div>
                <p style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-1)", margin: "0 0 2px", fontFamily: "var(--font-serif)" }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: 11, color: "var(--ink-4)", margin: 0, lineHeight: 1.3 }}>{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Streak milestones ───────────────────────────────────────────────── */}
      <div className="card" style={{ padding: "18px 20px", marginBottom: 16 }}>
        <div className="card-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Flame size={12} style={{ color: "oklch(65% 0.18 42)" }} /> Streak Milestones
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {MILESTONES.map(m => {
            const earned = user.currentStreak >= m.streak || user.badges.some(b => b.id === `streak_${m.streak}`);
            const progress = Math.min(100, (user.currentStreak / m.streak) * 100);
            const Icon = MILESTONE_ICONS[m.streak] || Star;
            return (
              <div key={m.streak} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10,
                background: earned ? "var(--accent-soft)" : "var(--paper-2)",
                border: `1px solid ${earned ? "var(--accent-border)" : "var(--hairline)"}`,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center", background: earned ? "var(--accent-soft-2)" : "var(--paper-3)" }}>
                  <Icon size={16} style={{ color: earned ? "var(--accent-ink)" : "var(--ink-4)" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-1)" }}>{m.name}</span>
                    {earned && <span className="badge-accent" style={{ fontSize: 10.5 }}>Earned</span>}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>{m.desc}</p>
                  {!earned && (
                    <div style={{ height: 3, borderRadius: 2, background: "var(--paper-3)", marginTop: 6, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, background: "var(--accent-btn)", width: `${progress}%` }} />
                    </div>
                  )}
                </div>
                <div style={{ flexShrink: 0 }}>
                  {earned
                    ? <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent-btn)", display: "grid", placeItems: "center" }}><Check size={12} color="white" /></div>
                    : <span style={{ fontSize: 11.5, color: "var(--ink-4)", fontWeight: 500 }}>{m.streak}d</span>
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Badges ─────────────────────────────────────────────────────────── */}
      {user.badges.length > 0 && (
        <div className="card" style={{ padding: "18px 20px", marginBottom: 16 }}>
          <div className="card-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Trophy size={12} /> My Badges ({user.badges.length})
          </div>
          <div className="badge-grid-5">
            {user.badges.map(badge => {
              const Icon = BADGE_ICONS[badge.id] || Trophy;
              return (
                <div key={badge.id} title={badge.description} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 8px", borderRadius: 10, background: "var(--paper-2)", textAlign: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--accent-soft)", display: "grid", placeItems: "center" }}>
                    <Icon size={16} style={{ color: "var(--accent-ink)" }} />
                  </div>
                  <span style={{ fontSize: 11, color: "var(--ink-3)", lineHeight: 1.3 }}>{badge.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Appearance ─────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: "18px 20px", marginBottom: 16 }}>
        <div className="card-label" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <Palette size={12} /> Appearance
        </div>
        <p style={{ fontSize: 12.5, color: "var(--ink-4)", margin: "0 0 18px" }}>Choose a theme. Changes apply instantly.</p>

        <p style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-4)", fontWeight: 600, margin: "0 0 10px" }}>Light</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: 10, marginBottom: 20 }}>
          {lightThemes.map(t => <ThemeCard key={t.id} theme={t} active={activeTheme === t.id} onSelect={handleThemeChange} />)}
        </div>

        <p style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-4)", fontWeight: 600, margin: "0 0 10px" }}>Dark</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: 10 }}>
          {darkThemes.map(t => <ThemeCard key={t.id} theme={t} active={activeTheme === t.id} onSelect={handleThemeChange} />)}
        </div>
      </div>

      {/* ── Preferences ────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: "18px 20px", marginBottom: 16 }}>
        <div className="card-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Shield size={12} /> Preferences
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Translation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-1)", margin: "0 0 2px" }}>Preferred Translation</p>
              <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>Default Bible translation</p>
            </div>
            {editing ? (
              <select
                value={form.preferredTranslation}
                onChange={e => setForm(f => ({ ...f, preferredTranslation: e.target.value as BibleTranslation }))}
                className="input-field"
                style={{ width: 100, height: 30, fontSize: 12.5, padding: "0 8px" }}
              >
                {TRANSLATIONS.map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
              </select>
            ) : (
              <span className="badge-accent">{user.preferredTranslation}</span>
            )}
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--hairline)", margin: 0 }} />

          {/* Notifications */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {user.notificationsEnabled
                ? <Bell size={15} style={{ color: "var(--accent-ink)" }} />
                : <BellOff size={15} style={{ color: "var(--ink-4)" }} />}
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-1)", margin: "0 0 2px" }}>Reading Reminders</p>
                <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>Daily notifications to read</p>
              </div>
            </div>
            <button
              onClick={() => { if (editing) setForm(f => ({ ...f, notificationsEnabled: !f.notificationsEnabled })); }}
              className="toggle-track"
              style={{ opacity: editing ? 1 : 0.5 }}
            >
              <span className={`toggle-thumb${(editing ? form.notificationsEnabled : user.notificationsEnabled) ? " on" : ""}`} />
            </button>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--hairline)", margin: 0 }} />

          {/* Email (read-only) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-1)", margin: "0 0 2px" }}>Account Email</p>
              <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>{user.email}</p>
            </div>
            <ChevronRight size={15} style={{ color: "var(--ink-4)" }} />
          </div>
        </div>
      </div>

      {/* ── Danger Zone ────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: "18px 20px", borderColor: "oklch(88% 0.04 27)" }}>
        <div className="card-label" style={{ display: "flex", alignItems: "center", gap: 6, color: "oklch(57.7% 0.245 27.3)" }}>
          <AlertTriangle size={12} /> Danger Zone
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-1)", margin: "0 0 2px" }}>Delete Account</p>
            <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>
              Permanently removes your account and all associated data.
            </p>
          </div>
          <button
            onClick={() => { setDeleteConfirm(""); setShowDeleteModal(true); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              height: 32, padding: "0 12px", borderRadius: 6, fontSize: 13,
              fontWeight: 500, fontFamily: "var(--font-ui)",
              background: "oklch(57.7% 0.245 27.3)", color: "white",
              border: "none", cursor: "pointer", flexShrink: 0,
            }}
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* ── Delete confirmation modal ───────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}>
          <div className="modal-panel" style={{ maxWidth: 420 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "oklch(96% 0.02 27)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <AlertTriangle size={18} style={{ color: "oklch(57.7% 0.245 27.3)" }} />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-1)", margin: 0 }}>Delete your account?</h2>
                <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>This action cannot be undone.</p>
              </div>
            </div>

            <div style={{ background: "oklch(97% 0.01 27)", border: "1px solid oklch(88% 0.04 27)", borderRadius: 8, padding: "12px 14px", marginBottom: 18, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
              All your data will be permanently deleted, including reading progress, annotations, highlights, bookmarks, and group memberships.
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                className="input-field"
                placeholder="DELETE"
                autoComplete="off"
              />
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-sm" disabled={deleting}>
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "DELETE" || deleting}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  height: 26, padding: "0 10px", borderRadius: 6, fontSize: 12,
                  fontWeight: 500, fontFamily: "var(--font-ui)",
                  background: deleteConfirm === "DELETE" ? "oklch(57.7% 0.245 27.3)" : "var(--paper-3)",
                  color: deleteConfirm === "DELETE" ? "white" : "var(--ink-4)",
                  border: "none", cursor: deleteConfirm === "DELETE" ? "pointer" : "not-allowed",
                  transition: "background 120ms",
                }}
              >
                {deleting ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : null}
                {deleting ? "Deleting…" : "Delete my account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Theme swatch card ─────────────────────────────────────────────────────────

function ThemeCard({ theme, active, onSelect }: {
  theme: (typeof THEMES)[number];
  active: boolean;
  onSelect: (id: ThemeId) => void;
}) {
  const [bg, sidebar, accent] = theme.preview;
  return (
    <button
      onClick={() => onSelect(theme.id)}
      style={{ display: "flex", flexDirection: "column", gap: 5, padding: 0, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
    >
      <div style={{
        borderRadius: 8, overflow: "hidden", height: 50,
        display: "flex",
        border: active ? "2px solid var(--accent-btn)" : "2px solid var(--hairline)",
        boxShadow: active ? "0 0 0 3px var(--accent-soft)" : "none",
        transition: "border-color 120ms, box-shadow 120ms",
      }}>
        <div style={{ width: "26%", background: sidebar, flexShrink: 0 }} />
        <div style={{ flex: 1, background: bg, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "5px 6px", gap: 3 }}>
          <div style={{ height: 4, borderRadius: 2, background: accent, width: "68%", opacity: 0.95 }} />
          <div style={{ height: 3, borderRadius: 2, background: accent, width: "42%", opacity: 0.4 }} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 1 }}>
        <span style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? "var(--ink-1)" : "var(--ink-3)", fontFamily: "var(--font-ui)", transition: "color 120ms" }}>
          {theme.name}
        </span>
        {active && (
          <div style={{ width: 13, height: 13, borderRadius: "50%", background: "var(--accent-btn)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Check size={8} color="white" />
          </div>
        )}
      </div>
    </button>
  );
}
