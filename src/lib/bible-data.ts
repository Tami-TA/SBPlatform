import type { BibleBook, BibleTranslation } from "@/types";

export const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament
  { id: "GEN", name: "Genesis", abbreviation: "Gen", chapters: 50, testament: "OT", order: 1 },
  { id: "EXO", name: "Exodus", abbreviation: "Exo", chapters: 40, testament: "OT", order: 2 },
  { id: "LEV", name: "Leviticus", abbreviation: "Lev", chapters: 27, testament: "OT", order: 3 },
  { id: "NUM", name: "Numbers", abbreviation: "Num", chapters: 36, testament: "OT", order: 4 },
  { id: "DEU", name: "Deuteronomy", abbreviation: "Deu", chapters: 34, testament: "OT", order: 5 },
  { id: "JOS", name: "Joshua", abbreviation: "Jos", chapters: 24, testament: "OT", order: 6 },
  { id: "JDG", name: "Judges", abbreviation: "Jdg", chapters: 21, testament: "OT", order: 7 },
  { id: "RUT", name: "Ruth", abbreviation: "Rut", chapters: 4, testament: "OT", order: 8 },
  { id: "1SA", name: "1 Samuel", abbreviation: "1Sa", chapters: 31, testament: "OT", order: 9 },
  { id: "2SA", name: "2 Samuel", abbreviation: "2Sa", chapters: 24, testament: "OT", order: 10 },
  { id: "1KI", name: "1 Kings", abbreviation: "1Ki", chapters: 22, testament: "OT", order: 11 },
  { id: "2KI", name: "2 Kings", abbreviation: "2Ki", chapters: 25, testament: "OT", order: 12 },
  { id: "1CH", name: "1 Chronicles", abbreviation: "1Ch", chapters: 29, testament: "OT", order: 13 },
  { id: "2CH", name: "2 Chronicles", abbreviation: "2Ch", chapters: 36, testament: "OT", order: 14 },
  { id: "EZR", name: "Ezra", abbreviation: "Ezr", chapters: 10, testament: "OT", order: 15 },
  { id: "NEH", name: "Nehemiah", abbreviation: "Neh", chapters: 13, testament: "OT", order: 16 },
  { id: "EST", name: "Esther", abbreviation: "Est", chapters: 10, testament: "OT", order: 17 },
  { id: "JOB", name: "Job", abbreviation: "Job", chapters: 42, testament: "OT", order: 18 },
  { id: "PSA", name: "Psalms", abbreviation: "Psa", chapters: 150, testament: "OT", order: 19 },
  { id: "PRO", name: "Proverbs", abbreviation: "Pro", chapters: 31, testament: "OT", order: 20 },
  { id: "ECC", name: "Ecclesiastes", abbreviation: "Ecc", chapters: 12, testament: "OT", order: 21 },
  { id: "SNG", name: "Song of Solomon", abbreviation: "Sng", chapters: 8, testament: "OT", order: 22 },
  { id: "ISA", name: "Isaiah", abbreviation: "Isa", chapters: 66, testament: "OT", order: 23 },
  { id: "JER", name: "Jeremiah", abbreviation: "Jer", chapters: 52, testament: "OT", order: 24 },
  { id: "LAM", name: "Lamentations", abbreviation: "Lam", chapters: 5, testament: "OT", order: 25 },
  { id: "EZK", name: "Ezekiel", abbreviation: "Ezk", chapters: 48, testament: "OT", order: 26 },
  { id: "DAN", name: "Daniel", abbreviation: "Dan", chapters: 12, testament: "OT", order: 27 },
  { id: "HOS", name: "Hosea", abbreviation: "Hos", chapters: 14, testament: "OT", order: 28 },
  { id: "JOL", name: "Joel", abbreviation: "Jol", chapters: 3, testament: "OT", order: 29 },
  { id: "AMO", name: "Amos", abbreviation: "Amo", chapters: 9, testament: "OT", order: 30 },
  { id: "OBA", name: "Obadiah", abbreviation: "Oba", chapters: 1, testament: "OT", order: 31 },
  { id: "JON", name: "Jonah", abbreviation: "Jon", chapters: 4, testament: "OT", order: 32 },
  { id: "MIC", name: "Micah", abbreviation: "Mic", chapters: 7, testament: "OT", order: 33 },
  { id: "NAM", name: "Nahum", abbreviation: "Nam", chapters: 3, testament: "OT", order: 34 },
  { id: "HAB", name: "Habakkuk", abbreviation: "Hab", chapters: 3, testament: "OT", order: 35 },
  { id: "ZEP", name: "Zephaniah", abbreviation: "Zep", chapters: 3, testament: "OT", order: 36 },
  { id: "HAG", name: "Haggai", abbreviation: "Hag", chapters: 2, testament: "OT", order: 37 },
  { id: "ZEC", name: "Zechariah", abbreviation: "Zec", chapters: 14, testament: "OT", order: 38 },
  { id: "MAL", name: "Malachi", abbreviation: "Mal", chapters: 4, testament: "OT", order: 39 },
  // New Testament
  { id: "MAT", name: "Matthew", abbreviation: "Mat", chapters: 28, testament: "NT", order: 40 },
  { id: "MRK", name: "Mark", abbreviation: "Mrk", chapters: 16, testament: "NT", order: 41 },
  { id: "LUK", name: "Luke", abbreviation: "Luk", chapters: 24, testament: "NT", order: 42 },
  { id: "JHN", name: "John", abbreviation: "Jhn", chapters: 21, testament: "NT", order: 43 },
  { id: "ACT", name: "Acts", abbreviation: "Act", chapters: 28, testament: "NT", order: 44 },
  { id: "ROM", name: "Romans", abbreviation: "Rom", chapters: 16, testament: "NT", order: 45 },
  { id: "1CO", name: "1 Corinthians", abbreviation: "1Co", chapters: 16, testament: "NT", order: 46 },
  { id: "2CO", name: "2 Corinthians", abbreviation: "2Co", chapters: 13, testament: "NT", order: 47 },
  { id: "GAL", name: "Galatians", abbreviation: "Gal", chapters: 6, testament: "NT", order: 48 },
  { id: "EPH", name: "Ephesians", abbreviation: "Eph", chapters: 6, testament: "NT", order: 49 },
  { id: "PHP", name: "Philippians", abbreviation: "Php", chapters: 4, testament: "NT", order: 50 },
  { id: "COL", name: "Colossians", abbreviation: "Col", chapters: 4, testament: "NT", order: 51 },
  { id: "1TH", name: "1 Thessalonians", abbreviation: "1Th", chapters: 5, testament: "NT", order: 52 },
  { id: "2TH", name: "2 Thessalonians", abbreviation: "2Th", chapters: 3, testament: "NT", order: 53 },
  { id: "1TI", name: "1 Timothy", abbreviation: "1Ti", chapters: 6, testament: "NT", order: 54 },
  { id: "2TI", name: "2 Timothy", abbreviation: "2Ti", chapters: 4, testament: "NT", order: 55 },
  { id: "TIT", name: "Titus", abbreviation: "Tit", chapters: 3, testament: "NT", order: 56 },
  { id: "PHM", name: "Philemon", abbreviation: "Phm", chapters: 1, testament: "NT", order: 57 },
  { id: "HEB", name: "Hebrews", abbreviation: "Heb", chapters: 13, testament: "NT", order: 58 },
  { id: "JAS", name: "James", abbreviation: "Jas", chapters: 5, testament: "NT", order: 59 },
  { id: "1PE", name: "1 Peter", abbreviation: "1Pe", chapters: 5, testament: "NT", order: 60 },
  { id: "2PE", name: "2 Peter", abbreviation: "2Pe", chapters: 3, testament: "NT", order: 61 },
  { id: "1JN", name: "1 John", abbreviation: "1Jn", chapters: 5, testament: "NT", order: 62 },
  { id: "2JN", name: "2 John", abbreviation: "2Jn", chapters: 1, testament: "NT", order: 63 },
  { id: "3JN", name: "3 John", abbreviation: "3Jn", chapters: 1, testament: "NT", order: 64 },
  { id: "JUD", name: "Jude", abbreviation: "Jud", chapters: 1, testament: "NT", order: 65 },
  { id: "REV", name: "Revelation", abbreviation: "Rev", chapters: 22, testament: "NT", order: 66 },
];

