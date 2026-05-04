import type {
  User, Group, GroupMessage, ReadingPlan, UserPlanProgress,
  Annotation, Highlight, Bookmark, FriendRequest, Notification,
} from "@/types";

async function fdb() {
  const { db } = await import("./firebase");
  const fs = await import("firebase/firestore");
  return { db, fs };
}

// ── User ─────────────────────────────────────────────────────────────────────

export async function createUserProfile(uid: string, data: Partial<User>): Promise<void> {
  const { db, fs } = await fdb();
  await fs.setDoc(fs.doc(db, "users", uid), {
    ...data, uid, currentStreak: 0, longestStreak: 0, totalDaysRead: 0,
    badges: [], friendIds: [], groupIds: [], preferredTranslation: "KJV",
    notificationsEnabled: true, createdAt: fs.serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<User | null> {
  const { db, fs } = await fdb();
  const snap = await fs.getDoc(fs.doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { ...snap.data(), uid: snap.id } as User;
}

export async function updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
  const { db, fs } = await fdb();
  await fs.updateDoc(fs.doc(db, "users", uid), data as Record<string, unknown>);
}

export async function searchUsersByUsername(searchTerm: string): Promise<User[]> {
  const { db, fs } = await fdb();
  const q = fs.query(
    fs.collection(db, "users"),
    fs.where("username", ">=", searchTerm),
    fs.where("username", "<=", searchTerm + ""),
    fs.limit(10)
  );
  const snap = await fs.getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), uid: d.id } as User));
}

// ── Streak ────────────────────────────────────────────────────────────────────

export async function updateStreak(uid: string): Promise<void> {
  const user = await getUserProfile(uid);
  if (!user) return;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const u = user as User & { lastReadDate?: string };
  if (u.lastReadDate === today) return;
  const newStreak = u.lastReadDate === yesterday ? user.currentStreak + 1 : 1;
  const longestStreak = Math.max(newStreak, user.longestStreak || 0);
  await updateUserProfile(uid, {
    lastReadDate: today, currentStreak: newStreak, longestStreak,
    totalDaysRead: (user.totalDaysRead || 0) + 1,
  } as Partial<User> & { lastReadDate?: string });
}

// ── Friends ───────────────────────────────────────────────────────────────────

export async function sendFriendRequest(
  fromUid: string, toUid: string, fromUsername: string, fromDisplayName: string, fromPhotoURL?: string
): Promise<void> {
  if (fromUid === toUid) throw Object.assign(new Error("Cannot send a friend request to yourself"), { code: "invalid-argument" });
  const { db, fs } = await fdb();
  const dupCheck = fs.query(
    fs.collection(db, "friendRequests"),
    fs.where("fromUid", "==", fromUid),
    fs.where("toUid", "==", toUid),
    fs.where("status", "==", "pending"),
    fs.limit(1)
  );
  const dup = await fs.getDocs(dupCheck);
  if (!dup.empty) throw Object.assign(new Error("Friend request already sent"), { code: "already-exists" });
  await fs.addDoc(fs.collection(db, "friendRequests"), {
    fromUid, toUid, fromUsername, fromDisplayName, fromPhotoURL: fromPhotoURL || null,
    status: "pending", createdAt: fs.serverTimestamp(),
  });
}

export async function getFriendRequests(uid: string): Promise<FriendRequest[]> {
  const { db, fs } = await fdb();
  const q = fs.query(
    fs.collection(db, "friendRequests"),
    fs.where("toUid", "==", uid),
    fs.where("status", "==", "pending")
  );
  const snap = await fs.getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as FriendRequest));
}

export async function getSentFriendRequests(uid: string): Promise<FriendRequest[]> {
  const { db, fs } = await fdb();
  const q = fs.query(
    fs.collection(db, "friendRequests"),
    fs.where("fromUid", "==", uid),
    fs.where("status", "==", "pending")
  );
  const snap = await fs.getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as FriendRequest));
}

export async function acceptFriendRequest(requestId: string, fromUid: string, toUid: string): Promise<void> {
  const { db, fs } = await fdb();
  const batch = fs.writeBatch(db);
  batch.update(fs.doc(db, "friendRequests", requestId), { status: "accepted" });
  batch.update(fs.doc(db, "users", fromUid), { friendIds: fs.arrayUnion(toUid) });
  batch.update(fs.doc(db, "users", toUid), { friendIds: fs.arrayUnion(fromUid) });
  await batch.commit();
}

