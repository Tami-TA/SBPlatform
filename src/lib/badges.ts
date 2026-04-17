import type { Badge, User } from "@/types";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: Badge["type"];
  rarity: "common" | "uncommon" | "rare" | "legendary";
  getProgress: (user: User) => { current: number; target: number };
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ── Streak badges ──────────────────────────────────────────────────
  {
    id: "streak_1",
    name: "First Step",
    description: "Read the Bible on your first day",
    icon: "📖",
    type: "streak",
    rarity: "common",
    getProgress: (u) => ({ current: Math.min(u.totalDaysRead, 1), target: 1 }),
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day reading streak",
    icon: "🔥",
    type: "streak",
    rarity: "common",
    getProgress: (u) => ({ current: Math.min(u.currentStreak, 7), target: 7 }),
  },
  {
    id: "streak_30",
    name: "Monthly Devotee",
    description: "Maintain a 30-day reading streak",
    icon: "⭐",
    type: "streak",
    rarity: "uncommon",
    getProgress: (u) => ({ current: Math.min(u.currentStreak, 30), target: 30 }),
  },
  {
    id: "streak_100",
    name: "Century Scholar",
    description: "Maintain a 100-day reading streak",
    icon: "💎",
    type: "streak",
    rarity: "rare",
    getProgress: (u) => ({ current: Math.min(u.currentStreak, 100), target: 100 }),
  },
  {
    id: "streak_365",
    name: "Year of Faith",
    description: "Maintain a 365-day reading streak",
    icon: "👑",
    type: "streak",
    rarity: "legendary",
    getProgress: (u) => ({ current: Math.min(u.currentStreak, 365), target: 365 }),
  },
  // ── Reading badges ─────────────────────────────────────────────────
  {
    id: "reading_10",
    name: "Dedicated Reader",
    description: "Read the Bible on 10 total days",
    icon: "📚",
    type: "reading",
    rarity: "common",
    getProgress: (u) => ({ current: Math.min(u.totalDaysRead, 10), target: 10 }),
  },
  {
    id: "reading_50",
    name: "Scripture Seeker",
    description: "Read the Bible on 50 total days",
    icon: "🕊️",
    type: "reading",
    rarity: "uncommon",
    getProgress: (u) => ({ current: Math.min(u.totalDaysRead, 50), target: 50 }),
  },
  {
    id: "reading_200",
    name: "Word Walker",
    description: "Read the Bible on 200 total days",
    icon: "🌿",
    type: "reading",
    rarity: "rare",
    getProgress: (u) => ({ current: Math.min(u.totalDaysRead, 200), target: 200 }),
  },
  // ── Social badges ──────────────────────────────────────────────────
  {
    id: "social_friend",
    name: "Community Builder",
    description: "Add your first friend",
    icon: "🤝",
    type: "social",
    rarity: "common",
    getProgress: (u) => ({ current: Math.min(u.friendIds.length, 1), target: 1 }),
  },
  {
    id: "social_group",
    name: "Gathered Together",
    description: "Join your first Bible study group",
    icon: "👥",
    type: "social",
    rarity: "common",
    getProgress: (u) => ({ current: Math.min(u.groupIds.length, 1), target: 1 }),
  },
  // ── Achievement badges ─────────────────────────────────────────────
  {
    id: "achievement_plan",
    name: "Plan Starter",
    description: "Start your first reading plan",
    icon: "🗺️",
    type: "achievement",
    rarity: "common",
    getProgress: (u) => ({ current: u.badges.find((b) => b.id === "achievement_plan") ? 1 : 0, target: 1 }),
  },
  {
    id: "achievement_longest_7",
    name: "Faithful Finisher",
    description: "Achieve a longest streak of 7 days",
    icon: "🏅",
    type: "achievement",
    rarity: "common",
    getProgress: (u) => ({ current: Math.min(u.longestStreak, 7), target: 7 }),
  },
];

export const RARITY_STYLES: Record<BadgeDefinition["rarity"], { border: string; glow: string; label: string; labelColor: string }> = {
  common:    { border: "rgba(148,163,184,0.4)", glow: "rgba(148,163,184,0.15)", label: "Common",    labelColor: "#94a3b8" },
  uncommon:  { border: "rgba(74,222,128,0.5)",  glow: "rgba(74,222,128,0.12)",  label: "Uncommon",  labelColor: "#4ade80" },
  rare:      { border: "rgba(96,165,250,0.5)",  glow: "rgba(96,165,250,0.12)",  label: "Rare",      labelColor: "#60a5fa" },
  legendary: { border: "rgba(212,175,55,0.6)",  glow: "rgba(212,175,55,0.15)",  label: "Legendary", labelColor: "#D4AF37" },
};

export function getBadgeStatus(user: User): Array<BadgeDefinition & { earned: boolean; progress: { current: number; target: number } }> {
  const earnedIds = new Set(user.badges.map((b) => b.id));
  return BADGE_DEFINITIONS.map((def) => ({
    ...def,
    earned: earnedIds.has(def.id),
    progress: def.getProgress(user),
  }));
}
