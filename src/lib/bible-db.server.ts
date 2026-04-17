/**
 * bible-db.server.ts
 * Server-side only Bible database service using better-sqlite3 (synchronous).
 * NO "use client" — this file must never be imported from client components.
 *
 * Database file: <project-root>/data/bible.eng.db
 *
 * Supported schema formats (auto-detected on first use):
 *
 * 1. MULTI-TABLE ("Bible Databases" format) — PRIMARY
 *    Translation tables: t_kjv, t_asv, t_niv, t_esv, t_nkjv, t_amp, t_nrsv, t_web, …
 *    Columns: b INT, c INT, v INT, t TEXT
 *      ↑ if your DB uses different column names, change MULTI_COL_BOOK / MULTI_COL_CHAPTER /
 *        MULTI_COL_VERSE / MULTI_COL_TEXT below.
 *    Book-name table: key_english  columns: b INT, n TEXT
 *      ↑ if your DB uses a different book-name table/columns, change KEY_TABLE /
 *        KEY_COL_BOOK_NUM / KEY_COL_BOOK_NAME below.
 *    Optional version-key table: bible_version_key
 *
 * 2. UNIFIED ("verses" table) — FALLBACK
 *    Single table: verses
 *    Columns: translation TEXT, book_num INT, chapter INT, verse INT, text TEXT
 *      ↑ if your DB uses different column names, change UNIFIED_COL_* constants below.
 */

import path from "path";
import fs from "fs";

// ---------------------------------------------------------------------------
// Schema constant names — change these if your DB column/table names differ
// ---------------------------------------------------------------------------

// Multi-table schema: translation table column names
const MULTI_COL_BOOK = "b";       // INT  — book number (1–66)
const MULTI_COL_CHAPTER = "c";    // INT  — chapter number
const MULTI_COL_VERSE = "v";      // INT  — verse number
const MULTI_COL_TEXT = "t";       // TEXT — verse text

// Multi-table schema: book-name lookup table
const KEY_TABLE = "key_english";  // table name
const KEY_COL_BOOK_NUM = "b";     // INT  — book number
const KEY_COL_BOOK_NAME = "n";    // TEXT — book name

// Unified "verses" table schema column names
const UNIFIED_TABLE = "verses";
const UNIFIED_COL_TRANSLATION = "translation";
const UNIFIED_COL_BOOK = "book_num";
const UNIFIED_COL_CHAPTER = "chapter";
const UNIFIED_COL_VERSE = "verse";
const UNIFIED_COL_TEXT = "text";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TranslationInfo = {
  id: string;
  name: string;
  abbreviation: string;
  available: boolean;
};

export type VerseRow = {
  verse: number;
  text: string;
};

export type SearchResult = {
  bookNum: number;
  chapter: number;
  verse: number;
  text: string;
};

type SchemaKind = "multi" | "unified" | "none";

// ---------------------------------------------------------------------------
// Known translations: app translation ID → DB table name (multi-table schema)
// ---------------------------------------------------------------------------

const TRANSLATION_TABLE_MAP: Record<string, string> = {
  KJV:  "t_kjv",
  NKJV: "t_nkjv",
  ESV:  "t_esv",
  AMP:  "t_amp",
  NIV:  "t_niv",
  NRSV: "t_nrsv",
  ASV:  "t_asv",
  WEB:  "t_web",
};

const TRANSLATION_NAMES: Record<string, string> = {
  KJV:  "King James Version",
  NKJV: "New King James Version",
  ESV:  "English Standard Version",
  AMP:  "Amplified Bible",
  NIV:  "New International Version",
  NRSV: "New Revised Standard Version",
  ASV:  "American Standard Version",
  WEB:  "World English Bible",
};

// ---------------------------------------------------------------------------
// Book ID → book number (1–66) mapping
// ---------------------------------------------------------------------------

export const BOOK_ID_TO_NUM: Record<string, number> = {
  GEN: 1,  EXO: 2,  LEV: 3,  NUM: 4,  DEU: 5,
  JOS: 6,  JDG: 7,  RUT: 8,  "1SA": 9,  "2SA": 10,
  "1KI": 11, "2KI": 12, "1CH": 13, "2CH": 14, EZR: 15,
  NEH: 16, EST: 17, JOB: 18, PSA: 19, PRO: 20,
  ECC: 21, SNG: 22, ISA: 23, JER: 24, LAM: 25,
  EZK: 26, DAN: 27, HOS: 28, JOL: 29, AMO: 30,
  OBA: 31, JON: 32, MIC: 33, NAM: 34, HAB: 35,
  ZEP: 36, HAG: 37, ZEC: 38, MAL: 39,
  MAT: 40, MRK: 41, LUK: 42, JHN: 43, ACT: 44,
  ROM: 45, "1CO": 46, "2CO": 47, GAL: 48, EPH: 49,
  PHP: 50, COL: 51, "1TH": 52, "2TH": 53, "1TI": 54,
  "2TI": 55, TIT: 56, PHM: 57, HEB: 58, JAS: 59,
  "1PE": 60, "2PE": 61, "1JN": 62, "2JN": 63, "3JN": 64,
  JUD: 65, REV: 66,
};

