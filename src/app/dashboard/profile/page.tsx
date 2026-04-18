"use client";
import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { updateUserProfile } from "@/lib/firestore";
import { getInitials, getStreakLevel } from "@/lib/utils";
import { TRANSLATIONS } from "@/lib/bible-data";
import type { BibleTranslation } from "@/types";
import {
  Edit2, Save, X, Flame, Star, Trophy, BookOpen,
  Bell, BellOff, ChevronRight, Shield, Check, Camera,
  Users, BookMarked, Zap, Award, ListChecks,
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

  const STATS = [
    { label: "Days Read", value: user.totalDaysRead, color: "var(--primary)" },
    { label: "Current Streak", value: `${user.currentStreak}d`, color: "#f97316" },
    { label: "Longest Streak", value: `${user.longestStreak}d`, color: "#a855f7" },
    { label: "Friends", value: user.friendIds?.length || 0, color: "#22c55e" },
    { label: "Groups", value: user.groupIds?.length || 0, color: "#0891b2" },
    { label: "Badges", value: user.badges.length, color: "#eab308" },
  ];

  const MILESTONES = [
    { streak: 7, name: "Week Warrior", desc: "Read for 7 consecutive days" },
    { streak: 30, name: "Monthly Devotee", desc: "Read for 30 consecutive days" },
    { streak: 100, name: "Century Scholar", desc: "Read for 100 consecutive days" },
    { streak: 365, name: "Year of Faith", desc: "Read for 365 consecutive days" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Profile header */}
      <div className="card p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-20"
          style={{ background: "linear-gradient(135deg, rgba(29,78,216,0.18) 0%, oklch(from var(--primary) l c h / 0.12) 100%)" }} />

        <div className="relative flex flex-col md:flex-row items-start md:items-end gap-5 pt-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-gray-900 overflow-hidden"
              style={{ background: "var(--primary)", boxShadow: "0 0 20px oklch(from var(--primary) l c h / 0.12)" }}>
              {user.photoURL
                ? <img src={user.photoURL} alt={user.displayName} className="w-20 h-20 object-cover" />
                : getInitials(user.displayName)}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-gray-900 border-2 border-[var(--bg-card)]"
              style={{ background: "var(--primary)" }}
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
              {user.bio || <span className="text-muted-foreground italic">No bio yet — add one to let friends know about you.</span>}
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
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
                  style={{ background: `${stat.color}18` }}>
                  <IconComp size={16} style={{ color: stat.color }} />
                </div>
                <p className="text-lg font-display font-bold" style={{ color: stat.color }}>{stat.value}</p>
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
                className={`p-4 rounded-xl flex items-center gap-4 transition-all ${earned ? "" : "opacity-70"}`}
                style={{
                  background: earned ? "oklch(from var(--primary) l c h / 0.12)" : "var(--bg-secondary)",
                  border: earned ? "1px solid oklch(from var(--primary) l c h / 0.12)" : "1px solid transparent",
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: earned ? "oklch(from var(--primary) l c h / 0.12)" : "var(--border)" }}>
                  <IconComp size={18} className={earned ? "text-primary" : "text-muted-foreground"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-foreground">{milestone.name}</span>
                    {earned && <span className="badge-cobalt text-xs">Earned</span>}
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
                    <div className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: "var(--primary)/0.1" }}>
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
                  className="flex flex-col items-center gap-2 p-3 rounded-xl text-center hover:opacity-80 transition-all"
                  style={{ background: "var(--bg-secondary)" }}
                  title={badge.description}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "var(--accent)"}}>
                    <IconComp size={18} className="text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground leading-tight">{badge.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
              <span className="badge-cobalt">{user.preferredTranslation}</span>
            )}
          </div>

          <div className="h-px" style={{ background: "var(--border)" }} />

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
              className={`relative w-11 h-6 rounded-full transition-all ${(editing ? form.notificationsEnabled : user.notificationsEnabled) ? "" : "bg-gray-600"}`}
              style={(editing ? form.notificationsEnabled : user.notificationsEnabled) ? { background: "linear-gradient(90deg, var(--primary), var(--primary))" } : {}}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${(editing ? form.notificationsEnabled : user.notificationsEnabled) ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>

          <div className="h-px" style={{ background: "var(--border)" }} />

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
