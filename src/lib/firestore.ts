/**
 * Unified data layer — routes to demo-store (localStorage) when Firebase
 * credentials are not configured, and to Firestore when they are.
 */
import type {
  User, Group, GroupMessage, ReadingPlan, UserPlanProgress,
  Annotation, Highlight, Bookmark, FriendRequest, Notification,
} from "@/types";

const IS_DEMO =
  typeof window !== "undefined" &&
  (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "placeholder-api-key" ||
    (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "").startsWith("placeholder"));

// Lazy Firestore imports (only used in non-demo mode)
async function fdb() {
  const { db } = await import("./firebase");
  const fs = await import("firebase/firestore");
  return { db, fs };
}

// ── User ─────────────────────────────────────────────────────────────────────

export async function createUserProfile(uid: string, data: Partial<User>): Promise<void> {
  if (IS_DEMO) {
    const { demoCreateUser } = await import("./demo-store");
    demoCreateUser(uid, data);
    return;
  }
  const { db, fs } = await fdb();
  await fs.setDoc(fs.doc(db, "users", uid), {
    ...data, uid, currentStreak: 0, longestStreak: 0, totalDaysRead: 0,
    badges: [], friendIds: [], groupIds: [], preferredTranslation: "KJV",
    notificationsEnabled: true, createdAt: fs.serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<User | null> {
  if (IS_DEMO) {
    const { demoGetUser } = await import("./demo-store");
    return demoGetUser(uid);
  }
  const { db, fs } = await fdb();
  const snap = await fs.getDoc(fs.doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { ...snap.data(), uid: snap.id } as User;
}

export async function updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
  if (IS_DEMO) {
    const { demoUpdateUser } = await import("./demo-store");
    demoUpdateUser(uid, data);
    return;
  }
  const { db, fs } = await fdb();
  await fs.updateDoc(fs.doc(db, "users", uid), data as Record<string, unknown>);
}

export async function searchUsersByUsername(searchTerm: string): Promise<User[]> {
  if (IS_DEMO) {
    const { demoSearchUsers } = await import("./demo-store");
    return demoSearchUsers(searchTerm);
  }
  const { db, fs } = await fdb();
  const q = fs.query(
    fs.collection(db, "users"),
    fs.where("username", ">=", searchTerm),
    fs.where("username", "<=", searchTerm + "\uf8ff"),
    fs.limit(10)
  );
  const snap = await fs.getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), uid: d.id } as User));
}

// ── Streak ────────────────────────────────────────────────────────────────────

export async function updateStreak(uid: string): Promise<void> {
  if (IS_DEMO) {
    const { demoUpdateStreak } = await import("./demo-store");
    demoUpdateStreak(uid);
    return;
  }
  const user = await getUserProfile(uid);
  if (!user) return;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const u = user as User & { lastReadDate?: string };
  if (u.lastReadDate === today) return;
  const newStreak = u.lastReadDate === yesterday ? user.currentStreak + 1 : 1;
  const longestStreak = Math.max(newStreak, user.longestStreak || 0);
  await updateUserProfile(uid, { lastReadDate: today, currentStreak: newStreak, longestStreak, totalDaysRead: (user.totalDaysRead || 0) + 1 } as Partial<User> & { lastReadDate?: string });
}

// ── Friends ───────────────────────────────────────────────────────────────────

export async function sendFriendRequest(fromUid: string, toUid: string, fromUsername: string, fromDisplayName: string, fromPhotoURL?: string): Promise<void> {
  if (IS_DEMO) {
    const { demoSendFriendRequest } = await import("./demo-store");
    demoSendFriendRequest(fromUid, toUid, fromUsername, fromDisplayName, fromPhotoURL);
    return;
  }
  const { db, fs } = await fdb();
  await fs.addDoc(fs.collection(db, "friendRequests"), {
    fromUid, toUid, fromUsername, fromDisplayName, fromPhotoURL: fromPhotoURL || null,
    status: "pending", createdAt: fs.serverTimestamp(),
  });
}

export async function getFriendRequests(uid: string): Promise<FriendRequest[]> {
  if (IS_DEMO) {
    const { demoGetFriendRequests } = await import("./demo-store");
    return demoGetFriendRequests(uid);
  }
  const { db, fs } = await fdb();
  const q = fs.query(fs.collection(db, "friendRequests"), fs.where("toUid", "==", uid), fs.where("status", "==", "pending"));
  const snap = await fs.getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as FriendRequest));
}

