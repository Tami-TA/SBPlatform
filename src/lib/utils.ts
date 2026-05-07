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

type FirestoreTimestamp = { seconds: number; nanoseconds?: number; toDate?: () => Date };

function toDate(value: Date | string | FirestoreTimestamp | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(value);
  // Firestore Timestamp — has .toDate() or at minimum .seconds
  if (typeof (value as FirestoreTimestamp).seconds === "number") {
    return typeof (value as FirestoreTimestamp).toDate === "function"
      ? (value as FirestoreTimestamp).toDate!()
      : new Date((value as FirestoreTimestamp).seconds * 1000);
  }
  return null;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function timeAgo(date: Date | string | FirestoreTimestamp | null | undefined): string {
  if (!date) return "sending…";
  const d = toDate(date);
  if (!d || isNaN(d.getTime())) return "sending…";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);

  if (seconds < 60)  return "just now";
  if (minutes < 60)  return `${minutes} min ago`;

  const todayStart     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  if (d >= todayStart)     return formatTime(d);
  if (d >= yesterdayStart) return `Yesterday at ${formatTime(d)}`;
  if (hours < 168)         return `${Math.floor(hours / 24)} days ago`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + formatTime(d);
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

export function getStreakLevel(streak: number): { label: string; color: string } {
  if (streak >= 365) return { label: "Legendary", color: "text-purple-400" };
  if (streak >= 100) return { label: "Diamond", color: "text-blue-400" };
  if (streak >= 30) return { label: "Gold", color: "text-yellow-400" };
  if (streak >= 7) return { label: "Silver", color: "text-gray-300" };
  return { label: "Beginner", color: "text-orange-400" };
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
