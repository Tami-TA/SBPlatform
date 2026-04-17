"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { fetchChapter, searchBible } from "@/lib/bible-api";
import { BIBLE_BOOKS } from "@/lib/bible-data";
import { saveHighlight, getUserHighlights, saveBookmark, saveAnnotation, updateStreak } from "@/lib/firestore";
import { formatVerseRef, shareVerse } from "@/lib/utils";
import type { BibleChapter, BibleTranslation, HighlightColor, Highlight, BibleVerse } from "@/types";
import {
  ChevronLeft, ChevronRight, Search, Bookmark, Highlighter,
  MessageSquarePlus, Share2, BookOpen, X, Loader2, Sparkles,
  Volume2, List, ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";

const HIGHLIGHT_COLORS: { id: HighlightColor; label: string; class: string; bg: string }[] = [
  { id: "yellow", label: "Yellow", class: "highlight-yellow", bg: "#fef08a" },
  { id: "green", label: "Green", class: "highlight-green", bg: "#86efac" },
  { id: "blue", label: "Blue", class: "highlight-blue", bg: "#93c5fd" },
  { id: "pink", label: "Pink", class: "highlight-pink", bg: "#f9a8d4" },
  { id: "orange", label: "Orange", class: "highlight-orange", bg: "#fdba74" },
];

export default function BiblePage() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();

  const [translation, setTranslation] = useState<BibleTranslation>(
    (user?.preferredTranslation as BibleTranslation) || "KJV"
  );
  const [selectedBook, setSelectedBook] = useState(searchParams.get("book") || "JHN");
  const [selectedChapter, setSelectedChapter] = useState(parseInt(searchParams.get("chapter") || "1"));
  const [chapter, setChapter] = useState<BibleChapter | null>(null);
  const [loading, setLoading] = useState(false);

  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showTranslationSelector, setShowTranslationSelector] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BibleVerse[]>([]);
  const [searching, setSearching] = useState(false);

  const [availableTranslations, setAvailableTranslations] = useState<Array<{ id: string; name: string }>>([
    { id: "KJV", name: "King James Version" },
  ]);

  useEffect(() => {
    fetch("/api/bible/translations")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.translations) && data.translations.length > 0) {
          setAvailableTranslations(data.translations);
        }
      })
      .catch(() => {});
  }, []);

  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [annotationText, setAnnotationText] = useState("");
  const [annotationType, setAnnotationType] = useState<"note" | "question" | "insight" | "prayer">("note");

  const [highlights, setHighlights] = useState<Map<string, HighlightColor>>(new Map());
  const [activeHighlightColor, setActiveHighlightColor] = useState<HighlightColor>("yellow");

  const [fontSize, setFontSize] = useState(17);
  const [showSettings, setShowSettings] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const book = BIBLE_BOOKS.find((b) => b.id === selectedBook);

  const loadChapter = useCallback(async () => {
    setLoading(true);
    setSelectedVerse(null);
    setToolbarPos(null);
    try {
      const data = await fetchChapter(selectedBook, selectedChapter, translation);
      setChapter(data);
      if (user) await updateStreak(user.uid);
    } catch {
      toast.error("Failed to load chapter. The Bible database may not be ready.");
    } finally {
      setLoading(false);
    }
  }, [selectedBook, selectedChapter, translation, user]);

  useEffect(() => { loadChapter(); }, [loadChapter]);

  useEffect(() => {
    if (!user) return;
    getUserHighlights(user.uid).then((h) => {
      const map = new Map<string, HighlightColor>();
      h.forEach((hi) => {
        const key = `${hi.verseRef.bookId}.${hi.verseRef.chapter}.${hi.verseRef.verse}`;
        map.set(key, hi.color);
      });
      setHighlights(map);
    });
  }, [user]);

  function handleVerseClick(verseNum: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (selectedVerse === verseNum) {
      setSelectedVerse(null);
      setToolbarPos(null);
      return;
    }
    setSelectedVerse(verseNum);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      setToolbarPos({
        top: rect.top - containerRect.top - 56,
        left: Math.max(0, Math.min(rect.left - containerRect.left, containerRect.width - 280)),
      });
    }
  }

  async function handleHighlight(color: HighlightColor) {
    if (!user || !selectedVerse || !book) return;
    const key = `${selectedBook}.${selectedChapter}.${selectedVerse}`;
    const newMap = new Map(highlights);
    newMap.set(key, color);
    setHighlights(newMap);
    await saveHighlight({
      userId: user.uid,
      color,
      verseRef: { bookId: selectedBook, bookName: book.name, chapter: selectedChapter, verse: selectedVerse, translation },
    });
    toast.success("Verse highlighted!");
    setSelectedVerse(null);
    setToolbarPos(null);
  }

  async function handleBookmark() {
    if (!user || !selectedVerse || !book) return;
    await saveBookmark({
      userId: user.uid,
      verseRef: { bookId: selectedBook, bookName: book.name, chapter: selectedChapter, verse: selectedVerse, translation },
    });
    toast.success("Verse bookmarked!");
    setSelectedVerse(null);
    setToolbarPos(null);
  }

  async function handleSaveAnnotation() {
    if (!user || !selectedVerse || !book || !annotationText.trim()) return;
    await saveAnnotation({
      userId: user.uid,
      username: user.username,
      photoURL: user.photoURL,
      content: annotationText,
      type: annotationType,
      isPrivate: true,
      verseRef: { bookId: selectedBook, bookName: book.name, chapter: selectedChapter, verse: selectedVerse, translation },
    });
    toast.success("Note saved!");
    setAnnotationText("");
    setShowAnnotationForm(false);
    setSelectedVerse(null);
    setToolbarPos(null);
  }

  function handleShareVerse() {
    if (!selectedVerse || !book) return;
    const verse = chapter?.verses.find((v) => v.verse === selectedVerse);
    if (!verse) return;
    shareVerse(verse.text, formatVerseRef(book.name, selectedChapter, selectedVerse));
    toast.success("Verse copied to share!");
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await searchBible(searchQuery, translation);
    setSearchResults(results);
    setSearching(false);
  }

  function navigateChapter(dir: "prev" | "next") {
    if (!book) return;
    if (dir === "prev") {
      if (selectedChapter > 1) setSelectedChapter((c) => c - 1);
      else {
        const prevBook = BIBLE_BOOKS.find((b) => b.order === (book.order - 1));
        if (prevBook) { setSelectedBook(prevBook.id); setSelectedChapter(prevBook.chapters); }
      }
    } else {
      if (selectedChapter < book.chapters) setSelectedChapter((c) => c + 1);
      else {
        const nextBook = BIBLE_BOOKS.find((b) => b.order === (book.order + 1));
        if (nextBook) { setSelectedBook(nextBook.id); setSelectedChapter(1); }
      }
    }
  }

  const OT = BIBLE_BOOKS.filter((b) => b.testament === "OT");
  const NT = BIBLE_BOOKS.filter((b) => b.testament === "NT");

  return (
    <div className="h-full flex flex-col" onClick={() => { if (selectedVerse) { setSelectedVerse(null); setToolbarPos(null); } }}>
      {/* Bible toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-page flex-wrap"
        style={{ background: "var(--bg-card)" }}>

        {/* Book selector */}
        <button onClick={(e) => { e.stopPropagation(); setShowBookSelector(!showBookSelector); setShowTranslationSelector(false); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-page transition-all hover:opacity-80"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <BookOpen size={15} />
          {book?.name || "Book"}
          <ChevronDown size={14} />
        </button>

        {/* Chapter selector */}
        <div className="flex items-center gap-1">
          <button onClick={() => navigateChapter("prev")} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-page hover:text-page transition-all"
            style={{ background: "var(--bg-secondary)" }}>
            <ChevronLeft size={16} />
          </button>
          <select value={selectedChapter}
            onChange={(e) => setSelectedChapter(parseInt(e.target.value))}
            className="input-field py-1.5 px-2 text-sm w-20 text-center"
            onClick={(e) => e.stopPropagation()}>
            {Array.from({ length: book?.chapters || 1 }, (_, i) => i + 1).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button onClick={() => navigateChapter("next")} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-page hover:text-page transition-all"
            style={{ background: "var(--bg-secondary)" }}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Translation */}
        <button onClick={(e) => { e.stopPropagation(); setShowTranslationSelector(!showTranslationSelector); setShowBookSelector(false); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.3)", color: "var(--gold)" }}>
          {translation}
          <ChevronDown size={13} />
        </button>

        <div className="flex-1" />

        {/* Font size */}
        <div className="hidden md:flex items-center gap-1.5">
          <button onClick={() => setFontSize((f) => Math.max(13, f - 1))} className="text-xs px-2 py-1 rounded text-muted-page hover:text-page" style={{ background: "var(--bg-secondary)" }}>A-</button>
          <button onClick={() => setFontSize((f) => Math.min(24, f + 1))} className="text-sm px-2 py-1 rounded text-muted-page hover:text-page" style={{ background: "var(--bg-secondary)" }}>A+</button>
        </div>

        {/* Search */}
        <button onClick={(e) => { e.stopPropagation(); setSearchMode(!searchMode); }}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${searchMode ? "text-page" : "text-muted-page hover:text-page"}`}
          style={{ background: searchMode ? "rgba(212,175,55,0.2)" : "var(--bg-secondary)" }}>
          <Search size={16} />
        </button>
      </div>

      {/* Book Selector Dropdown */}
      {showBookSelector && (
        <div className="absolute top-28 left-4 z-50 w-80 max-h-96 overflow-y-auto rounded-2xl shadow-card-hover"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          onClick={(e) => e.stopPropagation()}>
          <div className="p-3 border-b border-page flex items-center justify-between">
            <h3 className="font-semibold text-sm text-page">Select Book</h3>
            <button onClick={() => setShowBookSelector(false)}><X size={16} className="text-muted-page" /></button>
          </div>
          <div className="p-3">
            <p className="text-xs font-bold text-muted-page mb-2 uppercase tracking-wider">Old Testament</p>
            <div className="grid grid-cols-3 gap-1 mb-4">
              {OT.map((b) => (
                <button key={b.id} onClick={() => { setSelectedBook(b.id); setSelectedChapter(1); setShowBookSelector(false); }}
                  className={`text-xs px-2 py-1.5 rounded-lg text-left transition-all ${selectedBook === b.id ? "font-bold" : "text-secondary-page hover:text-page"}`}
                  style={{ background: selectedBook === b.id ? "rgba(212,175,55,0.2)" : "var(--bg-secondary)", color: selectedBook === b.id ? "var(--gold)" : undefined }}>
                  {b.abbreviation}
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-muted-page mb-2 uppercase tracking-wider">New Testament</p>
            <div className="grid grid-cols-3 gap-1">
              {NT.map((b) => (
                <button key={b.id} onClick={() => { setSelectedBook(b.id); setSelectedChapter(1); setShowBookSelector(false); }}
                  className={`text-xs px-2 py-1.5 rounded-lg text-left transition-all ${selectedBook === b.id ? "font-bold" : "text-secondary-page hover:text-page"}`}
                  style={{ background: selectedBook === b.id ? "rgba(212,175,55,0.2)" : "var(--bg-secondary)", color: selectedBook === b.id ? "var(--gold)" : undefined }}>
                  {b.abbreviation}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Translation Selector */}
      {showTranslationSelector && (
        <div className="absolute top-28 left-60 z-50 w-64 rounded-2xl shadow-card-hover"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          onClick={(e) => e.stopPropagation()}>
          <div className="p-3 border-b border-page flex items-center justify-between">
            <h3 className="font-semibold text-sm text-page">Translation</h3>
            <button onClick={() => setShowTranslationSelector(false)}><X size={16} className="text-muted-page" /></button>
          </div>
          <div className="p-2 max-h-80 overflow-y-auto">
            {availableTranslations.map((t) => (
              <button key={t.id} onClick={() => { setTranslation(t.id as BibleTranslation); setShowTranslationSelector(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${translation === t.id ? "font-semibold" : "text-secondary-page hover:text-page"}`}
                style={{ background: translation === t.id ? "rgba(212,175,55,0.15)" : "transparent" }}>
                <span className="truncate">{t.name}</span>
                <span className="text-xs font-bold ml-2 flex-shrink-0"
                  style={{ color: translation === t.id ? "var(--gold)" : "var(--text-muted)" }}>{t.id}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search panel */}
      {searchMode && (
        <div className="border-b border-page p-3" style={{ background: "var(--bg-secondary)" }}>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search the Bible (e.g. 'love one another')"
              className="input-field flex-1 py-2 text-sm" />
            <button type="submit" disabled={searching} className="btn-gold px-4 py-2 text-sm">
              {searching ? <Loader2 size={16} className="animate-spin" /> : "Search"}
            </button>
            <button type="button" onClick={() => { setSearchMode(false); setSearchResults([]); }}
              className="btn-ghost px-3 py-2 text-sm">
              <X size={16} />
            </button>
          </form>
          {searchResults.length > 0 && (
            <div className="mt-3 max-h-64 overflow-y-auto space-y-2">
              {searchResults.map((v) => (
                <button key={v.id}
                  onClick={() => { setSelectedBook(v.bookId); setSelectedChapter(v.chapter); setSearchMode(false); setSearchResults([]); }}
                  className="w-full text-left p-3 rounded-xl transition-all hover:opacity-80"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "var(--gold)" }}>
                    {v.bookName} {v.chapter}:{v.verse} ({translation})
                  </p>
                  <p className="text-sm text-secondary-page verse-text leading-relaxed">{v.text}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chapter content */}
      <div className="flex-1 overflow-y-auto" ref={containerRef}>
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 relative">
          {/* Chapter header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-page">
              {book?.name} {selectedChapter}
            </h1>
            <p className="text-sm text-muted-page mt-1">{translation} Translation</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={32} className="animate-spin text-muted-page" />
              <p className="text-secondary-page text-sm">Loading scripture...</p>
            </div>
          ) : chapter && chapter.verses.length > 0 ? (
            <>
              {/* Floating verse toolbar */}
              {selectedVerse && toolbarPos && !showAnnotationForm && (
                <div className="absolute z-40 flex items-center gap-1 p-1.5 rounded-xl shadow-card-hover"
                  style={{ top: toolbarPos.top, left: toolbarPos.left, background: "var(--bg-card)", border: "1px solid var(--border)" }}
                  onClick={(e) => e.stopPropagation()}>
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button key={c.id} onClick={() => handleHighlight(c.id)} title={c.label}
                      className="w-6 h-6 rounded-full border-2 border-white/20 transition-transform hover:scale-125"
                      style={{ background: c.bg }} />
                  ))}
                  <div className="w-px h-5 mx-1" style={{ background: "var(--border)" }} />
                  <button onClick={handleBookmark} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-page hover:text-page transition-all"
                    style={{ background: "var(--bg-secondary)" }} title="Bookmark">
                    <Bookmark size={14} />
                  </button>
                  <button onClick={() => setShowAnnotationForm(true)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-page hover:text-page transition-all"
                    style={{ background: "var(--bg-secondary)" }} title="Add note">
                    <MessageSquarePlus size={14} />
                  </button>
                  <button onClick={handleShareVerse} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-page hover:text-page transition-all"
                    style={{ background: "var(--bg-secondary)" }} title="Share">
                    <Share2 size={14} />
                  </button>
                </div>
              )}

              {/* Annotation form */}
              {showAnnotationForm && selectedVerse && (
                <div className="sticky top-4 z-40 mb-6 p-4 rounded-2xl shadow-card-hover"
                  style={{ background: "var(--bg-card)", border: "1px solid rgba(212,175,55,0.3)" }}
                  onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm text-page">
                      Note on verse {selectedVerse}
                    </h4>
                    <button onClick={() => { setShowAnnotationForm(false); setAnnotationText(""); }}>
                      <X size={16} className="text-muted-page" />
                    </button>
                  </div>
                  <div className="flex gap-2 mb-3">
                    {(["note", "question", "insight", "prayer"] as const).map((t) => (
                      <button key={t} onClick={() => setAnnotationType(t)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition-all ${annotationType === t ? "text-gray-900" : "text-muted-page"}`}
                        style={{ background: annotationType === t ? "linear-gradient(135deg, #D4AF37, #F59E0B)" : "var(--bg-secondary)" }}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <textarea value={annotationText} onChange={(e) => setAnnotationText(e.target.value)}
                    placeholder="Write your thoughts..."
                    rows={3} className="input-field resize-none text-sm mb-3" />
                  <div className="flex gap-2">
                    <button onClick={() => { setShowAnnotationForm(false); setAnnotationText(""); }}
                      className="btn-ghost flex-1 text-sm py-2">Cancel</button>
                    <button onClick={handleSaveAnnotation} className="btn-gold flex-1 text-sm py-2">Save Note</button>
                  </div>
                </div>
              )}

              {/* Verses */}
              <div className="verse-text space-y-0" style={{ fontSize: `${fontSize}px` }}>
                {chapter.verses.map((verse) => {
                  const key = `${verse.bookId}.${verse.chapter}.${verse.verse}`;
                  const highlightColor = highlights.get(key);
                  return (
                    <span
                      key={verse.verse}
                      className={`verse-selectable inline ${selectedVerse === verse.verse ? "selected" : ""} ${highlightColor ? `highlight-${highlightColor}` : ""}`}
                      onClick={(e) => handleVerseClick(verse.verse, e)}>
                      <sup className="verse-number">{verse.verse}</sup>
                      {verse.text}{" "}
                    </span>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <BookOpen size={48} className="mx-auto mb-4 text-muted-page" />
              <p className="text-secondary-page mb-2">Could not load this chapter.</p>
              <p className="text-sm text-muted-page mb-4">
                Could not load from the local Bible database. Try a different translation or chapter.
              </p>
              <button onClick={loadChapter} className="btn-gold text-sm px-6 py-2">Try Again</button>
            </div>
          )}

          {/* Chapter navigation */}
          {chapter && (
            <div className="flex items-center justify-between mt-12 pt-6 border-t border-page">
              <button onClick={() => navigateChapter("prev")}
                className="btn-ghost flex items-center gap-2 text-sm">
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="text-xs text-muted-page">
                {book?.name} {selectedChapter} / {book?.chapters}
              </span>
              <button onClick={() => navigateChapter("next")}
                className="btn-ghost flex items-center gap-2 text-sm">
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Highlight legend */}
      <div className="hidden md:flex items-center gap-3 px-6 py-2 border-t border-page text-xs text-muted-page"
        style={{ background: "var(--bg-card)" }}>
        <Highlighter size={13} />
        <span>Click a verse to highlight, bookmark, or add notes</span>
        <div className="flex gap-1.5 ml-2">
          {HIGHLIGHT_COLORS.map((c) => (
            <div key={c.id} className="w-3 h-3 rounded-full" style={{ background: c.bg }} title={c.label} />
          ))}
        </div>
      </div>
    </div>
  );
}