export async function acceptFriendRequest(requestId: string, fromUid: string, toUid: string): Promise<void> {
  if (IS_DEMO) {
    const { demoAcceptFriendRequest } = await import("./demo-store");
    demoAcceptFriendRequest(requestId, fromUid, toUid);
    return;
  }
  const { db, fs } = await fdb();
  const batch = fs.writeBatch(db);
  batch.update(fs.doc(db, "friendRequests", requestId), { status: "accepted" });
  batch.update(fs.doc(db, "users", fromUid), { friendIds: fs.arrayUnion(toUid) });
  batch.update(fs.doc(db, "users", toUid), { friendIds: fs.arrayUnion(fromUid) });
  await batch.commit();
}

export async function declineFriendRequest(requestId: string): Promise<void> {
  if (IS_DEMO) {
    const { demoDeclineFriendRequest } = await import("./demo-store");
    demoDeclineFriendRequest(requestId);
    return;
  }
  const { db, fs } = await fdb();
  await fs.updateDoc(fs.doc(db, "friendRequests", requestId), { status: "declined" });
}

export async function removeFriend(uid: string, friendUid: string): Promise<void> {
  if (IS_DEMO) {
    const from = await getUserProfile(uid);
    const to = await getUserProfile(friendUid);
    if (from) updateUserProfile(uid, { friendIds: (from.friendIds || []).filter((id) => id !== friendUid) });
    if (to) updateUserProfile(friendUid, { friendIds: (to.friendIds || []).filter((id) => id !== uid) });
    return;
  }
  const { db, fs } = await fdb();
  const batch = fs.writeBatch(db);
  batch.update(fs.doc(db, "users", uid), { friendIds: fs.arrayRemove(friendUid) });
  batch.update(fs.doc(db, "users", friendUid), { friendIds: fs.arrayRemove(uid) });
  await batch.commit();
}

// ── Groups ────────────────────────────────────────────────────────────────────

export async function createGroup(data: Omit<Group, "id" | "createdAt">): Promise<string> {
  if (IS_DEMO) {
    const { demoCreateGroup } = await import("./demo-store");
    return demoCreateGroup(data);
  }
  const { db, fs } = await fdb();
  const ref = await fs.addDoc(fs.collection(db, "groups"), { ...data, createdAt: fs.serverTimestamp() });
  await updateUserProfile(data.createdBy, { groupIds: [...(await getUserProfile(data.createdBy))!.groupIds, ref.id] });
  return ref.id;
}

export async function getGroup(groupId: string): Promise<Group | null> {
  if (IS_DEMO) {
    const { demoGetGroup } = await import("./demo-store");
    return demoGetGroup(groupId);
  }
  const { db, fs } = await fdb();
  const snap = await fs.getDoc(fs.doc(db, "groups", groupId));
  if (!snap.exists()) return null;
  return { ...snap.data(), id: snap.id } as Group;
}

export async function getUserGroups(uid: string): Promise<Group[]> {
  if (IS_DEMO) {
    const { demoGetUserGroups } = await import("./demo-store");
    return demoGetUserGroups(uid);
  }
  const { db, fs } = await fdb();
  const q = fs.query(fs.collection(db, "groups"), fs.where("memberIds", "array-contains", uid));
  const snap = await fs.getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Group));
}

export async function joinGroup(groupId: string, uid: string): Promise<void> {
  if (IS_DEMO) {
    const { demoGetGroup } = await import("./demo-store");
    const group = demoGetGroup(groupId);
    if (group && !group.memberIds.includes(uid)) {
      group.memberIds.push(uid);
      const { demoUpdateUser, demoGetUser } = await import("./demo-store");
      const user = demoGetUser(uid);
      if (user) demoUpdateUser(uid, { groupIds: [...(user.groupIds || []), groupId] });
    }
    return;
  }
  const { db, fs } = await fdb();
  const batch = fs.writeBatch(db);
  batch.update(fs.doc(db, "groups", groupId), { memberIds: fs.arrayUnion(uid) });
  batch.update(fs.doc(db, "users", uid), { groupIds: fs.arrayUnion(groupId) });
  await batch.commit();
}

