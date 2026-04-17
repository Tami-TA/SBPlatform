"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";
import {
  BookOpen, Flame, Users, ListChecks, Star, ArrowRight,
  Share2, Copy, Sparkles, ChevronRight, Award, Target,
} from "lucide-react";
import { getTodaysVerse } from "@/lib/bible-data";
import { getUserPlanProgress } from "@/lib/firestore";
import { getStreakLevel, formatVerseRef, shareVerse } from "@/lib/utils";
import { getBadgeStatus, RARITY_STYLES } from "@/lib/badges";
import type { UserPlanProgress } from "@/types";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<UserPlanProgress[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const todaysVerse = getTodaysVerse();

  useEffect(() => {
    if (!user) return;
    getUserPlanProgress(user.uid)
      .then(setPlans)
      .finally(() => setLoadingPlans(false));
  }, [user]);

  if (!user) return null;

  const streakLevel = getStreakLevel(user.currentStreak);
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  function handleShareVerse() {
    shareVerse(todaysVerse.text, formatVerseRef(todaysVerse.bookName, todaysVerse.chapter, todaysVerse.verse));
    toast.success("Verse copied to clipboard!");
  }

  const QUICK_LINKS = [
    { href: "/dashboard/bible", icon: BookOpen, label: "Open Bible", color: "#D4AF37" },
    { href: "/dashboard/plans", icon: ListChecks, label: "My Plans", color: "#2563eb" },
    { href: "/dashboard/groups", icon: Users, label: "Groups", color: "#7C3AED" },
    { href: "/dashboard/friends", icon: Star, label: "Friends", color: "#0891B2" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Welcome header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-page">
            {greeting()}, {user.displayName.split(" ")[0]} 👋
          </h1>
          <p className="text-secondary-page mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        {user.currentStreak > 0 && (
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl animate-glow-pulse"
              style={{ background: "linear-gradient(135deg, rgba(251,146,60,0.2), rgba(239,68,68,0.2))", border: "1px solid rgba(251,146,60,0.4)" }}>
              🔥
            </div>
            <span className="text-xs font-bold text-orange-400">{user.currentStreak} days</span>
          </div>
        )}
      </div>

      {/* Top row: Streak + Verse of Day */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Streak card */}
        <div className="card p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(29,78,216,0.08) 0%, var(--bg-card) 100%)" }}>
          <div className="absolute -top-4 -right-4 w-20 h-20 star-shape opacity-5" style={{ background: "var(--cobalt)" }} />
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-page flex items-center gap-2">
              <Flame size={18} className="text-orange-400" />
              Your Streak
            </h3>
            <span className={`text-xs font-bold ${streakLevel.color}`}>{streakLevel.emoji} {streakLevel.label}</span>
          </div>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-5xl font-display font-bold text-gold-gradient">{user.currentStreak}</p>
              <p className="text-sm text-muted-page mt-1">days in a row</p>
            </div>
            <div className="flex-1 space-y-2 pb-1">
              <div className="flex justify-between text-xs text-muted-page">
                <span>Longest</span>
                <span className="font-semibold text-secondary-page">{user.longestStreak} days</span>
              </div>
              <div className="flex justify-between text-xs text-muted-page">
                <span>Total days read</span>
                <span className="font-semibold text-secondary-page">{user.totalDaysRead}</span>
              </div>
            </div>
          </div>
          {/* Milestone bar */}
          {user.currentStreak < 7 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-page mb-1.5">
                <span>Next milestone</span>
                <span>{7 - user.currentStreak} days to 🔥 Week Warrior</span>
              </div>
              <div className="progress-gold">
                <div className="progress-gold-fill" style={{ width: `${(user.currentStreak / 7) * 100}%` }} />
              </div>
            </div>
          )}
          {user.currentStreak >= 7 && user.currentStreak < 30 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-page mb-1.5">
                <span>Next milestone</span>
                <span>{30 - user.currentStreak} days to ⭐ Monthly Devotee</span>
              </div>
              <div className="progress-gold">
                <div className="progress-gold-fill" style={{ width: `${(user.currentStreak / 30) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Verse of the Day — spans 2 cols */}
        <div className="lg:col-span-2 card-gold p-5 relative overflow-hidden">
          <div className="absolute top-2 right-2 w-14 h-14 star-shape opacity-10 animate-spin-slow"
            style={{ background: "#D4AF37" }} />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star size={16} fill="var(--gold)" style={{ color: "var(--gold)" }} />
              <h3 className="font-semibold text-page text-sm">Verse of the Day</h3>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleShareVerse}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-page hover:text-page transition-all"
                style={{ background: "var(--bg-secondary)" }} title="Share">
                <Share2 size={14} />
              </button>
              <button onClick={() => { navigator.clipboard.writeText(`"${todaysVerse.text}" — ${formatVerseRef(todaysVerse.bookName, todaysVerse.chapter, todaysVerse.verse)}`); toast.success("Copied!"); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-page hover:text-page transition-all"
                style={{ background: "var(--bg-secondary)" }} title="Copy">
                <Copy size={14} />
              </button>
            </div>
          </div>
          <blockquote className="verse-text text-page mb-3 leading-relaxed">
            &ldquo;{todaysVerse.text}&rdquo;
          </blockquote>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: "var(--gold)" }}>
              — {formatVerseRef(todaysVerse.bookName, todaysVerse.chapter, todaysVerse.verse)} (KJV)
            </p>
            <Link href={`/dashboard/bible?book=${todaysVerse.bookId}&chapter=${todaysVerse.chapter}`}
              className="text-xs text-muted-page hover:text-page flex items-center gap-1 transition-colors">
              Read chapter <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-base font-semibold text-page mb-3 flex items-center gap-2">
          <Sparkles size={16} style={{ color: "var(--gold)" }} />
          Quick Access
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href}
              className="card p-4 flex flex-col items-center gap-3 text-center group cursor-pointer">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: `${link.color}20`, border: `1px solid ${link.color}30` }}>
                <link.icon size={22} style={{ color: link.color }} />
              </div>
              <span className="text-sm font-medium text-secondary-page group-hover:text-page transition-colors">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Reading Plans progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-page flex items-center gap-2">
              <Target size={16} style={{ color: "var(--gold)" }} />
              Active Reading Plans
            </h3>
            <Link href="/dashboard/plans" className="text-xs text-muted-page hover:text-page flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {loadingPlans ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--bg-secondary)" }} />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8">
              <ListChecks size={32} className="mx-auto mb-3 text-muted-page" />
              <p className="text-sm text-secondary-page mb-3">No active reading plans</p>
              <Link href="/dashboard/plans" className="btn-gold text-xs px-4 py-2">
                Start a Plan
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.slice(0, 3).map((plan) => {
                const planRef = plan as UserPlanProgress & { plan?: { duration: number } };
                const total = planRef.plan?.duration || 30;
                const pct = Math.min(100, Math.round((plan.completedDays.length / total) * 100));
                return (
                  <div key={plan.id} className="p-3 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-page truncate">{plan.planName}</span>
                      <span className="text-xs font-bold text-gold-500 ml-2">{pct}%</span>
                    </div>
                    <div className="progress-gold">
                      <div className="progress-gold-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-page mt-1.5">Day {plan.currentDay}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Badges */}
        {(() => {
          const badgeStatuses = getBadgeStatus(user);
          const earnedCount = badgeStatuses.filter((b) => b.earned).length;
          const nextUnearned = badgeStatuses.find((b) => !b.earned && b.progress.current > 0) ?? badgeStatuses.find((b) => !b.earned);
          return (
            <div className="card p-5 relative overflow-hidden">
              <div className="absolute -bottom-4 -right-4 w-24 h-24 star-shape opacity-5" style={{ background: "var(--gold)" }} />
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-page flex items-center gap-2">
                  <Award size={16} style={{ color: "var(--gold)" }} />
                  Achievements
                </h3>
                <span className="badge-gold">{earnedCount} / {badgeStatuses.length}</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {badgeStatuses.slice(0, 6).map((b) => {
                  const rarity = RARITY_STYLES[b.rarity];
                  const pct = Math.round((b.progress.current / b.progress.target) * 100);
                  return (
                    <div key={b.id} className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center relative"
                      style={{
                        background: b.earned ? `radial-gradient(circle at 50% 30%, ${rarity.glow}, var(--bg-secondary))` : "var(--bg-secondary)",
                        border: `1px solid ${b.earned ? rarity.border : "var(--border)"}`,
                        opacity: b.earned ? 1 : 0.65,
                        boxShadow: b.earned ? `0 0 12px ${rarity.glow}` : "none",
                      }}>
                      <div className="relative w-12 h-12">
                        <div className="w-12 h-12 star-shape absolute inset-0"
                          style={{ background: b.earned ? `linear-gradient(135deg, ${rarity.border}, ${rarity.glow})` : "var(--border)" }} />
                        <span className="text-2xl absolute inset-0 flex items-center justify-center">{b.icon}</span>
                      </div>
                      <span className="text-xs font-semibold leading-tight" style={{ color: b.earned ? rarity.labelColor : "var(--text-muted)" }}>
                        {b.name}
                      </span>
                      {!b.earned && pct > 0 && (
                        <div className="w-full mt-0.5">
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: rarity.labelColor }} />
                          </div>
                          <span className="text-[10px] text-muted-page">{b.progress.current}/{b.progress.target}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {nextUnearned && !nextUnearned.earned && (
                <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
                  <p className="text-xs text-muted-page flex items-center gap-1.5">
                    <Star size={12} fill="var(--gold)" style={{ color: "var(--gold)" }} />
                    {nextUnearned.progress.target - nextUnearned.progress.current} more to unlock &ldquo;{nextUnearned.name}&rdquo; {nextUnearned.icon}
                  </p>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Days Read", value: user.totalDaysRead, icon: "📖", color: "var(--gold)" },
          { label: "Current Streak", value: `${user.currentStreak}d`, icon: "🔥", color: "#f97316" },
          { label: "Best Streak", value: `${user.longestStreak}d`, icon: "⭐", color: "#a855f7" },
          { label: "Badges Earned", value: user.badges.length, icon: "🏆", color: "#22c55e" },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 text-center">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="text-2xl font-display font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs text-muted-page mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
