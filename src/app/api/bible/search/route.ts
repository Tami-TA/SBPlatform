/**
 * GET /api/bible/search
 *
 * Full-text verse search backed by Cloudflare D1 (bible-eng database).
 * Supports multi-word queries using AND-logic LIKE matching.
 *
 * Query params:
 *   q           — search phrase (required, min 2 chars)
 *   translation — e.g. "KJV" (default)
 *   limit       — max results, capped at 50 (default 20)
 */

import type { NextRequest } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

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
  const words = query.split(/\s+/).filter((w) => w.length >= 2);
  if (words.length === 0) {
    return Response.json({ available: true, translation, searchResults: [] });
  }

  try {
    const { env } = getRequestContext<CloudflareEnv>();
    const db = env.BIBLE_DB;

    const conditions = words.map(() => "text LIKE ?").join(" AND ");
    const sql = `SELECT bookId, chapterNumber, number, text
                 FROM ChapterVerse
                 WHERE translationId = ? AND ${conditions}
                 LIMIT ?`;
    const params: (string | number)[] = [dbTranslation, ...words.map((w) => `%${w}%`), limit];

    const result = await db.prepare(sql).bind(...params).all<VerseRow>();

    const searchResults = result.results.map((r) => ({
      bookId:  r.bookId,
      chapter: r.chapterNumber,
      verse:   r.number,
      text:    r.text.replace(/^¶\s*/, ""),
    }));

    return Response.json({ available: true, translation, searchResults });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[bible/search] D1 error:", msg);
    return Response.json({ available: false, error: msg, searchResults: [] }, { status: 500 });
  }
}
