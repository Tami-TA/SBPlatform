/**
 * Shared helpers for the scripture.api.bible HTTP API.
 */

export const SCRIPTURE_API_BASE = "https://api.scripture.api.bible/v1";

// Known fallback IDs so basic functionality works even if the bibles
// list call fails (e.g. wrong key, rate limit).
const KNOWN_IDS: Record<string, string> = {
  KJV: "de4e12af7f28f599-02",
};

type BibleListEntry = {
  id: string;
  abbreviation?: string;
  abbreviationLocal?: string;
  name?: string;
};

const idCache = new Map<string, string>(Object.entries(KNOWN_IDS));
let listFetched = false;

async function loadBibleList(apiKey: string): Promise<void> {
  if (listFetched) return;
  try {
    const res = await fetch(`${SCRIPTURE_API_BASE}/bibles?language=eng`, {
      headers: { "api-key": apiKey },
    });
    if (!res.ok) return;
    const data = await res.json() as { data?: BibleListEntry[] };
    for (const bible of data.data ?? []) {
      const ids = [
        bible.abbreviation?.toUpperCase(),
        bible.abbreviationLocal?.toUpperCase(),
      ].filter(Boolean) as string[];
      for (const abbr of ids) {
        if (!idCache.has(abbr)) idCache.set(abbr, bible.id);
        // Strip trailing digits so "NIV2011" also registers as "NIV"
        const base = abbr.replace(/\d+$/, "");
        if (base !== abbr && !idCache.has(base)) idCache.set(base, bible.id);
      }
    }
    listFetched = true;
  } catch {
    // leave cache as-is; KNOWN_IDS still covers KJV
  }
}

export async function resolveBibleId(
  translation: string,
  apiKey: string
): Promise<string | null> {
  const key = translation.toUpperCase();
  if (idCache.has(key)) return idCache.get(key)!;
  await loadBibleList(apiKey);
  if (idCache.has(key)) return idCache.get(key)!;
  // Prefix fallback: "NIV" matches "NIV11", "NIV2011", etc.
  for (const [abbr, id] of idCache) {
    if (abbr.startsWith(key)) return id;
  }
  return null;
}
