/**
 * GET /api/bible/local
 *
 * Loads chapters / verses via scripture.api.bible.
 *
 * Query params:
 *   translation — "KJV" | "NIV" | "AMP"
 *   book        — 3-letter OSIS book ID, e.g. "GEN"
 *   chapter     — chapter number
 *   verse       — verse number (optional, returns single verse)
 */

import type { NextRequest } from "next/server";
import { SCRIPTURE_API_BASE, resolveBibleId } from "@/lib/scripture-api";

export const runtime = "edge";

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function parseVerses(content: string): { verse: number; text: string }[] {
  const clean = (s: string) =>
    decodeEntities(s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());

  // Strategy 1 — HTML with data-number spans (scripture.api.bible default)
  if (content.includes('data-number="')) {
    const verses: { verse: number; text: string }[] = [];
    // Split on every verse span so we get one chunk per verse
    const chunks = content.split(/(?=<span[^>]*data-number=")/);
    for (const chunk of chunks) {
      const m = chunk.match(/data-number="(\d+)"/);
      if (!m) continue;
      const n = parseInt(m[1], 10);
      // Remove the verse-number span itself, then strip remaining tags
      const body = chunk.replace(/<span[^>]*data-number="\d+"[^>]*>[\s\S]*?<\/span>/, "");
      const text = clean(body);
      if (text && n > 0) verses.push({ verse: n, text });
    }
    if (verses.length > 0) return verses;
  }

  // Strategy 2 — [N] bracket format (text content-type)
  if (content.includes("[1]") || content.includes("[2]")) {
    const verses: { verse: number; text: string }[] = [];
    const re = /\[(\d+)\]\s*([^[]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      const text = clean(m[2]);
      if (text) verses.push({ verse: parseInt(m[1], 10), text });
    }
    if (verses.length > 0) return verses;
  }

  // Strategy 3 — bare leading numbers "1 text 2 text" (some text modes)
  {
    const verses: { verse: number; text: string }[] = [];
    const re = /(?:^|\n)\s*(\d{1,3})\s+([^\n\d][^\n]*)/gm;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      const text = clean(m[2]);
      if (text) verses.push({ verse: parseInt(m[1], 10), text });
    }
    if (verses.length > 0) return verses;
  }

  return [];
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
    return Response.json({ available: false, error: `Translation not available: ${translation}` }, { status: 404 });
  }

  const chapterId = `${bookId}.${chapter}`;
  // Request HTML (default) — more structured than text for verse extraction
  const url =
    `${SCRIPTURE_API_BASE}/bibles/${bibleId}/chapters/${chapterId}` +
    `?content-type=html&include-verse-numbers=true&include-notes=false` +
    `&include-titles=false&include-chapter-numbers=false&include-verse-spans=false`;

  try {
    const res = await fetch(url, { headers: { "api-key": apiKey } });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`[bible/local] ${res.status} for ${chapterId} (${translation}):`, errText);
      return Response.json({ available: false, error: `Bible API returned ${res.status}` });
    }

    const data = await res.json() as { data?: { content?: string } };
    const content = data.data?.content ?? "";
    if (!content) {
      return Response.json({ available: false, error: `Empty content from Bible API for ${chapterId} (${translation})` });
    }
    const allVerses = parseVerses(content);
    if (!allVerses.length) {
      return Response.json({ available: false, error: `Could not parse verses from Bible API response for ${chapterId} (${translation}). Content preview: ${content.slice(0, 120)}` });
    }

    if (verseParam !== null) {
      const verseNum = parseInt(verseParam, 10);
      return Response.json({
        available: true,
        translation,
        book: bookId,
        chapter,
        verses: allVerses.filter((v) => v.verse === verseNum),
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
