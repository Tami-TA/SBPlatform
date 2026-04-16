import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

export function generateUsername(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20) + Math.floor(Math.random() * 999).toString();
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getStreakLevel(streak: number): { label: string; color: string; emoji: string } {
  if (streak >= 365) return { label: "Legendary", color: "text-purple-400", emoji: "👑" };
  if (streak >= 100) return { label: "Diamond", color: "text-blue-400", emoji: "💎" };
  if (streak >= 30) return { label: "Gold", color: "text-yellow-400", emoji: "⭐" };
  if (streak >= 7) return { label: "Silver", color: "text-gray-300", emoji: "🔥" };
  return { label: "Beginner", color: "text-orange-400", emoji: "🌱" };
}

export function formatVerseRef(bookName: string, chapter: number, verse?: number, verseEnd?: number): string {
  if (!verse) return `${bookName} ${chapter}`;
  if (!verseEnd || verseEnd === verse) return `${bookName} ${chapter}:${verse}`;
  return `${bookName} ${chapter}:${verse}-${verseEnd}`;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function shareVerse(text: string, reference: string): void {
  const shareText = `"${text}" — ${reference}`;
  if (navigator.share) {
    navigator.share({ text: shareText });
  } else {
    copyToClipboard(shareText);
  }
}
