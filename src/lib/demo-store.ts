"use client";
import type { User, Group, GroupMessage, ReadingPlan, UserPlanProgress, Annotation, Highlight, Bookmark, FriendRequest, Notification } from "@/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function ls<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(`sb_demo_${key}`);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function ls_set(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`sb_demo_${key}`, JSON.stringify(value));
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function now() {
  return new Date().toISOString();
}

// ── Auth ─────────────────────────────────────────────────────────────────────

interface DemoAuthAccount {
  uid: string;
  email: string;
  passwordHash: string;
  username: string;
  displayName: string;
  photoURL?: string;
}

function hashPassword(pw: string): string {
  // Simple deterministic hash for demo (NOT for production)
  let h = 0;
  for (let i = 0; i < pw.length; i++) {
    h = (Math.imul(31, h) + pw.charCodeAt(i)) | 0;
  }
  return h.toString(16);
}

export function demoSignup(
  email: string,
  password: string,
  username: string,
  displayName: string
): { uid: string } {
  const accounts: DemoAuthAccount[] = ls("accounts", []);
  if (accounts.find((a) => a.email === email)) {
    throw new Error("email-already-in-use");
  }
  if (accounts.find((a) => a.username === username)) {
    throw new Error("username-already-taken");
  }
  const id = uid();
  accounts.push({ uid: id, email, passwordHash: hashPassword(password), username, displayName });
  ls_set("accounts", accounts);
  ls_set("session", id);

  // Create profile
  demoCreateUser(id, {
    email,
    username,
    displayName,
    currentStreak: 0,
    longestStreak: 0,
    totalDaysRead: 0,
    badges: [],
    friendIds: [],
    groupIds: [],
    preferredTranslation: "KJV",
    notificationsEnabled: true,
  });

  return { uid: id };
}

export function demoLogin(email: string, password: string): { uid: string } {
  const accounts: DemoAuthAccount[] = ls("accounts", []);
  const account = accounts.find((a) => a.email === email);
  if (!account) throw new Error("user-not-found");
  if (account.passwordHash !== hashPassword(password)) throw new Error("wrong-password");
  ls_set("session", account.uid);
  return { uid: account.uid };
}

export function demoLogout() {
  if (typeof window !== "undefined") localStorage.removeItem("sb_demo_session");
}

export function demoGetSession(): string | null {
  return ls<string | null>("session", null);
}

// ── User ─────────────────────────────────────────────────────────────────────

export function demoCreateUser(uid: string, data: Partial<User>) {
  const users: Record<string, User> = ls("users", {});
  users[uid] = {
    uid,
    email: data.email || "",
    username: data.username || "",
    displayName: data.displayName || "Bible Reader",
    photoURL: data.photoURL,
    bio: "",
    createdAt: new Date(),
    currentStreak: 0,
    longestStreak: 0,
    totalDaysRead: 0,
    badges: [],
    friendIds: [],
    groupIds: [],
    preferredTranslation: "KJV",
    notificationsEnabled: true,
    ...data,
  } as User;
  ls_set("users", users);
}

export function demoGetUser(uid: string): User | null {
  const users: Record<string, User> = ls("users", {});
  return users[uid] || null;
}

export function demoUpdateUser(uid: string, data: Partial<User>) {
  const users: Record<string, User> = ls("users", {});
  if (users[uid]) {
    users[uid] = { ...users[uid], ...data };
    ls_set("users", users);
  }
}

export function demoSearchUsers(query: string): User[] {
  const users: Record<string, User> = ls("users", {});
  const q = query.toLowerCase();
  return Object.values(users).filter((u) =>
    u.username?.toLowerCase().includes(q) || u.displayName?.toLowerCase().includes(q)
  );
}