export async function declineFriendRequest(requestId: string): Promise<void> {
  const { db, fs } = await fdb();
  await fs.updateDoc(fs.doc(db, "friendRequests", requestId), { status: "declined" });
}

export async function removeFriend(uid: string, friendUid: string): Promise<void> {
  const { db, fs } = await fdb();
  const batch = fs.writeBatch(db);
  batch.update(fs.doc(db, "users", uid), { friendIds: fs.arrayRemove(friendUid) });
  batch.update(fs.doc(db, "users", friendUid), { friendIds: fs.arrayRemove(uid) });
  await batch.commit();
}

// ── Groups ────────────────────────────────────────────────────────────────────

export async function createGroup(data: Omit<Group, "id" | "createdAt">): Promise<string> {
  const { db, fs } = await fdb();
  const ref = await fs.addDoc(fs.collection(db, "groups"), { ...data, createdAt: fs.serverTimestamp() });
  const creator = await getUserProfile(data.createdBy);
  if (creator) {
    await updateUserProfile(data.createdBy, { groupIds: [...(creator.groupIds || []), ref.id] });
  }
  return ref.id;
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const { db, fs } = await fdb();
  const snap = await fs.getDoc(fs.doc(db, "groups", groupId));
  if (!snap.exists()) return null;
  return { ...snap.data(), id: snap.id } as Group;
}

export async function getUserGroups(uid: string): Promise<Group[]> {
  const { db, fs } = await fdb();
  const q = fs.query(fs.collection(db, "groups"), fs.where("memberIds", "array-contains", uid));
  const snap = await fs.getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Group));
}

export async function joinGroup(groupId: string, uid: string): Promise<void> {
  const { db, fs } = await fdb();
  const batch = fs.writeBatch(db);
  batch.update(fs.doc(db, "groups", groupId), { memberIds: fs.arrayUnion(uid) });
  batch.update(fs.doc(db, "users", uid), { groupIds: fs.arrayUnion(groupId) });
  await batch.commit();
}

export async function sendGroupMessage(message: Omit<GroupMessage, "id" | "createdAt" | "likes">): Promise<void> {
  const { db, fs } = await fdb();
  await fs.addDoc(fs.collection(db, `groups/${message.groupId}/messages`), {
    ...message, likes: [], createdAt: fs.serverTimestamp(),
  });
}

export function subscribeToGroupMessages(groupId: string, callback: (messages: GroupMessage[]) => void): () => void {
  let unsub: () => void = () => {};
  Promise.all([import("./firebase"), import("firebase/firestore")]).then(([{ db }, fs]) => {
    const q = fs.query(
      fs.collection(db, `groups/${groupId}/messages`),
      fs.orderBy("createdAt", "asc"),
      fs.limit(100)
    );
    unsub = fs.onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ ...d.data(), id: d.id } as GroupMessage)));
    });
  });
  return () => unsub();
}

// ── Reading Plans ─────────────────────────────────────────────────────────────

export async function createReadingPlan(plan: Omit<ReadingPlan, "id" | "createdAt" | "completionCount">): Promise<string> {
  const { db, fs } = await fdb();
  const ref = await fs.addDoc(fs.collection(db, "readingPlans"), {
    ...plan, completionCount: 0, createdAt: fs.serverTimestamp(),
  });
  return ref.id;
}

export async function getPublicReadingPlans(): Promise<ReadingPlan[]> {
  const { db, fs } = await fdb();
  const q = fs.query(
    fs.collection(db, "readingPlans"),
    fs.where("isPublic", "==", true),
    fs.orderBy("completionCount", "desc"),
    fs.limit(20)
  );
  const snap = await fs.getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as ReadingPlan));
}

export async function getUserReadingPlans(userId: string): Promise<ReadingPlan[]> {
  const { db, fs } = await fdb();
  const q = fs.query(fs.collection(db, "readingPlans"), fs.where("createdBy", "==", userId));
  const snap = await fs.getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as ReadingPlan));
}

export async function updateReadingPlan(
  planId: string,
  data: Partial<Omit<ReadingPlan, "id" | "createdAt" | "createdBy" | "completionCount">>
): Promise<void> {
  const { db, fs } = await fdb();
  await fs.updateDoc(fs.doc(db, "readingPlans", planId), data);
}

