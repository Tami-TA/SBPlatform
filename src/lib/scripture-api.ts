/**
 * Shared helpers for the scripture.api.bible HTTP API.
 *
 * Provides dynamic abbreviation -> Bible ID resolution (cached per isolate)
 * so we don't have to hardcode UUIDs for translations the account has access to.
 */

export const SCRIPTURE_API_BASE = "https://api.scripture.api.bible/v1";

type BibleListEntry = {
  id: string;
  abbreviation?: string;
  abbreviationLocal?: string;
  nameLocal?: string;
};

const idCache = new Map<string, string>();
let listFetched = false;

async function loadBibleList(apiKey: string): Promise<void> {
  if (listFetched) return;
  const res = await fetch(`${SCRIPTURE_API_BASE}/bibles?language=eng`, {
    headers: { "api-key": apiKey },
  });
  if (!res.ok) return;
  const data = await res.json() as { data?: BibleListEntry[] };
  for (const bible of data.data ?? []) {
    const abbr = bible.abbreviation?.toUpperCase();
    if (abbr && !idCache.has(abbr)) idCache.set(abbr, bible.id);
    const local = bible.abbreviationLocal?.toUpperCase();
    if (local && !idCache.has(local)) idCache.set(local, bible.id);
  }
  listFetched = true;
}

export async function resolveBibleId(
  translation: string,
  apiKey: string
): Promise<string | null> {
  const key = translation.toUpperCase();
  if (idCache.has(key)) return idCache.get(key)!;
  await loadBibleList(apiKey);
  return idCache.get(key) ?? null;
}
