export interface User {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  createdAt: Date;
  currentStreak: number;
  longestStreak: number;
  lastReadDate?: string; // YYYY-MM-DD
  totalDaysRead: number;
  badges: Badge[];
  friendIds: string[];
  groupIds: string[];
  preferredTranslation: BibleTranslation;
  notificationsEnabled: boolean;
  dailyReminderTime?: string;
  interests?: string[];
  theme?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  type: "streak" | "reading" | "social" | "achievement";
}

export interface Friend {
  uid: string;
  username: string;
  displayName: string;
  photoURL?: string;
  currentStreak: number;
  status: "friend" | "pending_sent" | "pending_received";
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  toUid: string;
  fromUsername: string;
  fromDisplayName: string;
  fromPhotoURL?: string;
  createdAt: Date;
  status: "pending" | "accepted" | "declined";
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  photoURL?: string;
  createdBy: string;
  createdAt: Date;
  memberIds: string[];
  adminIds: string[];
  currentPlanId?: string;
  isPublic: boolean;
  tags?: string[];
}

export interface GroupMember {
  uid: string;
  username: string;
  displayName: string;
  photoURL?: string;
  role: "admin" | "member";
  joinedAt: Date;
  progress?: number;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  authorUid: string;
  authorUsername: string;
  authorPhotoURL?: string;
  content: string;
  createdAt: Date;
  replyToId?: string;
  likes: string[]; // user UIDs who liked
  type: "text" | "verse" | "prayer" | "announcement";
  verseRef?: VerseReference;
}

export type BibleTranslation =
  | "KJV"
  | "ASV"
  | "WEB"
  | "WEBBE"
  | "YLT"
  | "BBE"
  | "DBY"
  | "OEB";

export interface BibleBook {
  id: string;
  name: string;
  abbreviation: string;
  chapters: number;
  testament: "OT" | "NT";
  order: number;
}

export interface BibleVerse {
  id: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  translation: BibleTranslation;
}

export interface BibleChapter {
  bookId: string;
  bookName: string;
  chapter: number;
  verses: BibleVerse[];
  translation: BibleTranslation;
}

export interface VerseReference {
  bookId: string;
  bookName: string;
  chapter: number;
  verse?: number;
  verseEnd?: number;
  translation: BibleTranslation;
}

export interface Annotation {
  id: string;
  userId: string;
  username: string;
  photoURL?: string;
  verseRef: VerseReference;
  content: string;
  type: "note" | "question" | "insight" | "prayer";
  isPrivate: boolean;
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
  likes: string[];
  replies: AnnotationReply[];
  highlightColor?: HighlightColor;
}

export interface AnnotationReply {
  id: string;
  userId: string;
  username: string;
  photoURL?: string;
  content: string;
  createdAt: Date;
  likes: string[];
}

export type HighlightColor =
  | "yellow"
  | "green"
  | "blue"
  | "pink"
  | "orange";

export interface Highlight {
  id: string;
  userId: string;
  verseRef: VerseReference;
  color: HighlightColor;
  createdAt: Date;
}

export interface Bookmark {
  id: string;
  userId: string;
  verseRef: VerseReference;
  note?: string;
  createdAt: Date;
  tags?: string[];
}

export interface ReadingPlan {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  isPublic: boolean;
  duration: number; // days
  days: ReadingPlanDay[];
  memberIds: string[];
  groupId?: string;
  coverImage?: string;
  tags?: string[];
  completionCount: number;
  selectedBooks?: string[];
}

export interface ReadingPlanDay {
  dayNumber: number;
  title?: string;
  readings: VerseReference[];
}

export interface UserPlanProgress {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  startDate: string; // YYYY-MM-DD
  completedDays: number[];
  currentDay: number;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface VerseOfDay {
  id: string;
  date: string; // YYYY-MM-DD
  verseRef: VerseReference;
  text: string;
  theme?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type:
    | "friend_request"
    | "group_invite"
    | "reading_reminder"
    | "streak_warning"
    | "badge_earned"
    | "group_message"
    | "plan_update";
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
  data?: Record<string, string>;
}

export interface AIsuggestion {
  type: "reading_plan" | "related_verses" | "reflection";
  title: string;
  content: string;
  verseRefs?: VerseReference[];
}
