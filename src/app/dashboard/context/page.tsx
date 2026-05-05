"use client";

import { useState, useMemo } from "react";
import {
  BookOpen, GitBranch, Calendar, Scroll, Lightbulb,
  Search, Bookmark, ChevronRight, Info, Users, Clock,
  Globe, Zap,
} from "lucide-react";
import { OT_BOOKS_CONTEXT, NT_BOOKS_CONTEXT, ALL_BOOKS_CONTEXT } from "@/lib/context-data";
import type { GenealogyNode, KeyEvent, CulturalNote } from "@/lib/context-types";

// ─── section config ───────────────────────────────────────────────────────────

const SECTION_IDS = [
  "overview", "author", "timePeriod", "historicalSetting",
  "genealogy", "keyEvents", "culturalNotes",
] as const;
type SectionId = typeof SECTION_IDS[number];

const SECTION_LABELS: Record<SectionId, string> = {
  overview:          "Overview",
  author:            "Author",
  timePeriod:        "Time Period",
  historicalSetting: "Historical Setting",
  genealogy:         "Family Trees",
  keyEvents:         "Key Events",
  culturalNotes:     "Cultural Notes",
};

const SECTION_ICONS: Record<SectionId, React.FC<{ size?: number }>> = {
  overview:          BookOpen,
  author:            Users,
  timePeriod:        Clock,
  historicalSetting: Globe,
  genealogy:         GitBranch,
  keyEvents:         Calendar,
  culturalNotes:     Scroll,
};

// ─── cultural note category → app highlight token ────────────────────────────

const CULTURAL_BG: Record<CulturalNote["category"], string> = {
  customs:   "var(--hl-yellow)",
  law:       "var(--hl-blue)",
  worship:   "var(--hl-pink)",
  social:    "var(--hl-green)",
  geography: "var(--hl-orange)",
};

const CULTURAL_BORDER: Record<CulturalNote["category"], string> = {
  customs:   "var(--hl-yellow-border)",
  law:       "var(--hl-blue-border)",
  worship:   "var(--hl-pink-border)",
  social:    "var(--hl-green-border)",
  geography: "var(--hl-orange-border)",
};

// ─── sub-components ───────────────────────────────────────────────────────────