export const TRANSLATIONS: { id: BibleTranslation; name: string }[] = [
  { id: "KJV",   name: "King James Version" },
  { id: "ASV",   name: "American Standard Version" },
  { id: "WEB",   name: "World English Bible" },
  { id: "WEBBE", name: "World English Bible (British)" },
  { id: "YLT",   name: "Young's Literal Translation" },
  { id: "BBE",   name: "Bible in Basic English" },
  { id: "DBY",   name: "Darby Translation" },
  { id: "OEB",   name: "Open English Bible" },
];

export const VERSE_OF_THE_DAY_POOL = [
  { bookId: "JHN", bookName: "John", chapter: 3, verse: 16, text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
  { bookId: "PSA", bookName: "Psalms", chapter: 23, verse: 1, text: "The LORD is my shepherd; I shall not want." },
  { bookId: "PHP", bookName: "Philippians", chapter: 4, verse: 13, text: "I can do all things through Christ which strengtheneth me." },
  { bookId: "JER", bookName: "Jeremiah", chapter: 29, verse: 11, text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end." },
  { bookId: "ROM", bookName: "Romans", chapter: 8, verse: 28, text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose." },
  { bookId: "ISA", bookName: "Isaiah", chapter: 40, verse: 31, text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint." },
  { bookId: "PRO", bookName: "Proverbs", chapter: 3, verse: 5, text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding." },
  { bookId: "MAT", bookName: "Matthew", chapter: 6, verse: 33, text: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you." },
  { bookId: "PSA", bookName: "Psalms", chapter: 46, verse: 1, text: "God is our refuge and strength, a very present help in trouble." },
  { bookId: "EPH", bookName: "Ephesians", chapter: 2, verse: 8, text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God." },
  { bookId: "JOS", bookName: "Joshua", chapter: 1, verse: 9, text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest." },
  { bookId: "2CO", bookName: "2 Corinthians", chapter: 5, verse: 17, text: "Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new." },
  { bookId: "1CO", bookName: "1 Corinthians", chapter: 13, verse: 4, text: "Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up." },
  { bookId: "GAL", bookName: "Galatians", chapter: 5, verse: 22, text: "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith." },
  { bookId: "HEB", bookName: "Hebrews", chapter: 11, verse: 1, text: "Now faith is the substance of things hoped for, the evidence of things not seen." },
];

export function getTodaysVerse() {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return VERSE_OF_THE_DAY_POOL[dayOfYear % VERSE_OF_THE_DAY_POOL.length];
}

export function getBibleBook(bookId: string): BibleBook | undefined {
  return BIBLE_BOOKS.find((b) => b.id === bookId);
}

export const PRESET_READING_PLANS = [
  {
    name: "Bible in a Year",
    description: "Read through the entire Bible in 365 days",
    duration: 365,
    tags: ["comprehensive", "yearly"],
  },
  {
    name: "New Testament in 30 Days",
    description: "Cover the entire New Testament in one month",
    duration: 30,
    tags: ["new-testament", "intensive"],
  },
  {
    name: "Psalms & Proverbs",
    description: "Daily wisdom from Psalms and Proverbs over 60 days",
    duration: 60,
    tags: ["wisdom", "poetry"],
  },
  {
    name: "Gospel Journey",
    description: "Deep dive through all four Gospels in 28 days",
    duration: 28,
    tags: ["jesus", "gospels"],
  },
  {
    name: "Epistles Study",
    description: "Paul's letters and general epistles over 45 days",
    duration: 45,
    tags: ["epistles", "theology"],
  },
];

// ── Daily reading calculator ─────────────────────────────────────────────────

export interface DayReading {
  label: string; // human-readable: "Matthew 1–3"
  bookId: string;
  chapter: number;
}

// Ordered list of chapters for each plan
const PLAN_CHAPTER_SEQUENCE: Record<string, Array<{ bookId: string; bookName: string; chapter: number }>> = {};

export function buildSequence(bookIds: string[]): Array<{ bookId: string; bookName: string; chapter: number }> {
  const seq: Array<{ bookId: string; bookName: string; chapter: number }> = [];
  for (const id of bookIds) {
    const book = BIBLE_BOOKS.find((b) => b.id === id);
    if (!book) continue;
    for (let ch = 1; ch <= book.chapters; ch++) {
      seq.push({ bookId: id, bookName: book.name, chapter: ch });
    }
  }
  return seq;
}

// Bible in a Year: all 66 books in canonical order
PLAN_CHAPTER_SEQUENCE["Bible in a Year"] = buildSequence(BIBLE_BOOKS.map((b) => b.id));

// New Testament in 30 Days: NT books only
PLAN_CHAPTER_SEQUENCE["New Testament in 30 Days"] = buildSequence(
  BIBLE_BOOKS.filter((b) => b.testament === "NT").map((b) => b.id)
);

// Psalms & Proverbs: interleave psalms (2/day) and proverbs (1 chapter every 2 days)
PLAN_CHAPTER_SEQUENCE["Psalms & Proverbs"] = buildSequence(["PSA", "PRO"]);

// Gospel Journey: four Gospels
PLAN_CHAPTER_SEQUENCE["Gospel Journey"] = buildSequence(["MAT", "MRK", "LUK", "JHN"]);

// Epistles Study: all NT epistles
PLAN_CHAPTER_SEQUENCE["Epistles Study"] = buildSequence([
  "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL",
  "1TH", "2TH", "1TI", "2TI", "TIT", "PHM",
  "HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD",
]);

export function getPlanDayReading(planName: string, dayNumber: number): DayReading | null {
  const seq = PLAN_CHAPTER_SEQUENCE[planName];
  if (!seq || seq.length === 0) return null;

  const plan = PRESET_READING_PLANS.find((p) => p.name === planName);
  const duration = plan?.duration ?? 30;

  const chaptersPerDay = seq.length / duration;
  const startIdx = Math.floor((dayNumber - 1) * chaptersPerDay);
  const endIdx = Math.min(seq.length - 1, Math.floor(dayNumber * chaptersPerDay) - 1);

  if (startIdx >= seq.length) return null;

  const first = seq[startIdx];
  const last = seq[endIdx] ?? first;

  let label: string;
  if (first.bookId === last.bookId) {
    label = first.chapter === last.chapter
      ? `${first.bookName} ${first.chapter}`
      : `${first.bookName} ${first.chapter}–${last.chapter}`;
  } else {
    label = `${first.bookName} ${first.chapter} – ${last.bookName} ${last.chapter}`;
  }

  return { label, bookId: first.bookId, chapter: first.chapter };
}

export function registerPlanSequence(planName: string, bookIds: string[]): void {
  if (!PLAN_CHAPTER_SEQUENCE[planName]) {
    PLAN_CHAPTER_SEQUENCE[planName] = buildSequence(bookIds);
  }
}

export function getTotalChaptersForBooks(bookIds: string[]): number {
  return bookIds.reduce((sum, id) => {
    const book = BIBLE_BOOKS.find((b) => b.id === id);
    return sum + (book?.chapters ?? 0);
  }, 0);
}
