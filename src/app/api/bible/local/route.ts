/**
 * GET /api/bible/local
 *
 * Proxies to bible-api.com (free, no key required).
 * Keeps the same response shape so the frontend needs no changes.
 *
 * Query params:
 *   translation — e.g. "KJV"
 *   book        — 3-letter book ID, e.g. "GEN"
 *   chapter     — chapter number
 *   verse       — verse number (optional)
 *   q           — free-text search query (optional)
 */

import type { NextRequest } from "next/server";

// Map app translation IDs → bible-api.com translation slugs
const TRANSLATION_MAP: Record<string, string> = {
  KJV: "kjv",
  ASV: "asv",
  WEB: "web",
  YLT: "ylt",
  BBE: "bbe",
  DBY: "darby",
  BSB: "kjv", // not available — fallback
  NET: "kjv", // not available — fallback
};

// Map 3-letter book IDs → bible-api.com URL slugs
const BOOK_SLUG: Record<string, string> = {
  GEN: "genesis",         EXO: "exodus",          LEV: "leviticus",
  NUM: "numbers",         DEU: "deuteronomy",      JOS: "joshua",
  JDG: "judges",          RUT: "ruth",             "1SA": "1+samuel",
  "2SA": "2+samuel",      "1KI": "1+kings",        "2KI": "2+kings",
  "1CH": "1+chronicles",  "2CH": "2+chronicles",   EZR: "ezra",
  NEH: "nehemiah",        EST: "esther",            JOB: "job",
  PSA: "psalms",          PRO: "proverbs",          ECC: "ecclesiastes",
  SNG: "song+of+solomon", ISA: "isaiah",            JER: "jeremiah",
  LAM: "lamentations",    EZK: "ezekiel",           DAN: "daniel",
  HOS: "hosea",           JOL: "joel",              AMO: "amos",
  OBA: "obadiah",         JON: "jonah",             MIC: "micah",
  NAM: "nahum",           HAB: "habakkuk",          ZEP: "zephaniah",
  HAG: "haggai",          ZEC: "zechariah",         MAL: "malachi",
  MAT: "matthew",         MRK: "mark",              LUK: "luke",
  JHN: "john",            ACT: "acts",              ROM: "romans",
  "1CO": "1+corinthians", "2CO": "2+corinthians",   GAL: "galatians",
  EPH: "ephesians",       PHP: "philippians",        COL: "colossians",
  "1TH": "1+thessalonians", "2TH": "2+thessalonians",
  "1TI": "1+timothy",     "2TI": "2+timothy",       TIT: "titus",
  PHM: "philemon",        HEB: "hebrews",            JAS: "james",
  "1PE": "1+peter",       "2PE": "2+peter",          "1JN": "1+john",
  "2JN": "2+john",        "3JN": "3+john",           JUD: "jude",
  REV: "revelation",
};

type ApiVerse = { book_id: string; chapter: number; verse: number; text: string };

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const translation  = (searchParams.get("translation") ?? "KJV").toUpperCase();
  const bookId       = (searchParams.get("book") ?? "").toUpperCase();
  const chapterParam = searchParams.get("chapter");
  const verseParam   = searchParams.get("verse");
  const query        = searchParams.get("q");

  const apiTranslation = TRANSLATION_MAP[translation] ?? "kjv";

  // Search mode
  if (query) {
    try {
      const url = `https://bible-api.com/${encodeURIComponent(query)}?translation=${apiTranslation}`;
      const res = await fetch(url, {
        next: { revalidate: 3600 },
        headers: { "User-Agent": "BibleStudyApp/1.0 (+https://github.com)" },
      });
      if (!res.ok) return Response.json({ available: true, translation, searchResults: [] });
      const data = await res.json();
      const verses: ApiVerse[] = data.verses ?? [];
      return Response.json({
        available: true,
        translation,
        searchResults: verses.map((v) => ({
          bookId: v.book_id,
          chapter: v.chapter,
          verse: v.verse,
          text: v.text.trim(),
        })),
      });
    } catch {
      return Response.json({ available: true, translation, searchResults: [] });
    }
  }

  if (!bookId || !chapterParam) {
    return Response.json({ available: false, error: "Missing book or chapter" }, { status: 400 });
  }

  const chapter = parseInt(chapterParam, 10);
  if (isNaN(chapter) || chapter < 1) {
    return Response.json({ available: false, error: "Invalid chapter" }, { status: 400 });
  }

  const slug = BOOK_SLUG[bookId];
  if (!slug) {
    return Response.json({ available: false, error: `Unknown book ID: ${bookId}` });
  }

  try {
    const url = `https://bible-api.com/${slug}+${chapter}?translation=${apiTranslation}`;
    const res = await fetch(url, {
      next: { revalidate: 86400 }, // cache 24h on Vercel
      headers: { "User-Agent": "BibleStudyApp/1.0 (+https://github.com)" },
    });

    if (!res.ok) {
      console.error(`[bible/local] bible-api.com error ${res.status} for ${bookId} ${chapter} (${translation})`);
      return Response.json({ available: false, error: `Bible API returned ${res.status}` });
    }

    const data = await res.json();

    if (data.error) {
      console.error(`[bible/local] API error:`, data.error);
      return Response.json({ available: false, error: data.error });
    }

    const verses: ApiVerse[] = data.verses ?? [];

    // Single verse mode
    if (verseParam !== null) {
      const verseNum = parseInt(verseParam, 10);
      const match = verses.filter((v) => v.verse === verseNum);
      return Response.json({
        available: true,
        translation,
        book: bookId,
        chapter,
        verses: match.map((v) => ({ verse: v.verse, text: v.text.trim() })),
      });
    }

    return Response.json({
      available: true,
      translation,
      book: bookId,
      chapter,
      verses: verses.map((v) => ({ verse: v.verse, text: v.text.trim() })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[bible/local] Fetch failed:", msg);
    return Response.json({ available: false, error: msg });
  }
}
