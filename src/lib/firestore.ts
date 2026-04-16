import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  User,
  Group,
  GroupMessage,
  ReadingPlan,
  UserPlanProgress,
  Annotation,
  Highlight,
  Bookmark,
  FriendRequest,
  Notification,
} from "@/types";
import { format } from "date-fns";

// ── User Operations ──────────────────────────────────────────────────────────

export async function createUserProfile(
  uid: string,
  data: Partial<User>
): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    ...data,
    uid,
    currentStreak: 0,
    longestStreak: 0,
    totalDaysRead: 0,
    badges: [],
    friendIds: [],
    groupIds: [],
    preferredTranslation: "KJV",
    notificationsEnabled: true,
    createdAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { ...snap.data(), uid: snap.id } as User;
}

export async function updateUserProfile(
  uid: string,
  data: Partial<User>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), data);
}

export async function searchUsersByUsername(
  searchTerm: string
): Promise<User[]> {
  const q = query(
    collection(db, "users"),
    where("username", ">=", searchTerm.toLowerCase()),
    where("username", "<=", searchTerm.toLowerCase() + "\uf8ff"),
    limit(10)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), uid: d.id } as User));
}

// ── Streak Operations ─────────────────────────────────────────────────────────

export async function updateStreak(uid: string): Promise<void> {
  const user = await getUserProfile(uid);
  if (!user) return;

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(
    new Date(Date.now() - 86400000),
    "yyyy-MM-dd"
  );

  if (user.lastReadDate === today) return; // already updated today

  const newStreak =
    user.lastReadDate === yesterday ? user.currentStreak + 1 : 1;
  const longestStreak = Math.max(newStreak, user.longestStreak || 0);

  await updateDoc(doc(db, "users", uid), {
    lastReadDate: today,
    currentStreak: newStreak,
    longestStreak,
    totalDaysRead: (user.totalDaysRead || 0) + 1,
  });

  // Award streak badges
  await checkAndAwardBadges(uid, newStreak);
}

async function checkAndAwardBadges(
  uid: string,
  streak: number
): Promise<void> {
  const milestones: Record<number, { id: string; name: string; icon: string }> =
    {
      7: { id: "streak_7", name: "Week Warrior", icon: "🔥" },
      30: { id: "streak_30", name: "Monthly Devotee", icon: "⭐" },
      100: { id: "streak_100", name: "Century Scholar", icon: "💎" },
      365: { id: "streak_365", name: "Year of Faith", icon: "👑" },
    };

  if (milestones[streak]) {
    const badge = milestones[streak];
    await updateDoc(doc(db, "users", uid), {
      badges: arrayUnion({
        ...badge,
        description: `Read the Bible for ${streak} consecutive days`,
        type: "streak",
        earnedAt: Timestamp.now(),
      }),
    });
  }
}

// ── Friend Operations ────────────────────────────────────────────────────────

export async function sendFriendRequest(
  fromUid: string,
  toUid: string,
  fromUsername: string,
  fromDisplayName: string,
  fromPhotoURL?: string
): Promise<void> {
  const existing = query(
    collection(db, "friendRequests"),
    where("fromUid", "==", fromUid),
    where("toUid", "==", toUid),
    where("status", "==", "pending")
  );
  const snap = await getDocs(existing);
  if (!snap.empty) return;

  await addDoc(collection(db, "friendRequests"), {
    fromUid,
    toUid,
    fromUsername,
    fromDisplayName,
    fromPhotoURL: fromPhotoURL || null,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  await addNotification(toUid, {
    type: "friend_request",
    title: "New Friend Request",
    body: `${fromDisplayName} (@${fromUsername}) sent you a friend request`,
    data: { fromUid, fromUsername },
  });
}

export async function acceptFriendRequest(
  requestId: string,
  fromUid: string,
  toUid: string
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, "friendRequests", requestId), { status: "accepted" });
  batch.update(doc(db, "users", fromUid), { friendIds: arrayUnion(toUid) });
  batch.update(doc(db, "users", toUid), { friendIds: arrayUnion(fromUid) });
  await batch.commit();
}

export async function declineFriendRequest(
  requestId: string
): Promise<void> {
  await updateDoc(doc(db, "friendRequests", requestId), {
    status: "declined",
  });
}

export async function getFriendRequests(uid: string): Promise<FriendRequest[]> {
  const q = query(
    collection(db, "friendRequests"),
    where("toUid", "==", uid),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as FriendRequest));
}

export async function removeFriend(
  uid: string,
  friendUid: string
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, "users", uid), { friendIds: arrayRemove(friendUid) });
  batch.update(doc(db, "users", friendUid), { friendIds: arrayRemove(uid) });
  await batch.commit();
}

// ── Group Operations ─────────────────────────────────────────────────────────

export async function createGroup(
  data: Omit<Group, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "groups"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "users", data.createdBy), {
    groupIds: arrayUnion(ref.id),
  });
  return ref.id;
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const snap = await getDoc(doc(db, "groups", groupId));
  if (!snap.exists()) return null;
  return { ...snap.data(), id: snap.id } as Group;
}

export async function getUserGroups(uid: string): Promise<Group[]> {
  const q = query(
    collection(db, "groups"),
    where("memberIds", "array-contains", uid)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Group));
}