export async function sendGroupMessage(message: Omit<GroupMessage, "id" | "createdAt" | "likes">): Promise<void> {
  if (IS_DEMO) {
    const { demoSendMessage } = await import("./demo-store");
    demoSendMessage(message);
    return;
  }
  const { db, fs } = await fdb();
  await fs.addDoc(fs.collection(db, `groups/${message.groupId}/messages`), {
    ...message, likes: [], createdAt: fs.serverTimestamp(),
  });
}

export function subscribeToGroupMessages(groupId: string, callback: (messages: GroupMessage[]) => void): () => void {
  if (IS_DEMO) {
    import("./demo-store").then(({ demoGetMessages }) => {
      callback(demoGetMessages(groupId));
      const interval = setInterval(() => {
        import("./demo-store").then(({ demoGetMessages: getMsg }) => callback(getMsg(groupId)));
      }, 2000);
      // Store interval on window for cleanup — demo only
      (window as unknown as Record<string, unknown>)[`_msgPoll_${groupId}`] = interval;
    });
    return () => {
      const id = (window as unknown as Record<string, unknown>)[`_msgPoll_${groupId}`] as ReturnType<typeof setInterval> | undefined;
      if (id) clearInterval(id);
    };
  }
  let unsub: () => void = () => {};
  Promise.all([import("./firebase"), import("firebase/firestore")]).then(([{ db }, fs]) => {
    const q = fs.query(fs.collection(db, `groups/${groupId}/messages`), fs.orderBy("createdAt", "asc"), fs.limit(100));
    unsub = fs.onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ ...d.data(), id: d.id } as GroupMessage)));
    });
  });
  return () => unsub();
}

// ── Reading Plans ─────────────────────────────────────────────────────────────

export async function createReadingPlan(plan: Omit<ReadingPlan, "id" | "createdAt" | "completionCount">): Promise<string> {
  if (IS_DEMO) return "demo-plan-" + Date.now();
  const { db, fs } = await fdb();
  const ref = await fs.addDoc(fs.collection(db, "readingPlans"), { ...plan, completionCount: 0, createdAt: fs.serverTimestamp() });
  return ref.id;
}

export async function getPublicReadingPlans(): Promise<ReadingPlan[]> {
  if (IS_DEMO) return [];
  const { db, fs } = await fdb();
  const q = fs.query(fs.collection(db, "readingPlans"), fs.where("isPublic", "==", true), fs.orderBy("completionCount", "desc"), fs.limit(20));
  const snap = await fs.getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as ReadingPlan));
}

export async function getUserReadingPlans(userId: string): Promise<ReadingPlan[]> {
  if (IS_DEMO) return [];
  const { db, fs } = await fdb();
  const q = fs.query(fs.collection(db, "readingPlans"), fs.where("createdBy", "==", userId));
  const snap = await fs.getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as ReadingPlan));
}

export async function updateReadingPlan(planId: string, data: Partial<Omit<ReadingPlan, "id" | "createdAt" | "createdBy" | "completionCount">>): Promise<void> {
  if (IS_DEMO) return;
  const { db, fs } = await fdb();
  await fs.updateDoc(fs.doc(db, "readingPlans", planId), data);
}

export async function deleteReadingPlan(planId: string): Promise<void> {
  if (IS_DEMO) return;
  const { db, fs } = await fdb();
  await fs.deleteDoc(fs.doc(db, "readingPlans", planId));
}

export async function startReadingPlan(userId: string, planId: string, planName: string): Promise<string> {
  if (IS_DEMO) {
    const { demoStartPlan } = await import("./demo-store");
    return demoStartPlan(userId, planId, planName);
  }
  const { db, fs } = await fdb();
  const ref = await fs.addDoc(fs.collection(db, "userPlanProgress"), {
    userId, planId, planName,
    startDate: new Date().toISOString().slice(0, 10),
    completedDays: [], currentDay: 1, isCompleted: false, createdAt: fs.serverTimestamp(),
  });
  return ref.id;
}

export async function markDayComplete(progressId: string, dayNumber: number, userId: string): Promise<void> {
  if (IS_DEMO) {
    const { demoMarkDayComplete } = await import("./demo-store");
    demoMarkDayComplete(progressId, dayNumber, userId);
    return;
  }
  const { db, fs } = await fdb();
  await fs.updateDoc(fs.doc(db, "userPlanProgress", progressId), {
    completedDays: fs.arrayUnion(dayNumber), currentDay: dayNumber + 1,
  });
  await updateStreak(userId);
}

