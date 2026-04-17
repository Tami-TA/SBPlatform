"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";
import {
  BookOpen, Flame, Users, ListChecks, Star, ArrowRight,
  Share2, Copy, ChevronRight, Target, Award,
  BookMarked, Trophy, Zap,
} from "lucide-react";
import { getTodaysVerse } from "@/lib/bible-data";
import { getUserPlanProgress } from "@/lib/firestore";
import { getStreakLevel, formatVerseRef, shareVerse } from "@/lib/utils";
import { getBadgeStatus, RARITY_STYLES } from "@/lib/badges";
import type { UserPlanProgress } from "@/types";
import toast from "react-hot-toast";

const BADGE_ICONS: Record<string, React.ElementType> = {
  streak_1: BookOpen, streak_7: Flame, streak_30: Star,
  streak_100: Zap, streak_365: Award,
  reading_10: BookMarked, reading_50: Star, reading_200: BookOpen,
  social_friend: Users, social_group: Users,
  achievement_plan: ListChecks, achievement_longest_7: Trophy,
};

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
    toast.success("Verse copied!");
  }

  const QUICK_LINKS = [
    { href: "/dashboard/bible", icon: BookOpen, label: "Bible", color: "#D4AF37" },
    { href: "/dashboard/plans", icon: ListChecks, label: "Plans", color: "#2563eb" },
    { href: "/dashboard/groups", icon: Users, label: "Groups", color: "#7C3AED" },
    { href: "/dashboard/context", icon: BookMarked, label: "Context", color: "#0891B2" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-5">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-display font-bold text-page">
          {greeting()}, {user.displayName.split(" ")[0]}
        </h1>
        <p className="text-sm text-secondary-page mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Streak + Verse of Day */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Streak card */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-page flex items-center gap-2 text-sm">
              <Flame size={16} className="text-orange-400" />
              Reading Streak
            </h3>
            <span className={`text-xs font-semibold ${streakLevel.color}`}>{streakLevel.label}</span>
          </div>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-5xl font-display font-bold text-gold-gradient">{user.currentStreak}</p>
              <p className="text-xs text-muted-page mt-1">days in a row</p>
            </div>
            <div className="flex-1 space-y-2 pb-1">
              <div className="flex justify-between text-xs text-muted-page">
                <span>Best</span>
                <span className="font-semibold text-secondary-page">{user.longestStreak}d</span>
              </div>
              <div className="flex justify-between text-xs text-muted-page">
                <span>Total</span>
                <span className="font-semibold text-secondary-page">{user.totalDaysRead}d</span>
              </div>
            </div>
          </div>
          {user.currentStreak < 7 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-page mb-1.5">
                <span>Next milestone</span>
                <span>{7 - user.currentStreak} days to Week Warrior</span>
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
                <span>{30 - user.currentStreak} days to Monthly Devotee</span>
              </div>
              <div className="progress-gold">
                <div className="progress-gold-fill" style={{ width: `${(user.currentStreak / 30) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Verse of the Day */}
        <div className="lg:col-span-2 card-gold p-5 relative overflow-hidden">
          <div className="absolute top-2 right-2 w-12 h-12 star-shape opacity-10 animate-spin-slow"
            style={{ background: "#D4AF37" }} />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star size={14} fill="var(--gold)" style={{ color: "var(--gold)" }} />
              <h3 className="font-semibold text-page text-sm">Verse of the Day</h3>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleShareVerse}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-page hover:text-page transition-all"
                style={{ background: "var(--bg-secondary)" }} title="Share">
                <Share2 size={13} />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`"${todaysVerse.text}" — ${formatVerseRef(todaysVerse.bookName, todaysVerse.chapter, todaysVerse.verse)}`);
                  toast.success("Copied!");
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-page hover:text-page transition-all"
                style={{ background: "var(--bg-secondary)" }} title="Copy">
                <Copy size={13} />
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
              Read chapter <ChevronRight size={11} />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-4 gap-3">
        {QUICK_LINKS.map((link) => (
          <Link key={link.href} href={link.href}
            className="card p-4 flex flex-col items-center gap-2.5 text-center group cursor-pointer">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ background: `${link.color}18`, border: `1px solid ${link.color}28` }}>
              <link.icon size={20} style={{ color: link.color }} />
            </div>
            <span className="text-xs font-medium text-secondary-page group-hover:text-page transition-colors">{link.label}</span>
          </Link>
        ))}
      </div>

      {/* Reading Plans + Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Reading Plans */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-page flex items-center gap-2 text-sm">
              <Target size={15} style={{ color: "var(--gold)" }} />
              Active Plans
            </h3>
            <Link href="/dashboard/plans" className="text-xs text-muted-page hover:text-page flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {loadingPlans ? (
            <div className="space-y-2.5">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "var(--bg-secondary)" }} />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8">
              <ListChecks size={28} className="mx-auto mb-2 text-muted-page opacity-50" />
              <p className="text-sm text-secondary-page mb-3">No active reading plans</p>
              <Link href="/dashboard/plans" className="btn-gold text-xs px-4 py-1.5">Start a Plan</Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {plans.slice(0, 3).map((plan) => {
                const planRef = plan as UserPlanProgress & { plan?: { duration: number } };
                const total = planRef.plan?.duration || 30;
                const pct = Math.min(100, Math.round((plan.completedDays.length / total) * 100));
                return (
                  <div key={plan.id} className="p-3 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-page truncate">{plan.planName}</span>
                      <span className="text-xs font-bold text-gold-500 ml-2 flex-shrink-0">{pct}%</span>
                    </div>
                    <div className="progress-gold">
                      <div className="progress-gold-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-page mt-1">Day {plan.currentDay}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Achievements */}
        {(() => {
          const badgeStatuses = getBadgeStatus(user);
          const earnedCount = badgeStatuses.filter((b) => b.earned).length;
          const nextUnearned =
            badgeStatuses.find((b) => !b.earned && b.progress.current > 0) ??
            badgeStatuses.find((b) => !b.earned);
          return (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-page flex items-center gap-2 text-sm">
                  <Award size={15} style={{ color: "var(--gold)" }} />
                  Achievements
                </h3>
                <span className="badge-gold text-xs">{earnedCount} / {badgeStatuses.length}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {badgeStatuses.slice(0, 6).map((b) => {
                  const rarity = RARITY_STYLES[b.rarity];
                  const pct = Math.round((b.progress.current / b.progress.target) * 100);
                  const IconComp = BADGE_ICONS[b.id] || Trophy;
                  return (
                    <div key={b.id}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-center"
                      style={{
                        background: b.earned ? `radial-gradient(circle at 50% 30%, ${rarity.glow}, var(--bg-secondary))` : "var(--bg-secondary)",
                        border: `1px solid ${b.earned ? rarity.border : "var(--border)"}`,
                        opacity: b.earned ? 1 : 0.55,
                      }}
                      title={b.description}>
                      <div className="relative w-9 h-9">
                        <div className="w-9 h-9 star-shape absolute inset-0"
                          style={{ background: b.earned ? `linear-gradient(135deg, ${rarity.border}, ${rarity.glow})` : "var(--border)" }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <IconComp size={14} style={{ color: b.earned ? rarity.labelColor : "var(--text-muted)" }} />
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold leading-tight"
                        style={{ color: b.earned ? rarity.labelColor : "var(--text-muted)" }}>
                        {b.name}
                      </span>
                      {!b.earned && pct > 0 && (
                        <div className="w-full">
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: rarity.labelColor }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {nextUnearned && !nextUnearned.earned && (
                <div className="mt-3 p-2.5 rounded-xl" style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.15)" }}>
                  <p className="text-xs text-muted-page flex items-center gap-1.5">
                    <Star size={10} fill="var(--gold)" style={{ color: "var(--gold)" }} />
                    {nextUnearned.progress.target - nextUnearned.progress.current} more to unlock &ldquo;{nextUnearned.name}&rdquo;
                  </p>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
