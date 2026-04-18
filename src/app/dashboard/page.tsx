"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";
import {
  BookOpen, Flame, Users, ListChecks, ArrowRight,
  Share2, Copy, ChevronRight, Target, Award,
  BookMarked, Trophy, Zap, Star,
} from "lucide-react";
import { getTodaysVerse } from "@/lib/bible-data";
import { getUserPlanProgress } from "@/lib/firestore";
import { getStreakLevel, formatVerseRef, shareVerse } from "@/lib/utils";
import { getBadgeStatus } from "@/lib/badges";
import type { UserPlanProgress } from "@/types";
import toast from "react-hot-toast";

const BADGE_ICONS: Record<string, React.ElementType> = {
  streak_1: BookOpen, streak_7: Flame, streak_30: Star,
  streak_100: Zap, streak_365: Award,
  reading_10: BookMarked, reading_50: Star, reading_200: BookOpen,
  social_friend: Users, social_group: Users,
  achievement_plan: ListChecks, achievement_longest_7: Trophy,
};

const QUICK_LINKS = [
  { href: "/dashboard/bible",   icon: BookOpen,   label: "Bible" },
  { href: "/dashboard/plans",   icon: ListChecks, label: "Plans" },
  { href: "/dashboard/groups",  icon: Users,      label: "Groups" },
  { href: "/dashboard/context", icon: BookMarked, label: "Context" },
];

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

  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }

  function handleShareVerse() {
    shareVerse(todaysVerse.text, formatVerseRef(todaysVerse.bookName, todaysVerse.chapter, todaysVerse.verse));
    toast.success("Copied!");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {greeting()}, {user.displayName.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Top row: Streak + Verse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Streak */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reading Streak</p>
            <span className="text-xs font-medium text-muted-foreground">{streakLevel.label}</span>
          </div>
          <div className="flex items-end gap-3 mb-4">
            <p className="text-4xl font-bold text-foreground tabular-nums">{user.currentStreak}</p>
            <p className="text-sm text-muted-foreground mb-1">days</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-4">
            <div className="bg-secondary rounded-md px-2.5 py-1.5">
              <p className="text-[10px] uppercase tracking-wider mb-0.5">Best</p>
              <p className="font-semibold text-foreground">{user.longestStreak}d</p>
            </div>
            <div className="bg-secondary rounded-md px-2.5 py-1.5">
              <p className="text-[10px] uppercase tracking-wider mb-0.5">Total</p>
              <p className="font-semibold text-foreground">{user.totalDaysRead}d</p>
            </div>
          </div>
          {user.currentStreak < 7 && (
            <div>
              <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                <span>Next: Week Warrior</span>
                <span>{7 - user.currentStreak} days left</span>
              </div>
              <div className="progress-gold">
                <div className="progress-gold-fill" style={{ width: `${(user.currentStreak / 7) * 100}%` }} />
              </div>
            </div>
          )}
          {user.currentStreak >= 7 && user.currentStreak < 30 && (
            <div>
              <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                <span>Next: Monthly Devotee</span>
                <span>{30 - user.currentStreak} days left</span>
              </div>
              <div className="progress-gold">
                <div className="progress-gold-fill" style={{ width: `${(user.currentStreak / 30) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Verse of the Day */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Verse of the Day</p>
            <div className="flex items-center gap-1">
              <button onClick={handleShareVerse}
                className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Share">
                <Share2 size={12} strokeWidth={1.75} />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`"${todaysVerse.text}" — ${formatVerseRef(todaysVerse.bookName, todaysVerse.chapter, todaysVerse.verse)}`);
                  toast.success("Copied!");
                }}
                className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Copy">
                <Copy size={12} strokeWidth={1.75} />
              </button>
            </div>
          </div>
          <blockquote className="verse-text text-foreground mb-3 leading-relaxed">
            &ldquo;{todaysVerse.text}&rdquo;
          </blockquote>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              — {formatVerseRef(todaysVerse.bookName, todaysVerse.chapter, todaysVerse.verse)}
            </p>
            <Link href={`/dashboard/bible?book=${todaysVerse.bookId}&chapter=${todaysVerse.chapter}`}
              className="text-xs text-primary hover:underline flex items-center gap-1 transition-colors">
              Read chapter <ChevronRight size={11} />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick access */}
      <div className="grid grid-cols-4 gap-2.5">
        {QUICK_LINKS.map(link => (
          <Link key={link.href} href={link.href}
            className="card p-3.5 flex flex-col items-center gap-2 text-center group cursor-pointer hover:border-primary/30 transition-colors">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary group-hover:bg-primary/10 transition-colors">
              <link.icon size={17} strokeWidth={1.75} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{link.label}</span>
          </Link>
        ))}
      </div>

      {/* Plans + Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Active Reading Plans */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Plans</p>
            <Link href="/dashboard/plans" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {loadingPlans ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-12 rounded-md animate-pulse bg-secondary" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8">
              <Target size={22} className="mx-auto mb-2 text-muted-foreground opacity-40" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground mb-3">No active reading plans</p>
              <Link href="/dashboard/plans" className="btn-primary text-xs px-4 py-1.5 inline-flex items-center gap-1.5">
                <ListChecks size={13} /> Start a Plan
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {plans.slice(0, 3).map(plan => {
                const planRef = plan as UserPlanProgress & { plan?: { duration: number } };
                const total = planRef.plan?.duration || 30;
                const pct = Math.min(100, Math.round((plan.completedDays.length / total) * 100));
                return (
                  <div key={plan.id} className="p-3 rounded-md bg-secondary">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground truncate">{plan.planName}</span>
                      <span className="text-xs font-semibold text-primary ml-2 flex-shrink-0">{pct}%</span>
                    </div>
                    <div className="progress-gold">
                      <div className="progress-gold-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5">Day {plan.currentDay} of {total}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Achievements */}
        {(() => {
          const badgeStatuses = getBadgeStatus(user);
          const earnedCount = badgeStatuses.filter(b => b.earned).length;
          const nextUnearned = badgeStatuses.find(b => !b.earned && b.progress.current > 0)
            ?? badgeStatuses.find(b => !b.earned);
          return (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Achievements</p>
                <span className="text-xs font-medium text-muted-foreground">{earnedCount} / {badgeStatuses.length}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {badgeStatuses.slice(0, 6).map(b => {
                  const IconComp = BADGE_ICONS[b.id] || Trophy;
                  const pct = Math.round((b.progress.current / b.progress.target) * 100);
                  return (
                    <div key={b.id} title={b.description}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-md text-center border transition-opacity
                        ${b.earned ? "bg-primary/8 border-primary/20" : "bg-secondary border-border opacity-50"}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                        ${b.earned ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <IconComp size={15} strokeWidth={1.75} />
                      </div>
                      <span className="text-[10px] font-medium leading-tight text-foreground">{b.name}</span>
                      {!b.earned && pct > 0 && (
                        <div className="w-full">
                          <div className="progress-gold">
                            <div className="progress-gold-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {nextUnearned && !nextUnearned.earned && (
                <div className="mt-3 p-2.5 rounded-md bg-secondary border border-border">
                  <p className="text-xs text-muted-foreground">
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
