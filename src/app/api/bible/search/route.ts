/**
 * GET /api/bible/search
 *
 * Full-text verse search via scripture.api.bible.
 *
 * Query params:
 *   q           — search phrase (required, min 2 chars)
 *   translation — e.g. "KJV", "NIV", "AMP" (default KJV)
 *   limit       — max results, capped at 50 (default 20)
 */

import type { NextRequest } from "next/server";
import { SCRIPTURE_API_BASE, resolveBibleId } from "@/lib/scripture-api";

export const runtime = "edge";

type ApiVerse = {
  id: string;
  bookId: string;
  text: string;
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const query       = searchParams.get("q")?.trim() ?? "";
  const translation = (searchParams.get("translation") ?? "KJV").toUpperCase();
  const limit       = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 50);

  if (query.length < 2) {
    return Response.json({ available: true, translation, searchResults: [] });
  }

  const apiKey = process.env.BIBLE_API_KEY ?? "";
  if (!apiKey) {
    return Response.json({ available: false, error: "Bible API key not configured", searchResults: [] }, { status: 503 });
  }

  const bibleId = await resolveBibleId(translation, apiKey);
  if (!bibleId) {
    return Response.json({ available: false, error: `Unknown translation: ${translation}`, searchResults: [] }, { status: 404 });
  }

  try {
    const url = `${SCRIPTURE_API_BASE}/bibles/${bibleId}/search?query=${encodeURIComponent(query)}&limit=${limit}&sort=relevance`;
    const res = await fetch(url, { headers: { "api-key": apiKey } });

    if (!res.ok) {
      return Response.json({ available: false, error: `Bible API returned ${res.status}`, searchResults: [] }, { status: 502 });
    }

    const data = await res.json() as { data?: { verses?: ApiVerse[] } };
    const verses = data.data?.verses ?? [];

    const searchResults = verses.map((v) => {
      const parts = v.id.split(".");
      const chapter = parseInt(parts[1] ?? "1", 10);
      const verse   = parseInt(parts[2] ?? "1", 10);
      const text    = v.text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      return { bookId: v.bookId, chapter, verse, text };
    });

    return Response.json({ available: true, translation, searchResults });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[bible/search] API error:", msg);
    return Response.json({ available: false, error: msg, searchResults: [] }, { status: 500 });
  }
}
