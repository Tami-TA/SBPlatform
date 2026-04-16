import type { BibleChapter, BibleVerse, BibleTranslation } from "@/types";
import { TRANSLATIONS } from "./bible-data";

const API_BASE = "https://api.scripture.api.bible/v1";
const API_KEY = process.env.NEXT_PUBLIC_BIBLE_API_KEY || "";

function getApiId(translation: BibleTranslation): string {
  const t = TRANSLATIONS.find((t) => t.id === translation);
  return t?.apiId || "de4e12af7f28f599-02"; // default KJV
}

function cleanVerseText(text: string): string {
  return text
    .replace(/¶\s*/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchChapter(
  bookId: string,
  chapter: number,
  translation: BibleTranslation = "KJV"
): Promise<BibleChapter | null> {
  try {
    const bibleId = getApiId(translation);
    const chapterId = `${bookId}.${chapter}`;
    const url = `${API_BASE}/bibles/${bibleId}/chapters/${chapterId}?content-type=json&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`;

    const res = await fetch(url, {
      headers: { "api-key": API_KEY },
      next: { revalidate: 86400 },
    });

    if (!res.ok) throw new Error(`Bible API error: ${res.status}`);

    const data = await res.json();
    const content = data.data?.content || "";

    // Parse verses from JSON content
    const verses: BibleVerse[] = [];

    if (data.data?.content) {
      const paragraphs = data.data.content;
      if (Array.isArray(paragraphs)) {
        for (const para of paragraphs) {
          if (para.items) {
            for (const item of para.items) {
              if (item.items) {
                for (const verseItem of item.items) {
                  if (verseItem.type === "verse" && verseItem.items) {
                    const verseNum = parseInt(item.number || verseItem.number || "0");
                    const text = verseItem.items
                      .map((t: { text?: string }) => t.text || "")
                      .join("")
                      .trim();
                    if (text && verseNum) {
                      verses.push({
                        id: `${bookId}.${chapter}.${verseNum}`,
                        bookId,
                        bookName: bookId,
                        chapter,
                        verse: verseNum,
                        text: cleanVerseText(text),
                        translation,
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Fallback: fetch individual verses if parsing failed
    if (verses.length === 0) {
      return await fetchChapterVerseByVerse(bookId, chapter, translation);
    }

    return {
      bookId,
      bookName: bookId,
      chapter,
      verses: verses.sort((a, b) => a.verse - b.verse),
      translation,
    };
  } catch {
    return await fetchChapterVerseByVerse(bookId, chapter, translation);
  }
}

async function fetchChapterVerseByVerse(
  bookId: string,
  chapter: number,
  translation: BibleTranslation
): Promise<BibleChapter | null> {
  try {
    const bibleId = getApiId(translation);
    const url = `${API_BASE}/bibles/${bibleId}/chapters/${bookId}.${chapter}/verses`;

    const res = await fetch(url, {
      headers: { "api-key": API_KEY },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const verseMetas = data.data || [];

    const versePromises = verseMetas.slice(0, 50).map(async (v: { id: string; number?: string }) => {
      const verseRes = await fetch(
        `${API_BASE}/bibles/${bibleId}/verses/${v.id}?content-type=text&include-verse-numbers=false`,
        { headers: { "api-key": API_KEY }, next: { revalidate: 86400 } }
      );
      if (!verseRes.ok) return null;
      const verseData = await verseRes.json();
      const verseNum = parseInt(v.id.split(".")[2] || "0");
      return {
        id: v.id,
        bookId,
        bookName: bookId,
        chapter,
        verse: verseNum,
        text: cleanVerseText(verseData.data?.content || ""),
        translation,
      } as BibleVerse;
    });

    const verses = (await Promise.all(versePromises)).filter(Boolean) as BibleVerse[];

    return {
      bookId,
      bookName: bookId,
      chapter,
      verses: verses.sort((a, b) => a.verse - b.verse),
      translation,
    };
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
    const bibleId = getApiId(translation);
    const url = `${API_BASE}/bibles/${bibleId}/search?query=${encodeURIComponent(query)}&limit=${limit}&sort=relevance`;

    const res = await fetch(url, {
      headers: { "api-key": API_KEY },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`Search error: ${res.status}`);

    const data = await res.json();
    const verses = data.data?.verses || [];

    return verses.map((v: { id: string; bookId?: string; chapterNumber?: string; verseNumber?: string; text?: string; bibleId?: string }) => ({
      id: v.id,
      bookId: v.bookId || v.id.split(".")[0],
      bookName: v.bookId || v.id.split(".")[0],
      chapter: parseInt(v.chapterNumber || v.id.split(".")[1] || "0"),
      verse: parseInt(v.verseNumber || v.id.split(".")[2] || "0"),
      text: cleanVerseText(v.text || ""),
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
    const bibleId = getApiId(translation);
    const url = `${API_BASE}/bibles/${bibleId}/verses/${verseId}?content-type=text&include-verse-numbers=false`;

    const res = await fetch(url, {
      headers: { "api-key": API_KEY },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const parts = verseId.split(".");

    return {
      id: verseId,
      bookId: parts[0],
      bookName: parts[0],
      chapter: parseInt(parts[1] || "0"),
      verse: parseInt(parts[2] || "0"),
      text: cleanVerseText(data.data?.content || ""),
      translation,
    };
  } catch {
    return null;
  }
}
