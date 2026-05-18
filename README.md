# Selah

A full-stack social Bible study platform built with Next.js 16, Firebase, and SQLite. Read Scripture, annotate verses, study in groups, track reading streaks, and explore historical context — all in one place.

---

## Features

### Bible Reader
- Read any book and chapter across multiple translations (KJV, ASV, WEB, YLT, BBE, DBY, BSB)
- Full-text verse search backed by a local SQLite database — search phrases like *"love one another"* or *"faith without works"*
- Highlight verses in 5 colors, bookmark chapters, and write private annotations
- Chapter-by-chapter navigation with keyboard shortcuts
- Translation switcher with availability indicators

### Dashboard
- Daily verse — a fresh passage every morning
- Reading streak tracker with a 7-day visual indicator
- Activity feed showing recent group highlights and notes
- Quick-action buttons to jump directly into reading or study

### Groups
- Create public or private Bible study groups
- Private groups generate a shareable join code
- Real-time group chat with accurate relative timestamps
- Shared reading plans with per-member progress tracking
- Admin controls — promote/demote members, remove users
- Admins can permanently delete a group; cleanup removes all messages, plans, progress records, invites, and every member's `groupIds` reference in a single batched operation

### Friends
- Search users by username and send friend requests
- Accept, decline, or cancel requests
- Invite friends directly into groups

### Study Plans
- Browse preset and community reading plans or create fully custom ones
- **Assign any browsed plan to a group in one click** — opens a group picker showing admin/member status and duplicate detection
- Only group admins can assign plans; members see the option but cannot confirm
- Personal plans track daily progress with a day-grid visualization
- Group plans show per-member completion percentages and a shared progress bar
- Admins can delete a group plan and all associated progress in one action

### Context Tab
- Historical overview, author info, and time period for all 66 Bible books
- Timeline of key events per book
- Cultural notes (customs, law, worship, geography, social context)
- Family trees for books where lineage is historically significant (Genesis, Exodus, Ruth, Samuel, Kings, Chronicles, Matthew, Luke, and others)
- Toggle between Quick Facts and Deep Study modes
- Bookmark books for quick access

### Themes & Settings
- 10+ theme presets — light, dark, warm sepia, high contrast, and more
- Profile editing with username, display name, and photo URL
- Notification preferences
- Account deletion

### Onboarding Tour
- 13-step guided product tour that navigates through every section of the app automatically
- Spotlight overlay highlights specific UI elements on each page
- Replayable anytime via the **Help Tour** button in the sidebar

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Auth & Database | Firebase (Auth + Firestore) |
| Bible data | SQLite via `better-sqlite3` (`bible.eng.db`) |
| State management | Zustand |
| UI components | Radix UI primitives |
| Styling | Tailwind CSS + custom CSS design tokens |
| Icons | Lucide React |
| Animations | Framer Motion |
| AI | Anthropic Claude API (`@anthropic-ai/sdk`) |
| Toasts | react-hot-toast |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── bible/
│   │   │   ├── local/      # Chapter fetch from SQLite
│   │   │   ├── search/     # Full-text verse search (AND-logic LIKE queries)
│   │   │   └── translations/ # Available translation list
│   │   ├── ai/             # Claude API route
│   │   ├── config/         # Runtime config endpoint
│   │   └── verse-of-day/   # Daily verse API
│   ├── auth/
│   │   ├── login/
│   │   └── signup/
│   └── dashboard/
│       ├── bible/          # Bible reader
│       ├── context/        # Historical context explorer
│       ├── friends/        # Friend requests and discovery
│       ├── groups/
│       │   └── [id]/       # Group detail — chat, members, plans
│       ├── plans/          # Reading plans
│       ├── profile/        # Settings and themes
│       └── layout.tsx      # Shared sidebar + topbar
├── components/
│   ├── TutorialOverlay.tsx # Navigating product tour
│   ├── TutorialModal.tsx   # Static welcome modal
│   └── bible/              # Bible-specific sub-components
├── contexts/               # React contexts
├── hooks/                  # Custom hooks (useAuth, etc.)
├── lib/
│   ├── bible-api.ts        # Client-side Bible fetch helpers
│   ├── bible-data.ts       # Book metadata (names, chapters, order)
│   ├── context-data.ts     # Aggregated Bible book context data
│   ├── context-parts/      # Per-book historical data (18 files)
│   ├── firebase.ts         # Firebase app init
│   ├── firestore.ts        # All Firestore read/write helpers
│   ├── themes.ts           # Theme definitions
│   └── utils.ts            # timeAgo, formatDate, getInitials, etc.
├── store/
│   ├── auth-store.ts       # Zustand auth state
│   └── theme-store.ts      # Zustand theme state
└── types/
    └── index.ts            # Shared TypeScript interfaces
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with **Authentication** and **Firestore** enabled
- The `bible.eng.db` SQLite file placed at `data/bible.eng.db` (contains KJV, ASV, WEB, and other translations)

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
ANTHROPIC_API_KEY=
```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

---

## Bible Database

The app reads from a local SQLite file at `data/bible.eng.db`. The schema uses a `ChapterVerse` table:

```sql
ChapterVerse(translationId, bookId, chapterNumber, number, text)
```

Translation IDs used internally:

| App ID | Database ID |
|--------|-------------|
| KJV | eng_kjv |
| ASV | eng_asv |
| WEB | ENGWEBP |
| WEBBE | eng_webpb |
| YLT | eng_ylt |
| BBE | eng_bbe |
| DBY | eng_dby |
| BSB | BSB |

---

## Key Design Decisions

**Local SQLite for Bible data** — verse search runs sub-millisecond LIKE queries against 31 k+ KJV verses without any external API dependency or rate limits.

**Firebase serverTimestamp for messages** — all group chat timestamps use `serverTimestamp()` so times are consistent across devices and timezones. The `timeAgo()` utility handles Firestore `Timestamp` objects directly (not just JS `Date`).

**Conditional family trees** — the Context tab only shows the Family Trees section for books where at least 2 genealogy nodes have a `parentId` relationship, keeping the tab clean for Psalms, epistles, and other non-lineage books.

**Design token system** — colors, spacing, and typography are driven by CSS custom properties (`--paper`, `--ink-1..4`, `--accent-btn`, `--hairline`, etc.) so all 10 themes update without component changes.

**Group deletion with full cleanup** — deleting a group runs sequential batched writes (≤ 400 ops each) to remove the messages subcollection, then all top-level documents that reference the group (`groupReadingLogs`, `groupInvites`, `readingPlans`, `groupPlanProgress`), then strips the `groupId` from every member's user document, and finally deletes the group document itself. Admin status is verified server-side before any write runs.

**Plan assignment from Browse** — assigning a preset or community plan to a group creates a new `readingPlans` document with the `groupId` set. A server-side query checks for an existing plan with the same name in the same group before writing, so duplicates are impossible even with concurrent clicks. Admin status is enforced at the Firestore function level independently of the UI gate.

---

## Firestore Collections

```
users/{uid}
usernames/{username}
groups/{groupId}
groups/{groupId}/messages/{messageId}
friendRequests/{requestId}
groupInvites/{inviteId}
groupReadingLogs/{logId}
annotations/{annotationId}
highlights/{highlightId}
bookmarks/{bookmarkId}
readingPlans/{planId}            # groupId field present when assigned to a group
userPlanProgress/{progressId}
groupPlanProgress/{progressId}   # composite key: {groupId}_{planId}_{userId}
notifications/{notificationId}
```