export async function getUserPlanProgress(userId: string): Promise<UserPlanProgress[]> {
  if (IS_DEMO) {
    const { demoGetUserPlanProgress } = await import("./demo-store");
    return demoGetUserPlanProgress(userId);
  }
  const { db, fs } = await fdb();
  const q = fs.query(fs.collection(db, "userPlanProgress"), fs.where("userId", "==", userId), fs.where("isCompleted", "==", false));
  const snap = await fs.getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as UserPlanProgress));
}

// ── Annotations / Highlights / Bookmarks ─────────────────────────────────────

export async function saveAnnotation(annotation: Omit<Annotation, "id" | "createdAt" | "updatedAt" | "likes" | "replies">): Promise<string> {
  if (IS_DEMO) {
    const { demoSaveAnnotation } = await import("./demo-store");
    return demoSaveAnnotation(annotation);
  }
  const { db, fs } = await fdb();
  const ref = await fs.addDoc(fs.collection(db, "annotations"), {
    ...annotation, likes: [], replies: [], createdAt: fs.serverTimestamp(), updatedAt: fs.serverTimestamp(),
  });
  return ref.id;
}

export async function getVerseAnnotations(bookId: string, chapter: number, verse: number): Promise<Annotation[]> {
  if (IS_DEMO) {
    const { demoGetAnnotations } = await import("./demo-store");
    return demoGetAnnotations(bookId, chapter, verse);
  }
  const { db, fs } = await fdb();
  const q = fs.query(
    fs.collection(db, "annotations"),
    fs.where("verseRef.bookId", "==", bookId),
    fs.where("verseRef.chapter", "==", chapter),
    fs.where("verseRef.verse", "==", verse),
    fs.where("isPrivate", "==", false),
    fs.orderBy("createdAt", "desc")
  );
  const snap = await fs.getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Annotation));
}

export async function saveHighlight(highlight: Omit<Highlight, "id" | "createdAt">): Promise<string> {
  if (IS_DEMO) {
    const { demoSaveHighlight } = await import("./demo-store");
    return demoSaveHighlight(highlight);
  }
  const { db, fs } = await fdb();
  const ref = await fs.addDoc(fs.collection(db, "highlights"), { ...highlight, createdAt: fs.serverTimestamp() });
  return ref.id;
}

export async function getUserHighlights(userId: string): Promise<Highlight[]> {
  if (IS_DEMO) {
    const { demoGetHighlights } = await import("./demo-store");
    return demoGetHighlights(userId);
  }
  const { db, fs } = await fdb();
  const q = fs.query(fs.collection(db, "highlights"), fs.where("userId", "==", userId), fs.limit(500));
  const snap = await fs.getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Highlight));
}

export async function saveBookmark(bookmark: Omit<Bookmark, "id" | "createdAt">): Promise<string> {
  if (IS_DEMO) {
    const { demoSaveBookmark } = await import("./demo-store");
    return demoSaveBookmark(bookmark);
  }
  const { db, fs } = await fdb();
  const ref = await fs.addDoc(fs.collection(db, "bookmarks"), { ...bookmark, createdAt: fs.serverTimestamp() });
  return ref.id;
}

export async function getUserBookmarks(userId: string): Promise<Bookmark[]> {
  if (IS_DEMO) {
    const { demoGetBookmarks } = await import("./demo-store");
    return demoGetBookmarks(userId);
  }
  const { db, fs } = await fdb();
  const q = fs.query(fs.collection(db, "bookmarks"), fs.where("userId", "==", userId), fs.limit(100));
  const snap = await fs.getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Bookmark));
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function addNotification(userId: string, notification: Omit<Notification, "id" | "userId" | "isRead" | "createdAt">): Promise<void> {
  if (IS_DEMO) return;
  const { db, fs } = await fdb();
  await fs.addDoc(fs.collection(db, `users/${userId}/notifications`), {
    ...notification, userId, isRead: false, createdAt: fs.serverTimestamp(),
  });
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  if (IS_DEMO) {
    const { demoGetNotifications } = await import("./demo-store");
    return demoGetNotifications(userId);
  }
  const { db, fs } = await fdb();
  const q = fs.query(fs.collection(db, `users/${userId}/notifications`), fs.orderBy("createdAt", "desc"), fs.limit(30));
  const snap = await fs.getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Notification));
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  if (IS_DEMO) return;
  const { db, fs } = await fdb();
  await fs.updateDoc(fs.doc(db, `users/${userId}/notifications`, notificationId), { isRead: true });
}
