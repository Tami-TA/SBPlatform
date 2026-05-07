"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import {
  getGroup,
  subscribeToGroupBibleAnnotations,
  saveGroupBibleAnnotation,
  deleteGroupBibleAnnotation,
  toggleGroupAnnotationLike,
  addGroupAnnotationReply,
} from "@/lib/firestore";
import { BIBLE_BOOKS, TRANSLATIONS } from "@/lib/bible-data";
import { timeAgo, getInitials } from "@/lib/utils";
import type { Group, Annotation, BibleTranslation, HighlightColor } from "@/types";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Heart, MessageSquare,
  Trash2, Highlighter, StickyNote, Send, Loader2, BookOpen, X,
} from "lucide-react";
import toast from "react-hot-toast";

// ── Constants ─────────────────────────────────────────────────────────────────

const OT = BIBLE_BOOKS.filter(b => b.testament === "OT");
const NT = BIBLE_BOOKS.filter(b => b.testament === "NT");

const HL_COLORS: { id: HighlightColor; bg: string; border: string }[] = [
  { id: "yellow", bg: "var(--hl-yellow)", border: "var(--hl-yellow-border)" },
  { id: "green",  bg: "var(--hl-green)",  border: "var(--hl-green-border)"  },
  { id: "blue",   bg: "var(--hl-blue)",   border: "var(--hl-blue-border)"   },
  { id: "pink",   bg: "var(--hl-pink)",   border: "var(--hl-pink-border)"   },
  { id: "orange", bg: "var(--hl-orange)", border: "var(--hl-orange-border)" },
];

const NOTE_TYPES = [
  { id: "note" as const,     label: "Note"     },
  { id: "question" as const, label: "Question" },
  { id: "insight" as const,  label: "Insight"  },
  { id: "prayer" as const,   label: "Prayer"   },
];

// ── Small helpers ─────────────────────────────────────────────────────────────

function Avatar({ name, photoURL, size = 26 }: { name: string; photoURL?: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "var(--accent-soft-2)", color: "var(--accent-ink)",
      display: "grid", placeItems: "center", overflow: "hidden",
      fontSize: size * 0.35, fontWeight: 600, border: "1px solid var(--hairline)",
    }}>
      {photoURL
        ? <img src={photoURL} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : getInitials(name)}
    </div>
  );
}