// ---------------------------------------------------------------------------
// Internal module-level state (lazy init, cached)
// ---------------------------------------------------------------------------

const DB_PATH = path.join(process.cwd(), "data", "bible.eng.db");

// Using `any` so we don't need to import the Database type at module level;
// better-sqlite3 is required dynamically to avoid issues in edge runtimes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any | null = null;
let _dbMissing = false;           // true once we've confirmed the file doesn't exist
let _schemaKind: SchemaKind | null = null;
let _availableTables: Set<string> | null = null;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Open the database connection (once) and return the db instance.
 * Returns null if the DB file is absent.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDb(): any | null {
  if (_dbMissing) return null;
  if (_db) return _db;

  if (!fs.existsSync(DB_PATH)) {
    _dbMissing = true;
    return null;
  }

  // Require here so that this module can be imported in environments where
  // better-sqlite3 native bindings aren't available without crashing at import time.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");
  try {
    _db = new Database(DB_PATH, { readonly: true });
  } catch {
    // File exists but is not a valid SQLite database (e.g. placeholder, corrupt).
    _dbMissing = true;
    return null;
  }
  return _db;
}

/** Return the set of table names in the database. */
function getTableNames(): Set<string> {
  if (_availableTables) return _availableTables;

  const db = getDb();
  if (!db) {
    _availableTables = new Set();
    return _availableTables;
  }

  // SQLite master table lists all tables
  const rows = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all() as Array<{ name: string }>;

  _availableTables = new Set(rows.map((r) => r.name.toLowerCase()));
  return _availableTables;
}

/** Detect and cache which schema format the database uses. */
function detectSchema(): SchemaKind {
  if (_schemaKind !== null) return _schemaKind;

  const db = getDb();
  if (!db) {
    _schemaKind = "none";
    return "none";
  }

  const tables = getTableNames();

  // Check for at least one known multi-table translation table
  const hasMulti = Object.values(TRANSLATION_TABLE_MAP).some((t) =>
    tables.has(t.toLowerCase())
  );
  if (hasMulti) {
    _schemaKind = "multi";
    return "multi";
  }

  // Check for the unified "verses" table
  if (tables.has(UNIFIED_TABLE.toLowerCase())) {
    _schemaKind = "unified";
    return "unified";
  }

  _schemaKind = "none";
  return "none";
}

/**
 * Resolve a translation ID to the table name to query, considering which
 * tables are actually present in the DB.
 * Returns null if the translation isn't available.
 */
