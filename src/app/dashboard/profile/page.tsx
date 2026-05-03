"use client";
import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { updateUserProfile } from "@/lib/firestore";
import { getInitials, getStreakLevel } from "@/lib/utils";
import { TRANSLATIONS } from "@/lib/bible-data";
import { THEMES } from "@/lib/themes";
import type { BibleTranslation } from "@/types";
import type { ThemeId } from "@/lib/themes";
import {
  Edit2, Save, X, Flame, Star, Trophy, BookOpen,
  Bell, BellOff, ChevronRight, Shield, Check, Camera,
  Users, BookMarked, Zap, Award, ListChecks, Palette,
} from "lucide-react";
import toast from "react-hot-toast";

const STAT_ICONS: Record<string, React.ElementType> = {
  "Days Read": BookOpen,
  "Current Streak": Flame,
  "Longest Streak": Star,
  "Friends": Users,
  "Groups": Users,
  "Badges": Trophy,
};

const MILESTONE_ICONS: Record<number, React.ElementType> = {
  7: Flame,
  30: Star,
  100: Zap,
  365: Award,
};

const BADGE_ICONS: Record<string, React.ElementType> = {
  streak_1: BookOpen, streak_7: Flame, streak_30: Star,
  streak_100: Zap, streak_365: Award,
  reading_10: BookMarked, reading_50: Star, reading_200: BookOpen,
  social_friend: Users, social_group: Users,
  achievement_plan: ListChecks, achievement_longest_7: Trophy,
};

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const { theme: activeTheme, setTheme } = useThemeStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    preferredTranslation: user?.preferredTranslation || "KJV",
    notificationsEnabled: user?.notificationsEnabled ?? true,
  });
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const streakLevel = getStreakLevel(user.currentStreak);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: form.displayName,
        bio: form.bio,
        preferredTranslation: form.preferredTranslation as BibleTranslation,
        notificationsEnabled: form.notificationsEnabled,
      });
      setUser({ ...user, ...form, preferredTranslation: form.preferredTranslation as BibleTranslation });
      setEditing(false);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleThemeChange(themeId: ThemeId) {
    setTheme(themeId);
    if (!user) return;
    try {
      await updateUserProfile(user.uid, { theme: themeId });
      setUser({ ...user, theme: themeId });
    } catch {
      // Theme is already applied locally; Firestore sync failure is non-critical
    }
  }

  const STATS = [
    { label: "Days Read", value: user.totalDaysRead },
    { label: "Current Streak", value: `${user.currentStreak}d` },
    { label: "Longest Streak", value: `${user.longestStreak}d` },
    { label: "Friends", value: user.friendIds?.length || 0 },
    { label: "Groups", value: user.groupIds?.length || 0 },
    { label: "Badges", value: user.badges.length },
  ];

  const MILESTONES = [
    { streak: 7, name: "Week Warrior", desc: "Read for 7 consecutive days" },
    { streak: 30, name: "Monthly Devotee", desc: "Read for 30 consecutive days" },
    { streak: 100, name: "Century Scholar", desc: "Read for 100 consecutive days" },
    { streak: 365, name: "Year of Faith", desc: "Read for 365 consecutive days" },
  ];

  const lightThemes = THEMES.filter((t) => !t.isDark);
  const darkThemes  = THEMES.filter((t) =>  t.isDark);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-6">

      {/* Profile header */}
      <div className="card p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-20 bg-primary/10" />

        <div className="relative flex flex-col md:flex-row items-start md:items-end gap-5 pt-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-gray-900 overflow-hidden bg-primary">
              {user.photoURL
                ? <img src={user.photoURL} alt={user.displayName} className="w-20 h-20 object-cover" />
                : getInitials(user.displayName)}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-gray-900 border-2 border-card bg-primary"
              title="Change photo">
              <Camera size={12} />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <input type="text" value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                className="input-field text-xl font-display font-bold mb-1 py-1.5 w-full max-w-xs" />
            ) : (
              <h1 className="text-2xl font-display font-bold text-foreground">{user.displayName}</h1>
            )}
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-sm font-semibold ${streakLevel.color}`}>{streakLevel.label}</span>
              {user.currentStreak > 0 && (
                <div className="flex items-center gap-1 text-sm text-orange-400 font-semibold">
                  <Flame size={14} /> {user.currentStreak} day streak
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="btn-ghost text-sm py-2 px-4">
                  <X size={15} /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2 px-4">
                  {saving ? "Saving..." : <><Save size={15} /> Save</>}
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="btn-ghost text-sm py-2 px-4">
                <Edit2 size={15} /> Edit
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          {editing ? (
            <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Write a short bio..." rows={2}
              className="input-field resize-none text-sm w-full" />
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {user.bio || <span className="italic">No bio yet — add one to let friends know about you.</span>}
            </p>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Stats</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {STATS.map((stat) => {
            const IconComp = STAT_ICONS[stat.label] || Star;
            return (
              <div key={stat.label} className="card p-3 text-center">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 bg-primary/10">
                  <IconComp size={16} className="text-primary" />
                </div>
                <p className="text-lg font-display font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Streak milestone tracker */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Flame size={15} className="text-orange-400" />
          Streak Milestones
        </h2>
        <div className="space-y-3">
          {MILESTONES.map((milestone) => {
            const earned = user.currentStreak >= milestone.streak ||
              user.badges.some((b) => b.id === `streak_${milestone.streak}`);
            const progress = Math.min(100, (user.currentStreak / milestone.streak) * 100);
            const IconComp = MILESTONE_ICONS[milestone.streak] || Star;
            return (
              <div key={milestone.streak}
                className={`p-4 rounded-xl flex items-center gap-4 transition-all border ${earned ? "bg-primary/8 border-primary/20" : "bg-secondary border-transparent opacity-70"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${earned ? "bg-primary/10" : "bg-border"}`}>
                  <IconComp size={18} className={earned ? "text-primary" : "text-muted-foreground"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-foreground">{milestone.name}</span>
                    {earned && <span className="badge-accent text-xs">Earned</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{milestone.desc}</p>
                  {!earned && (
                    <div className="progress-gold mt-2">
                      <div className="progress-gold-fill" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {earned ? (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-primary/10">
                      <Check size={14} className="text-primary" />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground font-medium">{milestone.streak}d</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Earned badges */}
      {user.badges.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Trophy size={15} className="text-primary" />
            My Badges ({user.badges.length})
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {user.badges.map((badge) => {
              const IconComp = BADGE_ICONS[badge.id] || Trophy;
              return (
                <div key={badge.id}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl text-center bg-secondary hover:opacity-80 transition-all"
                  title={badge.description}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
                    <IconComp size={18} className="text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground leading-tight">{badge.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Appearance ──────────────────────────────────────────────────────── */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
          <Palette size={15} className="text-primary" />
          Appearance
        </h2>
        <p className="text-xs text-muted-foreground mb-5">Choose a theme for the app. Changes apply instantly.</p>

        {/* Light themes */}
        <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-4)", fontWeight: 500, marginBottom: 10 }}>Light</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
          {lightThemes.map((t) => (
            <ThemeCard key={t.id} theme={t} active={activeTheme === t.id} onSelect={handleThemeChange} />
          ))}
        </div>

        {/* Dark themes */}
        <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-4)", fontWeight: 500, marginBottom: 10 }}>Dark</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {darkThemes.map((t) => (
            <ThemeCard key={t.id} theme={t} active={activeTheme === t.id} onSelect={handleThemeChange} />
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Shield size={15} className="text-primary" />
          Preferences
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Preferred Translation</p>
              <p className="text-xs text-muted-foreground">Default Bible translation</p>
            </div>
            {editing ? (
              <select value={form.preferredTranslation}
                onChange={(e) => setForm((f) => ({ ...f, preferredTranslation: e.target.value as BibleTranslation }))}
                className="input-field w-32 py-1.5 text-sm">
                {TRANSLATIONS.map((t) => (
                  <option key={t.id} value={t.id}>{t.id}</option>
                ))}
              </select>
            ) : (
              <span className="badge-accent">{user.preferredTranslation}</span>
            )}
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user.notificationsEnabled
                ? <Bell size={16} className="text-primary" />
                : <BellOff size={16} className="text-muted-foreground" />}
              <div>
                <p className="text-sm font-medium text-foreground">Reading Reminders</p>
                <p className="text-xs text-muted-foreground">Daily notifications to read</p>
              </div>
            </div>
            <button
              onClick={() => { if (editing) setForm((f) => ({ ...f, notificationsEnabled: !f.notificationsEnabled })); }}
              className={`relative w-11 h-6 rounded-full transition-all ${(editing ? form.notificationsEnabled : user.notificationsEnabled) ? "bg-primary" : "bg-muted-foreground/30"}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${(editing ? form.notificationsEnabled : user.notificationsEnabled) ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-foreground">Account Email</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <ChevronRight size={15} className="text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Theme card swatch ─────────────────────────────────────────────────────────

interface ThemeCardProps {
  theme: (typeof THEMES)[number];
  active: boolean;
  onSelect: (id: ThemeId) => void;
}

function ThemeCard({ theme, active, onSelect }: ThemeCardProps) {
  const [bg, sidebar, accent] = theme.preview;

  return (
    <button
      onClick={() => onSelect(theme.id)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: 0,
        background: "none",
        border: "none",
        cursor: "pointer",
        outline: "none",
        textAlign: "left",
      }}
    >
      {/* Color preview */}
      <div style={{
        borderRadius: 8,
        overflow: "hidden",
        height: 52,
        display: "flex",
        border: active
          ? "2px solid var(--accent-btn)"
          : "2px solid var(--hairline)",
        transition: "border-color 120ms",
        boxShadow: active ? "0 0 0 3px var(--accent-soft)" : "none",
      }}>
        {/* Sidebar strip */}
        <div style={{ width: "28%", background: sidebar, flexShrink: 0 }} />
        {/* Main content area */}
        <div style={{
          flex: 1,
          background: bg,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "5px 6px",
          gap: 3,
        }}>
          {/* Mock card line */}
          <div style={{ height: 4, borderRadius: 2, background: accent, width: "70%", opacity: 0.9 }} />
          <div style={{ height: 3, borderRadius: 2, background: accent, width: "45%", opacity: 0.4 }} />
        </div>
      </div>

      {/* Label */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 1 }}>
        <span style={{
          fontSize: 11.5,
          fontWeight: active ? 500 : 400,
          color: active ? "var(--ink-1)" : "var(--ink-3)",
          fontFamily: "var(--font-ui)",
          transition: "color 120ms",
        }}>
          {theme.name}
        </span>
        {active && (
          <div style={{
            width: 14, height: 14,
            borderRadius: "50%",
            background: "var(--accent-btn)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}>
            <Check size={9} color="white" />
          </div>
        )}
      </div>
    </button>
  );
}