export function demoUpdateStreak(uid: string) {
  const user = demoGetUser(uid);
  if (!user) return;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if ((user as User & { lastReadDate?: string }).lastReadDate === today) return;
  const newStreak = (user as User & { lastReadDate?: string }).lastReadDate === yesterday ? user.currentStreak + 1 : 1;
  const longestStreak = Math.max(newStreak, user.longestStreak);
  const badges = [...user.badges];
  const milestones: Record<number, { id: string; name: string; icon: string; description: string }> = {
    7: { id: "streak_7", name: "Week Warrior", icon: "🔥", description: "7 consecutive days" },
    30: { id: "streak_30", name: "Monthly Devotee", icon: "⭐", description: "30 consecutive days" },
    100: { id: "streak_100", name: "Century Scholar", icon: "💎", description: "100 consecutive days" },
    365: { id: "streak_365", name: "Year of Faith", icon: "👑", description: "365 consecutive days" },
  };
  if (milestones[newStreak] && !badges.find((b) => b.id === milestones[newStreak].id)) {
    badges.push({ ...milestones[newStreak], type: "streak" as const, earnedAt: new Date() });
  }
  demoUpdateUser(uid, {
    lastReadDate: today,
    currentStreak: newStreak,
    longestStreak,
    totalDaysRead: user.totalDaysRead + 1,
    badges,
  } as Partial<User> & { lastReadDate?: string });
}

// ── Friends ───────────────────────────────────────────────────────────────────

export function demoSendFriendRequest(fromUid: string, toUid: string, fromUsername: string, fromDisplayName: string, fromPhotoURL?: string) {
  const requests: FriendRequest[] = ls("friendRequests", []);
  if (requests.find((r) => r.fromUid === fromUid && r.toUid === toUid && r.status === "pending")) return;
  requests.push({
    id: uid(),
    fromUid, toUid, fromUsername, fromDisplayName,
    fromPhotoURL,
    createdAt: new Date(),
    status: "pending",
  });
  ls_set("friendRequests", requests);
}

export function demoGetFriendRequests(toUid: string): FriendRequest[] {
  const requests: FriendRequest[] = ls("friendRequests", []);
  return requests.filter((r) => r.toUid === toUid && r.status === "pending");
}

export function demoAcceptFriendRequest(requestId: string, fromUid: string, toUid: string) {
  const requests: FriendRequest[] = ls("friendRequests", []);
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx !== -1) requests[idx].status = "accepted";
  ls_set("friendRequests", requests);
  const fromUser = demoGetUser(fromUid);
  const toUser = demoGetUser(toUid);
  if (fromUser) demoUpdateUser(fromUid, { friendIds: [...(fromUser.friendIds || []), toUid] });
  if (toUser) demoUpdateUser(toUid, { friendIds: [...(toUser.friendIds || []), fromUid] });
}

export function demoDeclineFriendRequest(requestId: string) {
  const requests: FriendRequest[] = ls("friendRequests", []);
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx !== -1) requests[idx].status = "declined";
  ls_set("friendRequests", requests);
}

// ── Groups ────────────────────────────────────────────────────────────────────

export function demoCreateGroup(data: Omit<Group, "id" | "createdAt">): string {
  const groups: Record<string, Group> = ls("groups", {});
  const id = uid();
  groups[id] = { ...data, id, createdAt: new Date() };
  ls_set("groups", groups);
  const user = demoGetUser(data.createdBy);
  if (user) demoUpdateUser(data.createdBy, { groupIds: [...(user.groupIds || []), id] });
  return id;
}

export function demoGetGroup(id: string): Group | null {
  const groups: Record<string, Group> = ls("groups", {});
  return groups[id] || null;
}

export function demoGetUserGroups(uid: string): Group[] {
  const groups: Record<string, Group> = ls("groups", {});
  return Object.values(groups).filter((g) => g.memberIds.includes(uid));
}

export function demoSendMessage(msg: Omit<GroupMessage, "id" | "createdAt" | "likes">) {
  const key = `messages_${msg.groupId}`;
  const messages: GroupMessage[] = ls(key, []);
  messages.push({ ...msg, id: uid(), likes: [], createdAt: new Date() });
  ls_set(key, messages);
}

export function demoGetMessages(groupId: string): GroupMessage[] {
  return ls<GroupMessage[]>(`messages_${groupId}`, []);
}

// ── Reading Plans ─────────────────────────────────────────────────────────────

export function demoCreateReadingPlan(plan: Omit<ReadingPlan, "id" | "createdAt" | "completionCount">): string {
  const id = uid();
  const plans: Record<string, ReadingPlan> = ls("readingPlans", {});
  plans[id] = { ...plan, id, completionCount: 0, createdAt: new Date() };
  ls_set("readingPlans", plans);
  return id;
}

export function demoUpdateReadingPlan(planId: string, data: Partial<ReadingPlan>): void {
  const plans: Record<string, ReadingPlan> = ls("readingPlans", {});
  if (plans[planId]) {
    plans[planId] = { ...plans[planId], ...data };
    ls_set("readingPlans", plans);
  }
}