function resolveTable(translation: string): string | null {
  const schema = detectSchema();
  if (schema === "none") return null;

  const upper = translation.toUpperCase();

  if (schema === "multi") {
    const table = TRANSLATION_TABLE_MAP[upper];
    if (!table) return null;
    const tables = getTableNames();
    return tables.has(table.toLowerCase()) ? table : null;
  }

  // unified schema: translation is stored as a column value; just return
  // a sentinel so callers know it's "available" (we'll check the actual data)
  if (schema === "unified") {
    return UNIFIED_TABLE;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Return all known translations, marking each as available or not. */
export function getAvailableTranslations(): TranslationInfo[] {
  const schema = detectSchema();
  const tables = getTableNames();

  return Object.keys(TRANSLATION_TABLE_MAP).map((id) => {
    let available = false;

    if (schema === "multi") {
      const table = TRANSLATION_TABLE_MAP[id];
      available = tables.has(table.toLowerCase());
    } else if (schema === "unified") {
      // For the unified schema we report all known translations as potentially
      // available; callers can verify with isTranslationAvailable().
      available = true;
    }

    // Check bible_version_key for a richer display name if present
    let name = TRANSLATION_NAMES[id] ?? id;
    const abbreviation = id;

    if (schema === "multi" && tables.has("bible_version_key")) {
      try {
        const db = getDb();
        if (db) {
          // bible_version_key typically has: id, table, abbreviation, version, info_text, ...
          // Column names may vary — adjust if needed.
          const row = db
            .prepare(
              "SELECT * FROM bible_version_key WHERE [table] = ? LIMIT 1"
            )
            .get(TRANSLATION_TABLE_MAP[id]) as
            | Record<string, string>
            | undefined;

          if (row) {
            // Try common column names for the long version name
            const versionName =
              row["version"] ??
              row["name"] ??
              row["version_name"] ??
              undefined;
            if (versionName) name = versionName;
          }
        }
      } catch {
        // Ignore — version key table schema is optional
      }
    }

    return { id, name, abbreviation, available };
  });
}

/** Return true if the given translation ID is available in the database. */
export function isTranslationAvailable(translation: string): boolean {
  return resolveTable(translation) !== null;
}

/**
 * Fetch a single verse.
 * Returns the verse text string, or null if not found.
 */
export function getVerse(
  translation: string,
  bookNum: number,
  chapter: number,
  verse: number
): string | null {
  const db = getDb();
  if (!db) return null;

  const schema = detectSchema();

  if (schema === "multi") {
    const table = resolveTable(translation);
    if (!table) return null;

    // Column names: b=book, c=chapter, v=verse, t=text
    // Change MULTI_COL_* constants at the top of this file if your schema differs.
    const row = db
      .prepare(
        `SELECT ${MULTI_COL_TEXT} FROM ${table}
         WHERE ${MULTI_COL_BOOK} = ? AND ${MULTI_COL_CHAPTER} = ? AND ${MULTI_COL_VERSE} = ?
         LIMIT 1`
      )
      .get(bookNum, chapter, verse) as Record<string, string> | undefined;

    return row ? (row[MULTI_COL_TEXT] ?? null) : null;
  }

  if (schema === "unified") {
    // Column names: translation, book_num, chapter, verse, text
    // Change UNIFIED_COL_* constants at the top of this file if your schema differs.
    const row = db
      .prepare(
        `SELECT ${UNIFIED_COL_TEXT} FROM ${UNIFIED_TABLE}
         WHERE ${UNIFIED_COL_TRANSLATION} = ? AND ${UNIFIED_COL_BOOK} = ?
           AND ${UNIFIED_COL_CHAPTER} = ? AND ${UNIFIED_COL_VERSE} = ?
         LIMIT 1`
      )
      .get(translation.toUpperCase(), bookNum, chapter, verse) as
      | Record<string, string>
      | undefined;

    return row ? (row[UNIFIED_COL_TEXT] ?? null) : null;
  }

  return null;
}

/**
 * Fetch all verses for a chapter.
 * Returns an array of { verse, text } rows sorted by verse number.
 */
export function getChapter(
  translation: string,
  bookNum: number,
  chapter: number
): VerseRow[] {
  const db = getDb();
  if (!db) return [];

  const schema = detectSchema();

  if (schema === "multi") {
    const table = resolveTable(translation);
    if (!table) return [];

    // Column names: b=book, c=chapter, v=verse, t=text
    const rows = db
      .prepare(
        `SELECT ${MULTI_COL_VERSE} AS verse, ${MULTI_COL_TEXT} AS text
         FROM ${table}
         WHERE ${MULTI_COL_BOOK} = ? AND ${MULTI_COL_CHAPTER} = ?
         ORDER BY ${MULTI_COL_VERSE} ASC`
      )
      .all(bookNum, chapter) as VerseRow[];

    return rows;
  }

  if (schema === "unified") {
    const rows = db
      .prepare(
        `SELECT ${UNIFIED_COL_VERSE} AS verse, ${UNIFIED_COL_TEXT} AS text
         FROM ${UNIFIED_TABLE}
         WHERE ${UNIFIED_COL_TRANSLATION} = ? AND ${UNIFIED_COL_BOOK} = ?
           AND ${UNIFIED_COL_CHAPTER} = ?
         ORDER BY ${UNIFIED_COL_VERSE} ASC`
      )
      .all(translation.toUpperCase(), bookNum, chapter) as VerseRow[];

    return rows;
  }

  return [];
}

/**
 * Full-text search within a translation.
 * Uses SQLite LIKE for broad compatibility (no FTS5 required).
 * limit defaults to 20.
 */
export function searchVerses(
  translation: string,
  query: string,
  limit = 20
): SearchResult[] {
  const db = getDb();
  if (!db || !query.trim()) return [];

  const schema = detectSchema();
  const likePattern = `%${query.replace(/[%_]/g, (c) => `\\${c}`)}%`;

  if (schema === "multi") {
    const table = resolveTable(translation);
    if (!table) return [];

    // Column names: b=book, c=chapter, v=verse, t=text
    const rows = db
      .prepare(
        `SELECT ${MULTI_COL_BOOK} AS bookNum, ${MULTI_COL_CHAPTER} AS chapter,
                ${MULTI_COL_VERSE} AS verse, ${MULTI_COL_TEXT} AS text
         FROM ${table}
         WHERE ${MULTI_COL_TEXT} LIKE ? ESCAPE '\\'
         LIMIT ?`
      )
      .all(likePattern, limit) as SearchResult[];

    return rows;
  }

  if (schema === "unified") {
    const rows = db
      .prepare(
        `SELECT ${UNIFIED_COL_BOOK} AS bookNum, ${UNIFIED_COL_CHAPTER} AS chapter,
                ${UNIFIED_COL_VERSE} AS verse, ${UNIFIED_COL_TEXT} AS text
         FROM ${UNIFIED_TABLE}
         WHERE ${UNIFIED_COL_TRANSLATION} = ? AND ${UNIFIED_COL_TEXT} LIKE ? ESCAPE '\\'
         LIMIT ?`
      )
      .all(translation.toUpperCase(), likePattern, limit) as SearchResult[];

    return rows;
  }

  return [];
}