export async function joinGroup(
  groupId: string,
  uid: string
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, "groups", groupId), { memberIds: arrayUnion(uid) });
  batch.update(doc(db, "users", uid), { groupIds: arrayUnion(groupId) });
  await batch.commit();
}

export async function sendGroupMessage(
  message: Omit<GroupMessage, "id" | "createdAt" | "likes">
): Promise<void> {
  await addDoc(collection(db, `groups/${message.groupId}/messages`), {
    ...message,
    likes: [],
    createdAt: serverTimestamp(),
  });
}

export function subscribeToGroupMessages(
  groupId: string,
  callback: (messages: GroupMessage[]) => void
) {
  const q = query(
    collection(db, `groups/${groupId}/messages`),
    orderBy("createdAt", "asc"),
    limit(100)
  );
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ ...d.data(), id: d.id } as GroupMessage))
    );
  });
}

// ── Reading Plan Operations ───────────────────────────────────────────────────

export async function createReadingPlan(
  plan: Omit<ReadingPlan, "id" | "createdAt" | "completionCount">
): Promise<string> {
  const ref = await addDoc(collection(db, "readingPlans"), {
    ...plan,
    completionCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getPublicReadingPlans(): Promise<ReadingPlan[]> {
  const q = query(
    collection(db, "readingPlans"),
    where("isPublic", "==", true),
    orderBy("completionCount", "desc"),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as ReadingPlan));
}

export async function startReadingPlan(
  userId: string,
  planId: string,
  planName: string
): Promise<string> {
  const ref = await addDoc(collection(db, "userPlanProgress"), {
    userId,
    planId,
    planName,
    startDate: format(new Date(), "yyyy-MM-dd"),
    completedDays: [],
    currentDay: 1,
    isCompleted: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function markDayComplete(
  progressId: string,
  dayNumber: number,
  userId: string
): Promise<void> {
  await updateDoc(doc(db, "userPlanProgress", progressId), {
    completedDays: arrayUnion(dayNumber),
    currentDay: dayNumber + 1,
  });
  await updateStreak(userId);
}

export async function getUserPlanProgress(
  userId: string
): Promise<UserPlanProgress[]> {
  const q = query(
    collection(db, "userPlanProgress"),
    where("userId", "==", userId),
    where("isCompleted", "==", false),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ ...d.data(), id: d.id } as UserPlanProgress)
  );
}

// ── Annotations / Highlights / Bookmarks ─────────────────────────────────────

export async function saveAnnotation(
  annotation: Omit<Annotation, "id" | "createdAt" | "updatedAt" | "likes" | "replies">
): Promise<string> {
  const ref = await addDoc(collection(db, "annotations"), {
    ...annotation,
    likes: [],
    replies: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getVerseAnnotations(
  bookId: string,
  chapter: number,
  verse: number,
  groupId?: string
): Promise<Annotation[]> {
  let q;
  if (groupId) {
    q = query(
      collection(db, "annotations"),
      where("verseRef.bookId", "==", bookId),
      where("verseRef.chapter", "==", chapter),
      where("verseRef.verse", "==", verse),
      where("groupId", "==", groupId),
      orderBy("createdAt", "desc")
    );
  } else {
    q = query(
      collection(db, "annotations"),
      where("verseRef.bookId", "==", bookId),
      where("verseRef.chapter", "==", chapter),
      where("verseRef.verse", "==", verse),
      where("isPrivate", "==", false),
      orderBy("createdAt", "desc")
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Annotation));
}

export async function saveHighlight(
  highlight: Omit<Highlight, "id" | "createdAt">
): Promise<string> {
  const existing = query(
    collection(db, "highlights"),
    where("userId", "==", highlight.userId),
    where("verseRef.bookId", "==", highlight.verseRef.bookId),
    where("verseRef.chapter", "==", highlight.verseRef.chapter),
    where("verseRef.verse", "==", highlight.verseRef.verse)
  );
  const snap = await getDocs(existing);
  if (!snap.empty) {
    await updateDoc(doc(db, "highlights", snap.docs[0].id), {
      color: highlight.color,
    });
    return snap.docs[0].id;
  }
  const ref = await addDoc(collection(db, "highlights"), {
    ...highlight,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserHighlights(userId: string): Promise<Highlight[]> {
  const q = query(
    collection(db, "highlights"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(500)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Highlight));
}

export async function saveBookmark(
  bookmark: Omit<Bookmark, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "bookmarks"), {
    ...bookmark,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserBookmarks(userId: string): Promise<Bookmark[]> {
  const q = query(
    collection(db, "bookmarks"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Bookmark));
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function addNotification(
  userId: string,
  notification: Omit<Notification, "id" | "userId" | "isRead" | "createdAt">
): Promise<void> {
  await addDoc(collection(db, `users/${userId}/notifications`), {
    ...notification,
    userId,
    isRead: false,
    createdAt: serverTimestamp(),
  });
}

export async function getUserNotifications(
  userId: string
): Promise<Notification[]> {
  const q = query(
    collection(db, `users/${userId}/notifications`),
    orderBy("createdAt", "desc"),
    limit(30)
  );
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ ...d.data(), id: d.id } as Notification)
  );
}

export async function markNotificationRead(
  userId: string,
  notificationId: string
): Promise<void> {
  await updateDoc(
    doc(db, `users/${userId}/notifications`, notificationId),
    { isRead: true }
  );
}