export async function deleteReadingPlan(planId: string): Promise<void> {
  const { db, fs } = await fdb();
  await fs.deleteDoc(fs.doc(db, "readingPlans", planId));
}

export async function startReadingPlan(userId: string, planId: string, planName: string): Promise<string> {
  const { db, fs } = await fdb();
  const ref = await fs.addDoc(fs.collection(db, "userPlanProgress"), {
    userId, planId, planName,
    startDate: new Date().toISOString().slice(0, 10),
    completedDays: [], currentDay: 1, isCompleted: false, createdAt: fs.serverTimestamp(),
  });
  return ref.id;
}

export async function markDayComplete(progressId: string, dayNumber: number, userId: string): Promise<void> {
  const { db, fs } = await fdb();
  await fs.updateDoc(fs.doc(db, "userPlanProgress", progressId), {
    completedDays: fs.arrayUnion(dayNumber), currentDay: dayNumber + 1,
  });
  await updateStreak(userId);
}

export async function getUserPlanProgress(userId: string): Promise<UserPlanProgress[]> {
  const { db, fs } = await fdb();
  const q = fs.query(
    fs.collection(db, "userPlanProgress"),
    fs.where("userId", "==", userId),
    fs.where("isCompleted", "==", false)
  );
  const snap = await fs.getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as UserPlanProgress));
}

// ── Annotations / Highlights / Bookmarks ─────────────────────────────────────

export async function saveAnnotation(
  annotation: Omit<Annotation, "id" | "createdAt" | "updatedAt" | "likes" | "replies">
): Promise<string> {
  const { db, fs } = await fdb();
  const ref = await fs.addDoc(fs.collection(db, "annotations"), {
    ...annotation, likes: [], replies: [],
    createdAt: fs.serverTimestamp(), updatedAt: fs.serverTimestamp(),
  });
  return ref.id;
}

export async function getGroupAnnotations(groupId: string): Promise<Annotation[]> {
  const { db, fs } = await fdb();
  const q = fs.query(
    fs.collection(db, "annotations"),
    fs.where("groupId", "==", groupId),
    fs.orderBy("createdAt", "desc"),
    fs.limit(50)
  );
  const snap = await fs.getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Annotation));
}

export async function getVerseAnnotations(bookId: string, chapter: number, verse: number): Promise<Annotation[]> {
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
  const { db, fs } = await fdb();
  const ref = await fs.addDoc(fs.collection(db, "highlights"), {
    ...highlight, createdAt: fs.serverTimestamp(),
  });
  return ref.id;
}

export async function getUserHighlights(userId: string): Promise<Highlight[]> {
  const { db, fs } = await fdb();
  const q = fs.query(fs.collection(db, "highlights"), fs.where("userId", "==", userId), fs.limit(500));
  const snap = await fs.getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Highlight));
}

export async function saveBookmark(bookmark: Omit<Bookmark, "id" | "createdAt">): Promise<string> {
  const { db, fs } = await fdb();
  const ref = await fs.addDoc(fs.collection(db, "bookmarks"), {
    ...bookmark, createdAt: fs.serverTimestamp(),
  });
  return ref.id;
}

export async function getUserBookmarks(userId: string): Promise<Bookmark[]> {
  const { db, fs } = await fdb();
  const q = fs.query(fs.collection(db, "bookmarks"), fs.where("userId", "==", userId), fs.limit(100));
  const snap = await fs.getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Bookmark));
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function addNotification(
  userId: string,
  notification: Omit<Notification, "id" | "userId" | "isRead" | "createdAt">
): Promise<void> {
  const { db, fs } = await fdb();
  await fs.addDoc(fs.collection(db, `users/${userId}/notifications`), {
    ...notification, userId, isRead: false, createdAt: fs.serverTimestamp(),
  });
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const { db, fs } = await fdb();
  const q = fs.query(
    fs.collection(db, `users/${userId}/notifications`),
    fs.orderBy("createdAt", "desc"),
    fs.limit(30)
  );
  const snap = await fs.getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Notification));
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  const { db, fs } = await fdb();
  await fs.updateDoc(fs.doc(db, `users/${userId}/notifications`, notificationId), { isRead: true });
}
