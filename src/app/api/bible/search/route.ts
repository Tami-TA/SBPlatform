/**
 * GET /api/bible/search
 *
 * Full-text verse search backed by the local SQLite bible.eng.db.
 * Supports multi-word queries using AND-logic LIKE matching.
 *
 * Query params:
 *   q           — search phrase (required, min 2 chars)
 *   translation — e.g. "KJV" (default)
 *   limit       — max results, capped at 50 (default 20)
 */

import type { NextRequest } from "next/server";
import Database from "better-sqlite3";
import path from "path";

const DB_TRANSLATION_MAP: Record<string, string> = {
  KJV:   "eng_kjv",
  ASV:   "eng_asv",
  WEB:   "ENGWEBP",
  WEBBE: "eng_webpb",
  YLT:   "eng_ylt",
  BBE:   "eng_bbe",
  DBY:   "eng_dby",
  BSB:   "BSB",
};

const DB_PATH = path.join(process.cwd(), "data", "bible.eng.db");

type VerseRow = { bookId: string; chapterNumber: number; number: number; text: string };

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const query       = searchParams.get("q")?.trim() ?? "";
  const translation = (searchParams.get("translation") ?? "KJV").toUpperCase();
  const limit       = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 50);

  if (query.length < 2) {
    return Response.json({ available: true, translation, searchResults: [] });
  }

  const dbTranslation = DB_TRANSLATION_MAP[translation] ?? DB_TRANSLATION_MAP.KJV;

  let db: InstanceType<typeof Database> | null = null;
  try {
    db = new Database(DB_PATH, { readonly: true });

    // Each word must appear somewhere in the verse text (AND logic)
    const words = query.split(/\s+/).filter((w) => w.length >= 2);
    if (words.length === 0) {
      return Response.json({ available: true, translation, searchResults: [] });
    }

    const conditions = words.map(() => "text LIKE ?").join(" AND ");
    const params: unknown[] = [dbTranslation, ...words.map((w) => `%${w}%`), limit];

    const rows = db
      .prepare(
        `SELECT bookId, chapterNumber, number, text
         FROM ChapterVerse
         WHERE translationId = ? AND ${conditions}
         LIMIT ?`
      )
      .all(...params) as VerseRow[];

    const results = rows.map((r) => ({
      bookId:  r.bookId,
      chapter: r.chapterNumber,
      verse:   r.number,
      // Strip the KJV pilcrow paragraph marker if present
      text: r.text.replace(/^¶\s*/, ""),
    }));

    return Response.json({ available: true, translation, searchResults: results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[bible/search] Error:", msg);
    return Response.json({ available: false, error: msg, searchResults: [] }, { status: 500 });
  } finally {
    db?.close();
  }
}
