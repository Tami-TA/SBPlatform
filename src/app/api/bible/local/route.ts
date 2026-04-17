/**
 * GET /api/bible/local
 *
 * Query params:
 *   translation — e.g. "KJV"
 *   book        — 3-letter book ID, e.g. "GEN"
 *   chapter     — chapter number
 *   verse       — verse number (optional)
 *   q           — free-text search query (optional)
 */

import type { NextRequest } from "next/server";
import { getChapter, getVerse, searchVerses, isTranslationAvailable } from "@/lib/bible-db.server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const translation = (searchParams.get("translation") ?? "KJV").toUpperCase();
  const bookId      = (searchParams.get("book") ?? "").toUpperCase();
  const chapterParam = searchParams.get("chapter");
  const verseParam   = searchParams.get("verse");
  const query        = searchParams.get("q");

  if (!isTranslationAvailable(translation)) {
    return Response.json({ available: false, error: "Translation not available" });
  }

  // Search mode
  if (query) {
    const results = searchVerses(translation, query);
    return Response.json({ available: true, translation, searchResults: results });
  }

  if (!bookId || !chapterParam) {
    return Response.json({ available: false, error: "Missing book or chapter" }, { status: 400 });
  }

  const chapter = parseInt(chapterParam, 10);
  if (isNaN(chapter) || chapter < 1) {
    return Response.json({ available: false, error: "Invalid chapter" }, { status: 400 });
  }

  // Single verse
  if (verseParam !== null) {
    const verseNum = parseInt(verseParam, 10);
    const text = getVerse(translation, bookId, chapter, verseNum);
    return Response.json({
      available: true,
      translation,
      book: bookId,
      chapter,
      verses: text !== null ? [{ verse: verseNum, text }] : [],
    });
  }

  // Full chapter
  const verses = getChapter(translation, bookId, chapter);
  return Response.json({ available: true, translation, book: bookId, chapter, verses });
}
