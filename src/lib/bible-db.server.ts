/**
 * bible-db.server.ts  — SERVER-SIDE ONLY, never import from client components.
 *
 * Database: data/bible.eng.db  (Prisma-managed SQLite)
 * Key tables:
 *   Translation  — id (e.g. "eng_kjv"), shortName, englishName
 *   Book         — id (e.g. "GEN"), translationId, commonName, order
 *   ChapterVerse — bookId, translationId, chapterNumber, number (verse), text
 */

import path from "path";
import fs from "fs";

// ---------------------------------------------------------------------------
// Translation map: app-facing ID → DB translationId
// ---------------------------------------------------------------------------

const TRANSLATION_MAP: Record<string, { dbId: string; name: string }> = {
  KJV:  { dbId: "eng_kjv",  name: "King James Version" },
  ASV:  { dbId: "eng_asv",  name: "American Standard Version" },
  WEB:  { dbId: "ENGWEBP",  name: "World English Bible" },
  YLT:  { dbId: "eng_ylt",  name: "Young's Literal Translation" },
  BBE:  { dbId: "eng_bbe",  name: "Bible in Basic English" },
  BSB:  { dbId: "BSB",      name: "Berean Standard Bible" },
  NET:  { dbId: "eng_net",  name: "NET Bible" },
  DBY:  { dbId: "eng_dby",  name: "Darby Translation" },
};

export type TranslationInfo = {
  id: string;
  name: string;
  abbreviation: string;
  available: boolean;
};

export type VerseRow = { verse: number; text: string };

export type SearchResult = {
  bookId: string;
  chapter: number;
  verse: number;
  text: string;
};

// ---------------------------------------------------------------------------
// DB singleton
// ---------------------------------------------------------------------------

const DB_PATH = path.join(process.cwd(), "data", "bible.eng.db");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;
let _checkedTranslations: Set<string> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDb(): any | null {
  if (_db) return _db;
  if (!fs.existsSync(DB_PATH)) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");
  try {
    _db = new Database(DB_PATH, { readonly: true });
  } catch {
    return null;
  }
  return _db;
}

// Pre-warm connection when module first loads so first user request is instant
try { getDb(); } catch { /* ignore */ }

/** Return the set of translation DB IDs that actually exist in the DB. */
function getAvailableDbIds(): Set<string> {
  if (_checkedTranslations) return _checkedTranslations;
  const db = getDb();
  if (!db) { _checkedTranslations = new Set(); return _checkedTranslations; }
  const rows = db.prepare("SELECT id FROM Translation").all() as { id: string }[];
  _checkedTranslations = new Set(rows.map(r => r.id));
  return _checkedTranslations;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getAvailableTranslations(): TranslationInfo[] {
  const available = getAvailableDbIds();
  return Object.entries(TRANSLATION_MAP).map(([id, { dbId, name }]) => ({
    id,
    name,
    abbreviation: id,
    available: available.has(dbId),
  }));
}

export function getAllDbTranslations(): Array<{ id: string; dbId: string; name: string }> {
  const db = getDb();
  if (!db) return Object.entries(TRANSLATION_MAP).map(([id, { dbId, name }]) => ({ id, dbId, name }));

  // Build reverse map from dbId to app-facing abbreviation
  const reverseMap: Record<string, string> = {};
  for (const [appId, { dbId }] of Object.entries(TRANSLATION_MAP)) {
    reverseMap[dbId] = appId;
  }

  const rows = db.prepare(
    "SELECT id, shortName, englishName FROM Translation ORDER BY id ASC"
  ).all() as { id: string; shortName?: string; englishName?: string }[];

  return rows.map((r) => {
    const appId = reverseMap[r.id] ?? r.id.replace(/^eng_/, "").toUpperCase();
    const name = r.englishName || r.shortName || appId;
    return { id: appId, dbId: r.id, name };
  });
}

export function isTranslationAvailable(translation: string): boolean {
  const entry = TRANSLATION_MAP[translation.toUpperCase()];
  if (!entry) return false;
  return getAvailableDbIds().has(entry.dbId);
}

/** Fetch all verses for a chapter. bookId is the 3-letter code, e.g. "GEN". */
export function getChapter(
  translation: string,
  bookId: string,
  chapter: number
): VerseRow[] {
  const db = getDb();
  if (!db) return [];
  const entry = TRANSLATION_MAP[translation.toUpperCase()];
  if (!entry) return [];

  const rows = db
    .prepare(
      `SELECT number AS verse, text
       FROM ChapterVerse
       WHERE translationId = ? AND bookId = ? AND chapterNumber = ?
       ORDER BY number ASC`
    )
    .all(entry.dbId, bookId.toUpperCase(), chapter) as VerseRow[];

  return rows;
}

/** Fetch a single verse. Returns the text string or null. */
export function getVerse(
  translation: string,
  bookId: string,
  chapter: number,
  verse: number
): string | null {
  const db = getDb();
  if (!db) return null;
  const entry = TRANSLATION_MAP[translation.toUpperCase()];
  if (!entry) return null;

  const row = db
    .prepare(
      `SELECT text
       FROM ChapterVerse
       WHERE translationId = ? AND bookId = ? AND chapterNumber = ? AND number = ?
       LIMIT 1`
    )
    .get(entry.dbId, bookId.toUpperCase(), chapter, verse) as { text: string } | undefined;

  return row?.text ?? null;
}

/** LIKE-based full-text search across a translation. */
export function searchVerses(
  translation: string,
  query: string,
  limit = 20
): SearchResult[] {
  const db = getDb();
  if (!db || !query.trim()) return [];
  const entry = TRANSLATION_MAP[translation.toUpperCase()];
  if (!entry) return [];

  const likePattern = `%${query.replace(/[%_]/g, c => `\\${c}`)}%`;

  const rows = db
    .prepare(
      `SELECT bookId, chapterNumber AS chapter, number AS verse, text
       FROM ChapterVerse
       WHERE translationId = ? AND text LIKE ? ESCAPE '\\'
       LIMIT ?`
    )
    .all(entry.dbId, likePattern, limit) as SearchResult[];

  return rows;
}
