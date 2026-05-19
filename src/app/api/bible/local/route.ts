/**
 * GET /api/bible/local
 *
 * Loads chapters / verses via scripture.api.bible.
 * (Kept the route name for backwards compatibility with existing fetch calls.)
 *
 * Query params:
 *   translation — e.g. "KJV" | "NIV" | "AMP"
 *   book        — 3-letter OSIS book ID, e.g. "GEN"
 *   chapter     — chapter number
 *   verse       — verse number (optional)
 */

import type { NextRequest } from "next/server";
import { SCRIPTURE_API_BASE, resolveBibleId } from "@/lib/scripture-api";

export const runtime = "edge";

type ChapterContent = {
  data?: {
    id: string;
    content: string;
  };
};

function parseVerses(content: string): { verse: number; text: string }[] {
  const verses: { verse: number; text: string }[] = [];
  // scripture.api.bible text format with include-verse-numbers=true wraps
  // verse numbers in square brackets, e.g. "[1] In the beginning... [2] ..."
  const regex = /\[(\d+)\]\s*([^[]+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const verse = parseInt(match[1], 10);
    const text = match[2].replace(/\s+/g, " ").trim();
    if (text) verses.push({ verse, text });
  }
  return verses;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const translation  = (searchParams.get("translation") ?? "KJV").toUpperCase();
  const bookId       = (searchParams.get("book") ?? "").toUpperCase();
  const chapterParam = searchParams.get("chapter");
  const verseParam   = searchParams.get("verse");

  if (!bookId || !chapterParam) {
    return Response.json({ available: false, error: "Missing book or chapter" }, { status: 400 });
  }

  const chapter = parseInt(chapterParam, 10);
  if (isNaN(chapter) || chapter < 1) {
    return Response.json({ available: false, error: "Invalid chapter" }, { status: 400 });
  }

  const apiKey = process.env.BIBLE_API_KEY ?? "";
  if (!apiKey) {
    return Response.json({ available: false, error: "Bible API key not configured" }, { status: 503 });
  }

  const bibleId = await resolveBibleId(translation, apiKey);
  if (!bibleId) {
    return Response.json({ available: false, error: `Unknown translation: ${translation}` }, { status: 404 });
  }

  const chapterId = `${bookId}.${chapter}`;
  const url = `${SCRIPTURE_API_BASE}/bibles/${bibleId}/chapters/${chapterId}` +
    `?content-type=text&include-verse-numbers=true&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-spans=false`;

  try {
    const res = await fetch(url, { headers: { "api-key": apiKey } });
    if (!res.ok) {
      return Response.json({ available: false, error: `Bible API returned ${res.status}` });
    }

    const data = await res.json() as ChapterContent;
    const content = data.data?.content ?? "";
    const allVerses = parseVerses(content);

    if (verseParam !== null) {
      const verseNum = parseInt(verseParam, 10);
      const match = allVerses.filter((v) => v.verse === verseNum);
      return Response.json({
        available: true,
        translation,
        book: bookId,
        chapter,
        verses: match,
      });
    }

    return Response.json({
      available: true,
      translation,
      book: bookId,
      chapter,
      verses: allVerses,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[bible/local] Fetch failed:", msg);
    return Response.json({ available: false, error: msg });
  }
}