function TypeBadge({ type }: { type: Annotation["type"] }) {
  const MAP: Record<Annotation["type"], string> = {
    note: "Note", question: "?", insight: "✦", prayer: "♥",
  };
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 999,
      background: "var(--accent-soft)", color: "var(--accent-ink)",
      border: "1px solid var(--accent-border)", flexShrink: 0,
    }}>
      {MAP[type] ?? type}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GroupBiblePage() {
  const { id: groupId } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [group,       setGroup]       = useState<Group | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(true);

  // Bible navigation
  const [bookId,    setBookId]    = useState("GEN");
  const [chapter,   setChapter]   = useState(1);
  const [translation, setTranslation] = useState<BibleTranslation>(
    (user?.preferredTranslation ?? "KJV") as BibleTranslation
  );

  // Verse data
  const [verses,    setVerses]    = useState<{ verse: number; text: string }[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(false);

  // Annotations (real-time)
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  // Interaction state
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [activeMode,    setActiveMode]    = useState<"highlight" | "note" | null>(null);
  const [pickedColor,   setPickedColor]   = useState<HighlightColor>("yellow");
  const [noteText,      setNoteText]      = useState("");
  const [noteType,      setNoteType]      = useState<Annotation["type"]>("note");
  const [saving,        setSaving]        = useState(false);

  // Reply state per annotation
  const [replyOpen,   setReplyOpen]   = useState<string | null>(null);
  const [replyText,   setReplyText]   = useState("");
  const [replying,    setReplying]    = useState(false);

  const panelRef   = useRef<HTMLDivElement>(null);
  const unsubRef   = useRef<(() => void) | null>(null);

  // Load group
  useEffect(() => {
    if (!groupId) return;
    getGroup(groupId).then(g => { setGroup(g); setLoadingGroup(false); });
  }, [groupId]);

  // Fetch Bible chapter
  useEffect(() => {
    setLoadingVerses(true);
    setVerses([]);
    fetch(`/api/bible/local?translation=${translation}&book=${bookId}&chapter=${chapter}`)
      .then(r => r.json())
      .then(data => {
        if (data.available) setVerses(data.verses ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingVerses(false));
  }, [bookId, chapter, translation]);

  // Real-time group annotations for this chapter
  useEffect(() => {
    if (!groupId) return;
    unsubRef.current?.();
    unsubRef.current = subscribeToGroupBibleAnnotations(groupId, bookId, chapter, setAnnotations);
    return () => { unsubRef.current?.(); };
  }, [groupId, bookId, chapter]);

  // Close panel when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // only close if click isn't on a verse itself
        const target = e.target as HTMLElement;
        if (!target.closest("[data-verse]")) {
          setSelectedVerse(null);
          setActiveMode(null);
        }
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // ── Derived state ──────────────────────────────────────────────────────────

  const currentBook = BIBLE_BOOKS.find(b => b.id === bookId)!;

  // Map verse → highlight color and note count
  const verseHighlight = new Map<number, HighlightColor>();
  const verseNoteCount = new Map<number, number>();
  annotations.forEach(a => {
    const v = a.verseRef.verse ?? 0;
    if (a.highlightColor && !verseHighlight.has(v)) verseHighlight.set(v, a.highlightColor);
    verseNoteCount.set(v, (verseNoteCount.get(v) ?? 0) + 1);
  });

  const selectedVerseAnnotations = selectedVerse !== null
    ? annotations.filter(a => a.verseRef.verse === selectedVerse)
    : [];

  const existingHighlight = selectedVerse !== null
    ? annotations.find(a => a.verseRef.verse === selectedVerse && !!a.highlightColor && a.userId === user?.uid)
    : null;

  // ── Actions ────────────────────────────────────────────────────────────────

  function selectVerse(v: number) {
    if (selectedVerse === v) { setSelectedVerse(null); setActiveMode(null); return; }
    setSelectedVerse(v);
    setActiveMode(null);
    setNoteText("");
  }

  function prevChapter() {
    if (chapter > 1) { setChapter(c => c - 1); setSelectedVerse(null); }
    else {
      const idx = BIBLE_BOOKS.findIndex(b => b.id === bookId);
      if (idx > 0) { setBookId(BIBLE_BOOKS[idx - 1].id); setChapter(BIBLE_BOOKS[idx - 1].chapters); setSelectedVerse(null); }
    }
  }

  function nextChapter() {
    if (chapter < currentBook.chapters) { setChapter(c => c + 1); setSelectedVerse(null); }
    else {
      const idx = BIBLE_BOOKS.findIndex(b => b.id === bookId);
      if (idx < BIBLE_BOOKS.length - 1) { setBookId(BIBLE_BOOKS[idx + 1].id); setChapter(1); setSelectedVerse(null); }
    }
  }

  async function handleHighlight(color: HighlightColor) {
    if (!user || selectedVerse === null || !groupId) return;
    setSaving(true);
    try {
      if (existingHighlight) {
        // Remove existing highlight
        await deleteGroupBibleAnnotation(existingHighlight.id);
        if (existingHighlight.highlightColor === color) { setSaving(false); return; }
      }
      await saveGroupBibleAnnotation({
        userId: user.uid,
        username: user.username,
        photoURL: user.photoURL,
        verseRef: {
          bookId,
          bookName: currentBook.name,
          chapter,
          verse: selectedVerse,
          translation,
        },
        content: "",
        type: "insight",
        isPrivate: false,
        groupId,
        highlightColor: color,
      });
    } catch {
      toast.error("Failed to save highlight");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote() {
    if (!user || selectedVerse === null || !noteText.trim() || !groupId) return;
    setSaving(true);
    try {
      await saveGroupBibleAnnotation({
        userId: user.uid,
        username: user.username,
        photoURL: user.photoURL,
        verseRef: {
          bookId,
          bookName: currentBook.name,
          chapter,
          verse: selectedVerse,
          translation,
        },
        content: noteText.trim(),
        type: noteType,
        isPrivate: false,
        groupId,
      });
      setNoteText("");
      setActiveMode(null);
      toast.success("Note added!");
    } catch {
      toast.error("Failed to add note");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(annotationId: string) {
    // Optimistic: remove immediately so all counts update without waiting for onSnapshot
    setAnnotations(prev => prev.filter(a => a.id !== annotationId));
    try {
      await deleteGroupBibleAnnotation(annotationId);
    } catch {
      toast.error("Failed to delete");
      // onSnapshot will resync correct state from Firestore on its next fire
    }
  }

  async function handleLike(annotationId: string) {
    if (!user) return;
    try { await toggleGroupAnnotationLike(annotationId, user.uid); } catch { /**/ }
  }

  async function handleReply(annotationId: string) {
    if (!user || !replyText.trim()) return;
    setReplying(true);
    try {
      await addGroupAnnotationReply(annotationId, {
        userId: user.uid,
        username: user.username,
        photoURL: user.photoURL,
        content: replyText.trim(),
      });
      setReplyText("");
      setReplyOpen(null);
    } catch {
      toast.error("Failed to add reply");
    } finally {
      setReplying(false);
    }
  }

  // ── Guard ──────────────────────────────────────────────────────────────────

  if (loadingGroup) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
        <Loader2 size={22} className="animate-spin" style={{ color: "var(--ink-4)" }} />
      </div>
    );
  }

  if (!group || !group.memberIds.includes(user?.uid ?? "")) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--ink-3)" }}>You must be a group member to access the Shared Bible.</p>
        <Link href="/dashboard/groups" className="btn btn-sm" style={{ marginTop: 12 }}>Back to Groups</Link>
      </div>
    );
  }

  const isAdmin = group.adminIds.includes(user?.uid ?? "");

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)", overflow: "hidden", background: "var(--paper)" }}>

      {/* ── Top bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "0 16px", height: 52, flexShrink: 0,
        borderBottom: "1px solid var(--hairline)", background: "var(--paper)",
        flexWrap: "wrap", minHeight: 52,
      }}>
        <Link href={`/dashboard/groups/${groupId}`} style={{ color: "var(--ink-3)", display: "flex", alignItems: "center", flexShrink: 0 }}>
          <ArrowLeft size={18} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <BookOpen size={14} style={{ color: "var(--accent-btn)" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-1)" }}>{group.name} · Shared Bible</span>
        </div>
        <div style={{ flex: 1 }} />

        {/* Translation */}
        <select
          value={translation}
          onChange={e => setTranslation(e.target.value as BibleTranslation)}
          className="input-field"
          style={{ height: 28, fontSize: 12, padding: "0 8px", width: "auto", flexShrink: 0 }}
        >
          {TRANSLATIONS.map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
        </select>
      </div>

      {/* ── Chapter nav bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 16px", borderBottom: "1px solid var(--hairline)",
        background: "var(--paper-2)", flexShrink: 0, flexWrap: "wrap",
      }}>
        {/* Book selector */}
        <select
          value={bookId}
          onChange={e => { setBookId(e.target.value); setChapter(1); setSelectedVerse(null); }}
          className="input-field"
          style={{ height: 30, fontSize: 12.5, padding: "0 8px", flexShrink: 0 }}
        >
          <optgroup label="Old Testament">
            {OT.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </optgroup>
          <optgroup label="New Testament">
            {NT.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </optgroup>
        </select>

        {/* Chapter selector */}
        <select
          value={chapter}
          onChange={e => { setChapter(Number(e.target.value)); setSelectedVerse(null); }}
          className="input-field"
          style={{ height: 30, fontSize: 12.5, padding: "0 8px", width: 90, flexShrink: 0 }}
        >
          {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map(c => (
            <option key={c} value={c}>Ch. {c}</option>
          ))}
        </select>

        <div style={{ flex: 1 }} />

        {/* Annotation count chip */}
        {annotations.length > 0 && (
          <span style={{ fontSize: 11.5, color: "var(--ink-3)", flexShrink: 0 }}>
            {annotations.length} note{annotations.length !== 1 ? "s" : ""} in this chapter
          </span>
        )}

        {/* Prev / Next */}
        <button onClick={prevChapter} className="btn-ghost btn-sm" style={{ padding: "0 8px" }}>
          <ChevronLeft size={15} />
        </button>
        <button onClick={nextChapter} className="btn-ghost btn-sm" style={{ padding: "0 8px" }}>
          <ChevronRight size={15} />
        </button>
      </div>

      {/* ── Content: verses + panel ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Verses column */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 60px" }}>
          {loadingVerses ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
              <Loader2 size={22} className="animate-spin" style={{ color: "var(--ink-4)" }} />
            </div>
          ) : verses.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-4)", textAlign: "center", padding: 48 }}>
              Could not load {currentBook.name} {chapter}. Check your connection and try again.
            </p>
          ) : (
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 400, color: "var(--ink-2)", marginBottom: 20, letterSpacing: "-0.01em" }}>
                {currentBook.name} {chapter}
              </h2>
              {verses.map(({ verse, text }) => {
                const hlColor = verseHighlight.get(verse);
                const noteCount = verseNoteCount.get(verse) ?? 0;
                const isSelected = selectedVerse === verse;
                const verseAnnots = annotations.filter(a => a.verseRef.verse === verse);

                return (
                  <div key={verse}>
                    {/* Verse row */}
                    <div
                      data-verse={verse}
                      onClick={() => selectVerse(verse)}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "6px 10px", borderRadius: 8, cursor: "pointer",
                        marginBottom: 2,
                        background: isSelected
                          ? "var(--accent-soft)"
                          : hlColor
                            ? `var(--hl-${hlColor})`
                            : "transparent",
                        border: isSelected ? "1px solid var(--accent-border)" : "1px solid transparent",
                        transition: "background 80ms, border-color 80ms",
                      }}
                    >
                      <span style={{
                        fontSize: 10.5, fontWeight: 500, color: "var(--ink-4)",
                        minWidth: 22, paddingTop: 3, fontVariantNumeric: "tabular-nums",
                        flexShrink: 0, textAlign: "right",
                      }}>{verse}</span>
                      <span style={{ fontFamily: "var(--font-serif)", fontSize: 17, lineHeight: 1.65, color: "var(--ink-1)", flex: 1 }}>
                        {text}
                      </span>
                      {noteCount > 0 && (
                        <span style={{
                          fontSize: 10, fontWeight: 600, color: "var(--accent-ink)",
                          background: "var(--accent-soft)", border: "1px solid var(--accent-border)",
                          borderRadius: 999, padding: "1px 6px", flexShrink: 0, marginTop: 4,
                        }}>{noteCount}</span>
                      )}
                    </div>

                    {/* Inline annotation panel for selected verse */}
                    {isSelected && (
                      <div ref={panelRef} style={{
                        margin: "4px 0 12px 32px",
                        border: "1px solid var(--hairline)",
                        borderRadius: 10, background: "var(--paper)",
                        overflow: "hidden",
                      }}>
                        {/* Action row */}
                        <div style={{
                          display: "flex", alignItems: "center", gap: 6, padding: "10px 14px",
                          borderBottom: verseAnnots.length > 0 || activeMode !== null ? "1px solid var(--hairline)" : "none",
                          background: "var(--paper-2)",
                        }}>
                          <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 500, marginRight: 4 }}>
                            {currentBook.name} {chapter}:{verse}
                          </span>
                          <div style={{ flex: 1 }} />
                          <button
                            onClick={e => { e.stopPropagation(); setActiveMode(activeMode === "highlight" ? null : "highlight"); }}
                            className={activeMode === "highlight" ? "btn-primary btn-sm" : "btn btn-sm"}
                            style={{ gap: 5 }}
                          >
                            <Highlighter size={12} /> Highlight
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setActiveMode(activeMode === "note" ? null : "note"); setNoteText(""); }}
                            className={activeMode === "note" ? "btn-primary btn-sm" : "btn btn-sm"}
                            style={{ gap: 5 }}
                          >
                            <StickyNote size={12} /> Note
                          </button>
                          <button onClick={e => { e.stopPropagation(); setSelectedVerse(null); setActiveMode(null); }} className="btn-ghost btn-sm" style={{ padding: "0 6px" }}>
                            <X size={13} />
                          </button>
                        </div>

                        {/* Highlight picker */}
                        {activeMode === "highlight" && (
                          <div style={{ padding: "12px 14px", borderBottom: verseAnnots.length > 0 ? "1px solid var(--hairline)" : "none", display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12, color: "var(--ink-3)", marginRight: 4 }}>Color:</span>
                            {HL_COLORS.map(c => (
                              <button
                                key={c.id}
                                onClick={e => { e.stopPropagation(); setPickedColor(c.id); handleHighlight(c.id); }}
                                title={c.id}
                                style={{
                                  width: 26, height: 26, borderRadius: 6,
                                  background: c.bg, border: `2px solid ${c.id === pickedColor || existingHighlight?.highlightColor === c.id ? c.border : "transparent"}`,
                                  cursor: "pointer", flexShrink: 0,
                                  outline: existingHighlight?.highlightColor === c.id ? `2px solid ${c.border}` : "none",
                                  outlineOffset: 2,
                                }}
                              />
                            ))}
                            {existingHighlight && (
                              <button
                                onClick={e => { e.stopPropagation(); handleDelete(existingHighlight.id); }}
                                className="btn-ghost btn-sm"
                                style={{ marginLeft: "auto", fontSize: 11 }}
                              >
                                Remove
                              </button>
                            )}
                            {saving && <Loader2 size={14} className="animate-spin" style={{ color: "var(--ink-4)" }} />}
                          </div>
                        )}

                        {/* Note composer */}
                        {activeMode === "note" && (
                          <div style={{ padding: "12px 14px", borderBottom: verseAnnots.length > 0 ? "1px solid var(--hairline)" : "none" }}>
                            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                              {NOTE_TYPES.map(t => (
                                <button
                                  key={t.id}
                                  onClick={e => { e.stopPropagation(); setNoteType(t.id); }}
                                  className={noteType === t.id ? "btn-primary btn-sm" : "btn btn-sm"}
                                  style={{ fontSize: 11.5 }}
                                >
                                  {t.label}
                                </button>
                              ))}
                            </div>
                            <textarea
                              value={noteText}
                              onChange={e => setNoteText(e.target.value)}
                              onClick={e => e.stopPropagation()}
                              placeholder="Share your thought with the group…"
                              rows={3}
                              className="input-field"
                              style={{ resize: "none", fontSize: 13, width: "100%", marginBottom: 8 }}
                              autoFocus
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                              <button onClick={e => { e.stopPropagation(); setActiveMode(null); }} className="btn btn-sm">Cancel</button>
                              <button
                                onClick={e => { e.stopPropagation(); handleAddNote(); }}
                                disabled={!noteText.trim() || saving}
                                className="btn-primary btn-sm"
                              >
                                {saving ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                Post
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Existing annotations for this verse */}
                        {verseAnnots.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            {verseAnnots.filter(a => !!a.content).map((ann, i) => (
                              <AnnotationCard
                                key={ann.id}
                                annotation={ann}
                                currentUid={user?.uid ?? ""}
                                isAdmin={isAdmin}
                                isLast={i === verseAnnots.filter(a => !!a.content).length - 1}
                                replyOpen={replyOpen === ann.id}
                                replyText={replyText}
                                replying={replying}
                                onLike={() => handleLike(ann.id)}
                                onDelete={() => handleDelete(ann.id)}
                                onToggleReply={() => {
                                  setReplyOpen(replyOpen === ann.id ? null : ann.id);
                                  setReplyText("");
                                }}
                                onReplyChange={setReplyText}
                                onReplySubmit={() => handleReply(ann.id)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right sidebar: all chapter annotations (desktop) ── */}
        <aside style={{
          width: 280, flexShrink: 0,
          borderLeft: "1px solid var(--hairline)",
          background: "var(--paper-2)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }} className="hidden lg:flex">
          <div style={{ padding: "14px 14px 8px", borderBottom: "1px solid var(--hairline)", flexShrink: 0 }}>
            <p style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-4)", fontWeight: 600, margin: 0 }}>
              Chapter notes {annotations.filter(a => !!a.content).length > 0 ? `(${annotations.filter(a => !!a.content).length})` : ""}
            </p>
          </div>
          {annotations.filter(a => !!a.content).length === 0 ? (
            <div style={{ padding: 24, textAlign: "center" }}>
              <StickyNote size={22} style={{ color: "var(--ink-4)", margin: "0 auto 8px", display: "block" }} />
              <p style={{ fontSize: 12.5, color: "var(--ink-4)", margin: 0, lineHeight: 1.55 }}>
                No notes yet. Click a verse to add one.
              </p>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: "auto" }}>
              {annotations.filter(a => !!a.content).map(ann => (
                <SidebarAnnotationCard
                  key={ann.id}
                  annotation={ann}
                  currentUid={user?.uid ?? ""}
                  isAdmin={isAdmin}
                  onLike={() => handleLike(ann.id)}
                  onDelete={() => handleDelete(ann.id)}
                  onSelect={() => { setBookId(ann.verseRef.bookId); setChapter(ann.verseRef.chapter); setSelectedVerse(ann.verseRef.verse ?? null); }}
                />
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ── Annotation card (inline in verse panel) ───────────────────────────────────

function AnnotationCard({
  annotation: ann, currentUid, isAdmin, isLast,
  replyOpen, replyText, replying,
  onLike, onDelete, onToggleReply, onReplyChange, onReplySubmit,
}: {
  annotation: Annotation;
  currentUid: string;
  isAdmin: boolean;
  isLast: boolean;
  replyOpen: boolean;
  replyText: string;
  replying: boolean;
  onLike: () => void;
  onDelete: () => void;
  onToggleReply: () => void;
  onReplyChange: (v: string) => void;
  onReplySubmit: () => void;
}) {
  const isOwn = ann.userId === currentUid;
  const liked = ann.likes.includes(currentUid);

  return (
    <div style={{ borderBottom: isLast ? "none" : "1px solid var(--hairline)", padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
        <Avatar name={ann.username} photoURL={ann.photoURL} size={24} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-1)" }}>@{ann.username}</span>
            <TypeBadge type={ann.type} />
            <span style={{ fontSize: 11, color: "var(--ink-4)", marginLeft: "auto" }}>
              {ann.createdAt ? timeAgo(ann.createdAt instanceof Date ? ann.createdAt : (ann.createdAt as { toDate?: () => Date }).toDate?.() ?? new Date()) : ""}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "4px 0 0", lineHeight: 1.55 }}>{ann.content}</p>
        </div>
        {(isOwn || isAdmin) && (
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="btn-ghost btn-sm" style={{ padding: "0 4px", color: "var(--ink-4)" }}>
            <Trash2 size={12} />
          </button>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 32 }}>
        <button
          onClick={e => { e.stopPropagation(); onLike(); }}
          style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: liked ? "oklch(57.7% 0.245 27.3)" : "var(--ink-4)", padding: 0, fontFamily: "var(--font-ui)" }}
        >
          <Heart size={12} fill={liked ? "currentColor" : "none"} />
          {ann.likes.length > 0 && ann.likes.length}
        </button>
        <button
          onClick={e => { e.stopPropagation(); onToggleReply(); }}
          style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--ink-4)", padding: 0, fontFamily: "var(--font-ui)" }}
        >
          <MessageSquare size={12} />
          {ann.replies.length > 0 && ann.replies.length}
        </button>
      </div>

      {/* Existing replies */}
      {ann.replies.length > 0 && (
        <div style={{ marginLeft: 32, marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          {ann.replies.map(r => (
            <div key={r.id} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
              <Avatar name={r.username} photoURL={r.photoURL} size={20} />
              <div style={{ background: "var(--paper-2)", borderRadius: 8, padding: "5px 10px", flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-1)" }}>@{r.username} </span>
                <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{r.content}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply composer */}
      {replyOpen && (
        <div style={{ marginLeft: 32, marginTop: 8, display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
          <input
            value={replyText}
            onChange={e => onReplyChange(e.target.value)}
            placeholder="Reply…"
            className="input-field"
            style={{ flex: 1, height: 30, fontSize: 12.5 }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onReplySubmit(); } }}
            autoFocus
          />
          <button
            onClick={onReplySubmit}
            disabled={!replyText.trim() || replying}
            className="btn-primary btn-sm"
          >
            {replying ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sidebar annotation card (desktop right panel) ─────────────────────────────

function SidebarAnnotationCard({
  annotation: ann, currentUid, isAdmin, onLike, onDelete, onSelect,
}: {
  annotation: Annotation;
  currentUid: string;
  isAdmin: boolean;
  onLike: () => void;
  onDelete: () => void;
  onSelect: () => void;
}) {
  const isOwn = ann.userId === currentUid;
  const liked = ann.likes.includes(currentUid);

  return (
    <div
      onClick={onSelect}
      style={{
        padding: "12px 14px", borderBottom: "1px solid var(--hairline)",
        cursor: "pointer", transition: "background 80ms",
      }}
      className="hover:bg-[var(--paper-3)]"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <Avatar name={ann.username} photoURL={ann.photoURL} size={20} />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-1)" }}>@{ann.username}</span>
        <TypeBadge type={ann.type} />
        <span style={{ fontSize: 10.5, color: "var(--ink-4)", marginLeft: "auto" }}>
          v.{ann.verseRef.verse}
        </span>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: "0 0 6px", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
        {ann.content}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={e => { e.stopPropagation(); onLike(); }}
          style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 11, color: liked ? "oklch(57.7% 0.245 27.3)" : "var(--ink-4)", padding: 0, fontFamily: "var(--font-ui)" }}
        >
          <Heart size={11} fill={liked ? "currentColor" : "none"} />
          {ann.likes.length > 0 && ann.likes.length}
        </button>
        {ann.replies.length > 0 && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--ink-4)" }}>
            <MessageSquare size={11} /> {ann.replies.length}
          </span>
        )}
        {(isOwn || isAdmin) && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--ink-4)", padding: 0 }}
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
}