function GenealogyTree({ nodes }: { nodes: GenealogyNode[] }) {
  const roots = nodes.filter(n => !n.parentId);
  const childrenOf = (id: string) => nodes.filter(n => n.parentId === id);

  function renderNode(node: GenealogyNode, depth = 0): React.ReactNode {
    const kids = childrenOf(node.id);
    return (
      <div key={node.id} style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {depth > 0 && (
            <span style={{ color: "var(--ink-4)", marginLeft: 8, fontFamily: "monospace", fontSize: 12 }}>└─</span>
          )}
          <div style={{
            marginLeft: depth * 16,
            padding: "4px 10px",
            borderRadius: 6,
            border: "1px solid var(--hairline)",
            background: "var(--paper-2)",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 13, color: "var(--ink-1)", fontWeight: 450 }}>{node.name}</span>
            {node.notes && (
              <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>({node.notes})</span>
            )}
          </div>
        </div>
        {kids.length > 0 && (
          <div style={{ marginLeft: 16, marginTop: 4, paddingLeft: 8, borderLeft: "1px solid var(--hairline)" }}>
            {kids.map(c => renderNode(c, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{roots.map(r => renderNode(r))}</div>;
}

function Timeline({ events }: { events: KeyEvent[] }) {
  return (
    <ol style={{ position: "relative", borderLeft: "1px solid var(--hairline)", marginLeft: 10, display: "flex", flexDirection: "column", gap: 20, listStyle: "none", padding: 0 }}>
      {events.map(ev => (
        <li key={ev.order} style={{ marginLeft: 20, position: "relative" }}>
          <span style={{
            position: "absolute", left: -30, top: 1,
            width: 20, height: 20, borderRadius: "50%",
            background: "var(--accent-soft)",
            border: "1px solid var(--accent-border)",
            color: "var(--accent-ink)",
            display: "grid", placeItems: "center",
            fontSize: 10.5, fontWeight: 600,
          }}>
            {ev.order}
          </span>
          <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-1)", margin: "0 0 2px" }}>{ev.title}</p>
          <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: "0 0 2px", lineHeight: 1.5 }}>{ev.description}</p>
          <p style={{ fontSize: 12, color: "var(--accent-ink)", margin: 0, fontStyle: "italic" }}>{ev.reference}</p>
        </li>
      ))}
    </ol>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ padding: "14px 16px" }}>
      <div className="card-label" style={{ marginBottom: 4 }}>{label}</div>
      <p style={{ fontSize: 13.5, color: "var(--ink-1)", margin: 0, lineHeight: 1.55 }}>{value}</p>
    </div>
  );
}

function TagGroup({ title, items, color = "default" }: { title: string; items: string[]; color?: "default" | "accent" | "warm" }) {
  const badgeCls = color === "accent" ? "badge-accent" : "badge";
  return (
    <div className="card" style={{ padding: "14px 16px" }}>
      <div className="card-label">{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items.map(item => (
          <span key={item} className={badgeCls} style={
            color === "warm"
              ? { background: "var(--hl-yellow)", color: "var(--ink-2)", borderColor: "var(--hl-yellow-border)" }
              : undefined
          }>{item}</span>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", color: "var(--ink-4)" }}>
      <Info size={28} style={{ marginBottom: 10 }} />
      <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>{message}</p>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function ContextPage() {
  const [selectedId, setSelectedId]     = useState<string>(OT_BOOKS_CONTEXT[0]?.id ?? "GEN");
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [search, setSearch]             = useState("");
  const [deepStudy, setDeepStudy]       = useState(false);
  const [bookmarks, setBookmarks]       = useState<Set<string>>(new Set());

  const book = useMemo(() => ALL_BOOKS_CONTEXT.find(b => b.id === selectedId), [selectedId]);

  const filteredOT = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? OT_BOOKS_CONTEXT : OT_BOOKS_CONTEXT.filter(b =>
      b.name.toLowerCase().includes(q) || b.overview.shortSummary.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredNT = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? NT_BOOKS_CONTEXT : NT_BOOKS_CONTEXT.filter(b =>
      b.name.toLowerCase().includes(q) || b.overview.shortSummary.toLowerCase().includes(q)
    );
  }, [search]);

  function toggleBookmark(id: string) {
    setBookmarks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectBook(id: string) {
    setSelectedId(id);
    setActiveSection("overview");
  }

  if (!book) return (
    <div style={{ padding: 32, color: "var(--ink-3)", fontSize: 13 }}>No books found.</div>
  );

  return (
    <div style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden", background: "var(--paper)" }}>

      {/* ── Book sidebar (hidden on mobile) ── */}
      <aside className="ctx-aside">
        {/* Search */}
        <div style={{ padding: "12px 12px 8px", borderBottom: "1px solid var(--hairline)" }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", pointerEvents: "none" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search books…"
              className="input-field"
              style={{ paddingLeft: 28, height: 30, fontSize: 12.5 }}
            />
          </div>
        </div>

        {/* Book list */}
        <ul style={{ flex: 1, overflowY: "auto", padding: "6px 8px", margin: 0, listStyle: "none" }}>
          {filteredOT.length > 0 && (
            <>
              <li style={{ padding: "10px 6px 4px", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-4)" }}>
                Old Testament
              </li>
              {filteredOT.map(b => (
                <li key={b.id}>
                  <button
                    onClick={() => selectBook(b.id)}
                    className={`nav-item w-full${b.id === selectedId ? " active" : ""}`}
                    style={{ width: "100%", justifyContent: "space-between", padding: "6px 8px" }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span>
                    {bookmarks.has(b.id) && <Bookmark size={11} style={{ flexShrink: 0, color: "var(--accent-ink)" }} />}
                  </button>
                </li>
              ))}
            </>
          )}
          {filteredNT.length > 0 && (
            <>
              <li style={{ padding: "10px 6px 4px", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-4)", marginTop: 4 }}>
                New Testament
              </li>
              {filteredNT.map(b => (
                <li key={b.id}>
                  <button
                    onClick={() => selectBook(b.id)}
                    className={`nav-item${b.id === selectedId ? " active" : ""}`}
                    style={{ width: "100%", justifyContent: "space-between", padding: "6px 8px" }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span>
                    {bookmarks.has(b.id) && <Bookmark size={11} style={{ flexShrink: 0, color: "var(--accent-ink)" }} />}
                  </button>
                </li>
              ))}
            </>
          )}
          {filteredOT.length === 0 && filteredNT.length === 0 && (
            <li style={{ padding: "24px 8px", textAlign: "center", fontSize: 12.5, color: "var(--ink-4)" }}>
              No books match &ldquo;{search}&rdquo;
            </li>
          )}
        </ul>
      </aside>

      {/* ── Main panel ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Mobile book selector */}
        <div className="ctx-mobile-book-bar">
          <label>Book:</label>
          <select value={selectedId} onChange={e => selectBook(e.target.value)}>
            <optgroup label="Old Testament">
              {OT_BOOKS_CONTEXT.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </optgroup>
            <optgroup label="New Testament">
              {NT_BOOKS_CONTEXT.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </optgroup>
          </select>
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", height: 56, flexShrink: 0,
          borderBottom: "1px solid var(--hairline)",
          background: "var(--paper)",
        }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 16, fontWeight: 600, color: "var(--ink-1)", margin: 0, letterSpacing: "-0.01em" }}>
              {book.name}
            </h1>
            <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 480 }}>
              {book.overview.shortSummary}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => setDeepStudy(d => !d)}
              className={deepStudy ? "btn-primary btn-sm" : "btn btn-sm"}
            >
              <Zap size={12} />
              {deepStudy ? "Deep Study" : "Quick Facts"}
            </button>
            <button
              onClick={() => toggleBookmark(book.id)}
              className="btn-ghost btn-sm"
              title={bookmarks.has(book.id) ? "Remove bookmark" : "Bookmark"}
              style={{ color: bookmarks.has(book.id) ? "var(--accent-ink)" : undefined }}
            >
              <Bookmark size={14} />
            </button>
          </div>
        </div>

        {/* Content split */}
        <div className="ctx-content-split">

          {/* Section nav (vertical on desktop, horizontal scroll on mobile) */}
          <nav className="ctx-secnav">
            {SECTION_IDS.map(s => {
              const Icon = SECTION_ICONS[s];
              return (
                <button
                  key={s}
                  onClick={() => setActiveSection(s)}
                  className={`nav-item ctx-secnav-btn${activeSection === s ? " active" : ""}`}
                  style={{ fontSize: 12.5, gap: 7, padding: "6px 8px" }}
                >
                  <Icon size={13} />
                  {SECTION_LABELS[s]}
                </button>
              );
            })}
          </nav>

          {/* Section content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
            <div style={{ maxWidth: 680 }}>

              {/* ── Overview ── */}
              {activeSection === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.7, margin: 0 }}>
                    {deepStudy ? book.overview.fullSummary : book.overview.shortSummary}
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div className="card" style={{ padding: "14px 16px" }}>
                      <div className="card-label">Themes</div>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                        {book.overview.themes.map(t => (
                          <li key={t} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 13, color: "var(--ink-2)" }}>
                            <ChevronRight size={13} style={{ flexShrink: 0, marginTop: 2, color: "var(--accent-btn)" }} />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="card" style={{ padding: "14px 16px" }}>
                      <div className="card-label">Key Messages</div>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                        {book.overview.keyMessages.map(m => (
                          <li key={m} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 13, color: "var(--ink-2)" }}>
                            <ChevronRight size={13} style={{ flexShrink: 0, marginTop: 2, color: "var(--accent-btn)" }} />
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="card" style={{ padding: "14px 16px", background: "var(--accent-soft)", borderColor: "var(--accent-border)" }}>
                    <div className="card-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Lightbulb size={12} /> Did You Know?
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                      {book.didYouKnow.map((fact, i) => (
                        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
                          <span style={{ color: "var(--accent-ink)", fontWeight: 600, flexShrink: 0, minWidth: 14 }}>{i + 1}.</span>
                          {fact}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* ── Author ── */}
              {activeSection === "author" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div className="card" style={{ padding: "16px 18px" }}>
                    <div className="card-label">Traditional Author</div>
                    <p style={{ fontSize: 17, fontWeight: 600, color: "var(--ink-1)", margin: "0 0 8px", fontFamily: "var(--font-serif)" }}>
                      {book.author.traditional}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0, lineHeight: 1.6 }}>{book.author.notes}</p>
                  </div>
                </div>
              )}

              {/* ── Time Period ── */}
              {activeSection === "timePeriod" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <InfoRow label="Events Date"       value={book.timePeriod.eventsDate} />
                  <InfoRow label="Writing Date"      value={book.timePeriod.writingDate} />
                  <InfoRow label="Biblical Placement" value={book.timePeriod.biblicalPlacement} />
                  {deepStudy && <InfoRow label="Relation to Events" value={book.timePeriod.relationToEvents} />}
                </div>
              )}

              {/* ── Historical Setting ── */}
              {activeSection === "historicalSetting" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {book.historicalSetting.rulers.length > 0 && (
                    <TagGroup title="Key Rulers" items={book.historicalSetting.rulers} />
                  )}
                  {book.historicalSetting.israelKings.length > 0 && (
                    <TagGroup title="Israel / Judah Kings" items={book.historicalSetting.israelKings} color="accent" />
                  )}
                  {book.historicalSetting.neighboringPowers.length > 0 && (
                    <TagGroup title="Neighboring Powers" items={book.historicalSetting.neighboringPowers} color="warm" />
                  )}
                  {deepStudy && (
                    <InfoRow label="Political Background" value={book.historicalSetting.politicalBackground} />
                  )}
                </div>
              )}

              {/* ── Genealogy ── */}
              {activeSection === "genealogy" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {book.genealogy.description && (
                    <p style={{ fontSize: 13, color: "var(--ink-3)", fontStyle: "italic", margin: 0 }}>
                      {book.genealogy.description}
                    </p>
                  )}
                  {book.genealogy.nodes.length > 0
                    ? <GenealogyTree nodes={book.genealogy.nodes} />
                    : <EmptyState message="No genealogy data recorded for this book." />
                  }
                </div>
              )}

              {/* ── Key Events ── */}
              {activeSection === "keyEvents" && (
                <Timeline events={book.keyEvents} />
              )}

              {/* ── Cultural Notes ── */}
              {activeSection === "culturalNotes" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {book.culturalNotes.map((note, i) => (
                    <div key={i} style={{
                      borderRadius: 10,
                      border: `1px solid ${CULTURAL_BORDER[note.category]}`,
                      background: CULTURAL_BG[note.category],
                      padding: "14px 16px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-1)", margin: 0 }}>{note.title}</p>
                        <span className="badge" style={{ textTransform: "capitalize", fontSize: 11, background: "var(--paper)", borderColor: CULTURAL_BORDER[note.category] }}>{note.category}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0, lineHeight: 1.6 }}>{note.content}</p>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