export function demoDeleteReadingPlan(planId: string): void {
  const plans: Record<string, ReadingPlan> = ls("readingPlans", {});
  delete plans[planId];
  ls_set("readingPlans", plans);
}

export function demoGetUserReadingPlans(userId: string): ReadingPlan[] {
  const plans: Record<string, ReadingPlan> = ls("readingPlans", {});
  return Object.values(plans).filter((p) => p.createdBy === userId);
}

export function demoGetPublicReadingPlans(): ReadingPlan[] {
  const plans: Record<string, ReadingPlan> = ls("readingPlans", {});
  return Object.values(plans).filter((p) => p.isPublic);
}

export function demoStartPlan(userId: string, planId: string, planName: string): string {
  const id = uid();
  const progress: Record<string, UserPlanProgress> = ls("planProgress", {});
  progress[id] = {
    id, userId, planId, planName,
    startDate: new Date().toISOString().slice(0, 10),
    completedDays: [],
    currentDay: 1,
    isCompleted: false,
  };
  ls_set("planProgress", progress);
  return id;
}

export function demoGetUserPlanProgress(userId: string): UserPlanProgress[] {
  const progress: Record<string, UserPlanProgress> = ls("planProgress", {});
  return Object.values(progress).filter((p) => p.userId === userId && !p.isCompleted);
}

export function demoMarkDayComplete(progressId: string, dayNumber: number, userId: string) {
  const progress: Record<string, UserPlanProgress> = ls("planProgress", {});
  if (progress[progressId]) {
    const p = progress[progressId];
    if (!p.completedDays.includes(dayNumber)) p.completedDays.push(dayNumber);
    p.currentDay = Math.max(p.currentDay, dayNumber + 1);
    ls_set("planProgress", progress);
  }
  demoUpdateStreak(userId);
}

// ── Highlights & Bookmarks ────────────────────────────────────────────────────

export function demoSaveHighlight(h: Omit<Highlight, "id" | "createdAt">): string {
  const key = `highlights_${h.userId}`;
  const highlights: Highlight[] = ls(key, []);
  const existIdx = highlights.findIndex(
    (x) => x.verseRef.bookId === h.verseRef.bookId &&
            x.verseRef.chapter === h.verseRef.chapter &&
            x.verseRef.verse === h.verseRef.verse
  );
  if (existIdx !== -1) {
    highlights[existIdx].color = h.color;
    ls_set(key, highlights);
    return highlights[existIdx].id;
  }
  const id = uid();
  highlights.push({ ...h, id, createdAt: new Date() });
  ls_set(key, highlights);
  return id;
}

export function demoGetHighlights(userId: string): Highlight[] {
  return ls<Highlight[]>(`highlights_${userId}`, []);
}

export function demoSaveBookmark(b: Omit<Bookmark, "id" | "createdAt">): string {
  const key = `bookmarks_${b.userId}`;
  const bookmarks: Bookmark[] = ls(key, []);
  const id = uid();
  bookmarks.push({ ...b, id, createdAt: new Date() });
  ls_set(key, bookmarks);
  return id;
}

export function demoGetBookmarks(userId: string): Bookmark[] {
  return ls<Bookmark[]>(`bookmarks_${userId}`, []);
}

// ── Annotations ───────────────────────────────────────────────────────────────

export function demoSaveAnnotation(a: Omit<Annotation, "id" | "createdAt" | "updatedAt" | "likes" | "replies">): string {
  const annotations: Annotation[] = ls("annotations", []);
  const id = uid();
  annotations.push({ ...a, id, likes: [], replies: [], createdAt: new Date(), updatedAt: new Date() });
  ls_set("annotations", annotations);
  return id;
}

export function demoGetAnnotations(bookId: string, chapter: number, verse: number): Annotation[] {
  const annotations: Annotation[] = ls("annotations", []);
  return annotations.filter(
    (a) => a.verseRef.bookId === bookId && a.verseRef.chapter === chapter && a.verseRef.verse === verse
  );
}

// ── Notifications ─────────────────────────────────────────────────────────────

export function demoGetNotifications(userId: string): Notification[] {
  return ls<Notification[]>(`notifs_${userId}`, []);
}
