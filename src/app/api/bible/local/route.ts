/**
 * GET /api/bible/local
 *
 * Serve Bible text from the local SQLite database.
 * SERVER-SIDE ONLY — no "use client".
 *
 * Query parameters:
 *   translation  — translation ID, e.g. "KJV"          (required)
 *   book         — 3-letter book ID, e.g. "GEN"        (required)
 *   chapter      — chapter number                       (required)
 *   verse        — verse number (optional; omit for full chapter)
 *   q            — free-text search query (optional)
 *
 * Response (translation available):
 *   { verses: [{ verse, text }], translation, book, chapter, available: true }
 *
 * Response (translation not available / DB missing):
 *   { available: false, error: "Translation not available" }   HTTP 200
 */

import type { NextRequest } from "next/server";
import {
  getChapter,
  getVerse,
  searchVerses,
  isTranslationAvailable,
  BOOK_ID_TO_NUM,
} from "@/lib/bible-db.server";

export const runtime = "nodejs"; // required — better-sqlite3 is a Node.js native module

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const translation = (searchParams.get("translation") ?? "KJV").toUpperCase();
  const bookId = (searchParams.get("book") ?? "").toUpperCase();
  const chapterParam = searchParams.get("chapter");
  const verseParam = searchParams.get("verse");
  const query = searchParams.get("q");

  // --- Validate translation availability ---
  if (!isTranslationAvailable(translation)) {
    return Response.json(
      { available: false, error: "Translation not available" },
      { status: 200 }
    );
  }

  // --- Search mode ---
  if (query) {
    const results = searchVerses(translation, query);
    return Response.json({
      verses: results.map((r) => ({ verse: r.verse, text: r.text })),
      translation,
      book: bookId || null,
      chapter: chapterParam ? parseInt(chapterParam, 10) : null,
      available: true,
      searchResults: results,
    });
  }

  // --- Chapter / verse fetch mode ---
  if (!bookId || !chapterParam) {
    return Response.json(
      { available: false, error: "Missing required params: book and chapter" },
      { status: 400 }
    );
  }

  const bookNum = BOOK_ID_TO_NUM[bookId];
  if (!bookNum) {
    return Response.json(
      { available: false, error: `Unknown book ID: ${bookId}` },
      { status: 400 }
    );
  }

  const chapter = parseInt(chapterParam, 10);
  if (isNaN(chapter) || chapter < 1) {
    return Response.json(
      { available: false, error: "Invalid chapter number" },
      { status: 400 }
    );
  }

  // Single verse
  if (verseParam !== null) {
    const verseNum = parseInt(verseParam, 10);
    if (isNaN(verseNum) || verseNum < 1) {
      return Response.json(
        { available: false, error: "Invalid verse number" },
        { status: 400 }
      );
    }

    const text = getVerse(translation, bookNum, chapter, verseNum);
    const verses = text !== null ? [{ verse: verseNum, text }] : [];

    return Response.json({
      verses,
      translation,
      book: bookId,
      chapter,
      available: true,
    });
  }

  // Full chapter
  const verses = getChapter(translation, bookNum, chapter);
  return Response.json({
    verses,
    translation,
    book: bookId,
    chapter,
    available: true,
  });
}
