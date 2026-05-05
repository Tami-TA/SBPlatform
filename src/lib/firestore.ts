import type {
  User, Group, GroupMessage, ReadingPlan, UserPlanProgress,
  Annotation, AnnotationReply, Highlight, Bookmark, FriendRequest, Notification,
  GroupInvite, GroupReadingLog, GroupPlanProgress,
} from "@/types";

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

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

// ── Username uniqueness ───────────────────────────────────────────────────────

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const { db, fs } = await fdb();
  const snap = await fs.getDoc(fs.doc(db, "usernames", username));
  return !snap.exists();
}

export async function reserveUsername(username: string, uid: string): Promise<void> {
  const { db, fs } = await fdb();
  await fs.setDoc(fs.doc(db, "usernames", username), { uid });
}

export async function updateUsername(uid: string, oldUsername: string, newUsername: string): Promise<void> {
  const { db, fs } = await fdb();
  const snap = await fs.getDoc(fs.doc(db, "usernames", newUsername));
  if (snap.exists() && (snap.data() as { uid: string }).uid !== uid) {
    throw Object.assign(new Error("Username already taken"), { code: "already-exists" });
  }
  const batch = fs.writeBatch(db);
  if (oldUsername) batch.delete(fs.doc(db, "usernames", oldUsername));
  batch.set(fs.doc(db, "usernames", newUsername), { uid });
  batch.update(fs.doc(db, "users", uid), { username: newUsername });
  await batch.commit();
}

// ── Account deletion ──────────────────────────────────────────────────────────

export async function deleteUserAccount(uid: string, username: string): Promise<void> {
  const { db, fs } = await fdb();

  // Main user doc + username reservation
  const mainBatch = fs.writeBatch(db);
  mainBatch.delete(fs.doc(db, "users", uid));
  if (username) mainBatch.delete(fs.doc(db, "usernames", username));
  await mainBatch.commit();

  // Friend requests
  const [sentSnap, recvSnap] = await Promise.all([
    fs.getDocs(fs.query(fs.collection(db, "friendRequests"), fs.where("fromUid", "==", uid))),
    fs.getDocs(fs.query(fs.collection(db, "friendRequests"), fs.where("toUid", "==", uid))),
  ]);
  if (sentSnap.size + recvSnap.size > 0) {
    const reqBatch = fs.writeBatch(db);
    [...sentSnap.docs, ...recvSnap.docs].forEach(d => reqBatch.delete(d.ref));
    await reqBatch.commit();
  }

  // Remove user from all groups
  const groupsSnap = await fs.getDocs(
    fs.query(fs.collection(db, "groups"), fs.where("memberIds", "array-contains", uid))
  );
  if (!groupsSnap.empty) {
    const grpBatch = fs.writeBatch(db);
    groupsSnap.docs.forEach(d => grpBatch.update(d.ref, {
      memberIds: fs.arrayRemove(uid),
      adminIds:  fs.arrayRemove(uid),
    }));
    await grpBatch.commit();
  }

  // User-owned content (annotations, highlights, bookmarks, plan progress)
  await Promise.all([
    fs.getDocs(fs.query(fs.collection(db, "annotations"),    fs.where("userId", "==", uid))),
    fs.getDocs(fs.query(fs.collection(db, "highlights"),     fs.where("userId", "==", uid))),
    fs.getDocs(fs.query(fs.collection(db, "bookmarks"),      fs.where("userId", "==", uid))),
    fs.getDocs(fs.query(fs.collection(db, "userPlanProgress"), fs.where("userId", "==", uid))),
  ].map(async (promise) => {
    const snap = await promise;
    if (snap.empty) return;
    const b = fs.writeBatch(db);
    snap.docs.forEach(d => b.delete(d.ref));
    await b.commit();
  }));
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
  const groupData = {
    ...data,
    joinCode: data.isPublic ? null : generateJoinCode(),
    createdAt: fs.serverTimestamp(),
  };
  const ref = await fs.addDoc(fs.collection(db, "groups"), groupData);
  const batch = fs.writeBatch(db);
  batch.update(fs.doc(db, "users", data.createdBy), { groupIds: fs.arrayUnion(ref.id) });
  await batch.commit();
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

export async function getPublicGroups(excludeIds: string[] = []): Promise<Group[]> {
  const { db, fs } = await fdb();
  const q = fs.query(
    fs.collection(db, "groups"),
    fs.where("isPublic", "==", true),
    fs.limit(20)
  );
  const snap = await fs.getDocs(q);
  return snap.docs
    .map(d => ({ ...d.data(), id: d.id } as Group))
    .filter(g => !excludeIds.includes(g.id));
}

export async function joinGroup(groupId: string, uid: string): Promise<void> {
  const { db, fs } = await fdb();
  const groupSnap = await fs.getDoc(fs.doc(db, "groups", groupId));
  if (!groupSnap.exists()) throw Object.assign(new Error("Group not found"), { code: "not-found" });
  const groupData = groupSnap.data() as Group;
  if (groupData.memberIds.includes(uid)) throw Object.assign(new Error("Already a member"), { code: "already-exists" });
  const batch = fs.writeBatch(db);
  batch.update(fs.doc(db, "groups", groupId), { memberIds: fs.arrayUnion(uid) });
  batch.update(fs.doc(db, "users", uid), { groupIds: fs.arrayUnion(groupId) });
  await batch.commit();
}

export async function joinGroupByCode(code: string, uid: string): Promise<Group> {
  const { db, fs } = await fdb();
  const q = fs.query(
    fs.collection(db, "groups"),
    fs.where("joinCode", "==", code.toUpperCase().trim()),
    fs.limit(1)
  );
  const snap = await fs.getDocs(q);
  if (snap.empty) throw Object.assign(new Error("Invalid join code — double-check and try again"), { code: "not-found" });
  const groupDoc = snap.docs[0];
  const group = { ...groupDoc.data(), id: groupDoc.id } as Group;
  await joinGroup(group.id, uid);
  return group;
}

export async function getGroupMemberProfiles(memberIds: string[]): Promise<User[]> {
  if (memberIds.length === 0) return [];
  const profiles = await Promise.all(memberIds.map(uid => getUserProfile(uid)));
  return profiles.filter(Boolean) as User[];
}

export async function logGroupReading(groupId: string, userId: string, date: string): Promise<void> {
  const { db, fs } = await fdb();
  const q = fs.query(
    fs.collection(db, "groupReadingLogs"),
    fs.where("groupId", "==", groupId),
    fs.where("userId", "==", userId),
    fs.where("date", "==", date),
    fs.limit(1)
  );
  const snap = await fs.getDocs(q);
  if (!snap.empty) return;
  await fs.addDoc(fs.collection(db, "groupReadingLogs"), {
    groupId, userId, date, completed: true,
  });
}

export async function getGroupReadingLogs(groupId: string, date: string): Promise<GroupReadingLog[]> {
  const { db, fs } = await fdb();
  const q = fs.query(
    fs.collection(db, "groupReadingLogs"),
    fs.where("groupId", "==", groupId),
    fs.where("date", "==", date)
  );
  const snap = await fs.getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as GroupReadingLog));
}

