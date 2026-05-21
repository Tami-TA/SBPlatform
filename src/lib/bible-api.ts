import type { BibleChapter, BibleVerse, BibleTranslation } from "@/types";
import { BIBLE_BOOKS } from "@/lib/bible-data";

const LOCAL_API = "/api/bible/local";
const SEARCH_API = "/api/bible/search";
const TRANSLATIONS_API = "/api/bible/translations";

const BOOK_NAME: Record<string, string> = Object.fromEntries(
  BIBLE_BOOKS.map((b) => [b.id, b.name])
);

function bookName(id: string) {
  return BOOK_NAME[id] ?? id;
}

export async function fetchChapter(
  bookId: string,
  chapter: number,
  translation: BibleTranslation = "KJV"
): Promise<BibleChapter | null> {
  try {
    const url = `${LOCAL_API}?translation=${translation}&book=${bookId}&chapter=${chapter}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.available) {
      console.error("[fetchChapter] API error:", data.error);
      return null;
    }
    if (!data.verses?.length) return null;

    const verses: BibleVerse[] = data.verses.map((v: { verse: number; text: string }) => ({
      id: `${bookId}.${chapter}.${v.verse}`,
      bookId,
      bookName: bookName(bookId),
      chapter,
      verse: v.verse,
      text: v.text,
      translation,
    }));

    return { bookId, bookName: bookId, chapter, verses, translation };
  } catch {
    return null;
  }
}

export async function searchBible(
  query: string,
  translation: BibleTranslation = "KJV",
  limit = 20
): Promise<BibleVerse[]> {
  try {
    const url = `${SEARCH_API}?translation=${translation}&q=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const results = data.searchResults ?? [];
    if (!data.available || !results.length) return [];

    return results.map((r: { bookId: string; chapter: number; verse: number; text: string }) => ({
      id: `${r.bookId}.${r.chapter}.${r.verse}`,
      bookId: r.bookId,
      bookName: bookName(r.bookId),
      chapter: r.chapter,
      verse: r.verse,
      text: r.text,
      translation,
    })) as BibleVerse[];
  } catch {
    return [];
  }
}

export async function fetchVerse(
  verseId: string,
  translation: BibleTranslation = "KJV"
): Promise<BibleVerse | null> {
  try {
    const parts = verseId.split(".");
    const [bookId, chapterStr, verseStr] = parts;
    const url = `${LOCAL_API}?translation=${translation}&book=${bookId}&chapter=${chapterStr}&verse=${verseStr}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.available || !data.verses?.length) return null;

    return {
      id: verseId,
      bookId,
      bookName: bookName(bookId),
      chapter: parseInt(chapterStr),
      verse: parseInt(verseStr),
      text: data.verses[0].text,
      translation,
    };
  } catch {
    return null;
  }
}

export async function getAvailableTranslations(): Promise<Array<{ id: string; name: string; available: boolean }>> {
  try {
    const res = await fetch(TRANSLATIONS_API, { cache: "force-cache" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.translations || [];
  } catch {
    return [];
  }
}