export async function inviteFriendToGroup(groupId: string, groupName: string, fromUid: string, fromUsername: string, toUid: string): Promise<void> {
  const { db, fs } = await fdb();
  const dupCheck = fs.query(
    fs.collection(db, "groupInvites"),
    fs.where("groupId", "==", groupId),
    fs.where("toUid", "==", toUid),
    fs.where("status", "==", "pending"),
    fs.limit(1)
  );
  const dup = await fs.getDocs(dupCheck);
  if (!dup.empty) throw Object.assign(new Error("Invite already sent"), { code: "already-exists" });
  await fs.addDoc(fs.collection(db, "groupInvites"), {
    groupId, groupName, fromUid, fromUsername, toUid,
    status: "pending", createdAt: fs.serverTimestamp(),
  });
}

export async function getGroupInvites(uid: string): Promise<GroupInvite[]> {
  const { db, fs } = await fdb();
  const q = fs.query(
    fs.collection(db, "groupInvites"),
    fs.where("toUid", "==", uid),
    fs.where("status", "==", "pending")
  );
  const snap = await fs.getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as GroupInvite));
}

export async function respondGroupInvite(inviteId: string, groupId: string, uid: string, accept: boolean): Promise<void> {
  const { db, fs } = await fdb();
  const status = accept ? "accepted" : "declined";
  await fs.updateDoc(fs.doc(db, "groupInvites", inviteId), { status });
  if (accept) await joinGroup(groupId, uid);
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
    fs.limit(100)
  );
  const snap = await fs.getDocs(q);
  return snap.docs
    .map(d => ({ ...d.data(), id: d.id } as Annotation))
    .sort((a, b) => {
      const ta = (a.createdAt as { seconds?: number })?.seconds ?? 0;
      const tb = (b.createdAt as { seconds?: number })?.seconds ?? 0;
      return tb - ta;
    });
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

export async function getUserAnnotations(userId: string): Promise<Annotation[]> {
  const { db, fs } = await fdb();
  const q = fs.query(
    fs.collection(db, "annotations"),
    fs.where("userId", "==", userId),
    fs.limit(500)
  );
  const snap = await fs.getDocs(q);
  return snap.docs
    .map(d => ({ ...d.data(), id: d.id } as Annotation))
    .filter(a => !a.groupId);
}

export async function upsertHighlight(highlight: Omit<Highlight, "id" | "createdAt">): Promise<void> {
  const { db, fs } = await fdb();
  const docId = `${highlight.userId}_${highlight.verseRef.bookId}_${highlight.verseRef.chapter}_${highlight.verseRef.verse}`;
  await fs.setDoc(fs.doc(db, "highlights", docId), {
    ...highlight, createdAt: fs.serverTimestamp(),
  });
}

export async function getGroupReadingPlans(groupId: string): Promise<ReadingPlan[]> {
  const { db, fs } = await fdb();
  const q = fs.query(
    fs.collection(db, "readingPlans"),
    fs.where("groupId", "==", groupId)
  );
  const snap = await fs.getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as ReadingPlan));
}

export async function startGroupPlanProgress(
  groupId: string, planId: string, planName: string, userId: string
): Promise<string> {
  const { db, fs } = await fdb();
  const docId = `${groupId}_${planId}_${userId}`;
  const ref = fs.doc(db, "groupPlanProgress", docId);
  const snap = await fs.getDoc(ref);
  if (snap.exists()) return docId;
  await fs.setDoc(ref, {
    groupId, planId, planName, userId,
    startDate: new Date().toISOString().slice(0, 10),
    completedDays: [], currentDay: 1, isCompleted: false,
    createdAt: fs.serverTimestamp(),
  });
  return docId;
}

export async function getGroupPlanProgress(groupId: string, planId: string): Promise<GroupPlanProgress[]> {
  const { db, fs } = await fdb();
  const q = fs.query(
    fs.collection(db, "groupPlanProgress"),
    fs.where("groupId", "==", groupId),
    fs.where("planId", "==", planId)
  );
  const snap = await fs.getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as GroupPlanProgress));
}

export async function markGroupPlanDayComplete(progressId: string, dayNumber: number): Promise<void> {
  const { db, fs } = await fdb();
  await fs.updateDoc(fs.doc(db, "groupPlanProgress", progressId), {
    completedDays: fs.arrayUnion(dayNumber),
    currentDay: dayNumber + 1,
  });
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

// ── Group Bible — collaborative annotations ────────────────────────────────────

/**
 * Real-time subscription to all annotations for a group + chapter.
 * Queries by groupId only (Firestore index-safe) then filters client-side.
 */
export function subscribeToGroupBibleAnnotations(
  groupId: string,
  bookId: string,
  chapter: number,
  callback: (annotations: Annotation[]) => void
): () => void {
  let unsub: () => void = () => {};
  Promise.all([import("./firebase"), import("firebase/firestore")]).then(([{ db }, fs]) => {
    const q = fs.query(
      fs.collection(db, "annotations"),
      fs.where("groupId", "==", groupId)
    );
    unsub = fs.onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Annotation));
      callback(
        all
          .filter(a => a.verseRef.bookId === bookId && a.verseRef.chapter === chapter)
          .sort((a, b) => {
            const ta = (a.createdAt as { seconds?: number })?.seconds ?? 0;
            const tb = (b.createdAt as { seconds?: number })?.seconds ?? 0;
            return ta - tb;
          })
      );
    }, (err) => {
      console.error("subscribeToGroupBibleAnnotations error:", err);
    });
  });
  return () => unsub();
}

export async function saveGroupBibleAnnotation(
  annotation: Omit<Annotation, "id" | "createdAt" | "updatedAt" | "likes" | "replies">
): Promise<string> {
  const { db, fs } = await fdb();
  const ref = await fs.addDoc(fs.collection(db, "annotations"), {
    ...annotation,
    likes: [],
    replies: [],
    createdAt: fs.serverTimestamp(),
    updatedAt: fs.serverTimestamp(),
  });
  return ref.id;
}

export async function deleteGroupBibleAnnotation(annotationId: string): Promise<void> {
  const { db, fs } = await fdb();
  await fs.deleteDoc(fs.doc(db, "annotations", annotationId));
}

export async function toggleGroupAnnotationLike(annotationId: string, uid: string): Promise<void> {
  const { db, fs } = await fdb();
  const ref = fs.doc(db, "annotations", annotationId);
  const snap = await fs.getDoc(ref);
  if (!snap.exists()) return;
  const likes = (snap.data().likes ?? []) as string[];
  await fs.updateDoc(ref, {
    likes: likes.includes(uid) ? fs.arrayRemove(uid) : fs.arrayUnion(uid),
  });
}

export async function addGroupAnnotationReply(
  annotationId: string,
  reply: Omit<AnnotationReply, "id" | "createdAt" | "likes">
): Promise<void> {
  const { db, fs } = await fdb();
  const newReply: Record<string, unknown> = {
    ...reply,
    id: fs.doc(fs.collection(db, "_")).id,
    likes: [],
    createdAt: fs.serverTimestamp(),
  };
  await fs.updateDoc(fs.doc(db, "annotations", annotationId), {
    replies: fs.arrayUnion(newReply),
  });
}
