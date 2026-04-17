"use client";

import { useState, useMemo } from "react";
import {
  BookOpen, Map, GitBranch, Calendar, Scroll, Lightbulb,
  Search, Bookmark, ChevronRight, ChevronDown, Info, Users, Clock,
  Globe, Zap
} from "lucide-react";
import { OT_BOOKS_CONTEXT } from "@/lib/context-data";
import type { OTBookContext, MapLocation, GenealogyNode, KeyEvent, CulturalNote } from "@/lib/context-types";

// ─── helpers ────────────────────────────────────────────────────────────────

const SECTION_IDS = [
  "overview", "author", "timePeriod", "historicalSetting",
  "map", "genealogy", "keyEvents", "culturalNotes",
] as const;
type SectionId = typeof SECTION_IDS[number];

const SECTION_LABELS: Record<SectionId, string> = {
  overview: "Overview",
  author: "Author Info",
  timePeriod: "Time Period",
  historicalSetting: "Historical Setting",
  map: "Map",
  genealogy: "Family Trees",
  keyEvents: "Key Events",
  culturalNotes: "Cultural Notes",
};

const SECTION_ICONS: Record<SectionId, React.FC<{ className?: string }>> = {
  overview: BookOpen,
  author: Users,
  timePeriod: Clock,
  historicalSetting: Globe,
  map: Map,
  genealogy: GitBranch,
  keyEvents: Calendar,
  culturalNotes: Scroll,
};

// ─── sub-components ─────────────────────────────────────────────────────────

function SvgMap({ locations }: { locations: MapLocation[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const typeColors: Record<MapLocation["type"], string> = {
    city: "#3b82f6",
    region: "#10b981",
    journey: "#f59e0b",
    battle: "#ef4444",
    exile: "#8b5cf6",
  };

  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox="0 0 400 300" className="w-full max-w-2xl mx-auto border border-white/10 rounded-lg bg-slate-900">
        {/* basic geography shapes */}
        <ellipse cx="160" cy="165" rx="30" ry="40" fill="#1e3a5f" opacity="0.5" />
        <ellipse cx="175" cy="175" rx="18" ry="12" fill="#1e3a5f" opacity="0.4" />
        <rect x="265" y="160" width="40" height="30" rx="4" fill="#1e3a5f" opacity="0.4" />
        <path d="M130 130 Q160 90 200 110 Q250 100 280 140 Q300 160 295 190 Q270 220 240 215 Q200 220 170 210 Q140 200 130 180 Z" fill="#1e4a3a" opacity="0.3" />
        {/* Nile */}
        <path d="M140 250 Q130 230 125 200 Q120 180 115 165 Q110 150 118 135" stroke="#3b82f6" strokeWidth="1.5" fill="none" opacity="0.4" />
        {/* Mediterranean */}
        <rect x="100" y="110" width="200" height="20" rx="2" fill="#1a4070" opacity="0.3" />

        {locations.map((loc) => {
          const color = typeColors[loc.type];
          const isHov = hovered === loc.name;
          return (
            <g key={loc.name} onMouseEnter={() => setHovered(loc.name)} onMouseLeave={() => setHovered(null)}>
              <circle cx={loc.svgX} cy={loc.svgY} r={isHov ? 7 : 5} fill={color} opacity={0.85} className="cursor-pointer transition-all" />
              <text
                x={loc.svgX + 7}
                y={loc.svgY + 4}
                fontSize="7"
                fill="#e2e8f0"
                className="pointer-events-none select-none"
              >
                {loc.name}
              </text>
            </g>
          );
        })}
        {hovered && (() => {
          const loc = locations.find(l => l.name === hovered);
          if (!loc) return null;
          return (
            <g>
              <rect x={loc.svgX - 40} y={loc.svgY - 30} width="120" height="22" rx="3" fill="#1e293b" opacity="0.95" />
              <text x={loc.svgX - 36} y={loc.svgY - 15} fontSize="7" fill="#94a3b8">{loc.description}</text>
            </g>
          );
        })()}
      </svg>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
        {Object.entries(typeColors).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1 capitalize">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            {type}
          </span>
        ))}
      </div>
    </div>
  );
}

function GenealogyTree({ nodes }: { nodes: GenealogyNode[] }) {
  const roots = nodes.filter(n => !n.parentId);
  const childrenOf = (id: string) => nodes.filter(n => n.parentId === id);

  function renderNode(node: GenealogyNode, depth = 0): React.ReactNode {
    const children = childrenOf(node.id);
    return (
      <div key={node.id} className="flex flex-col items-start">
        <div className="flex items-center gap-2">
          {depth > 0 && <span className="text-slate-600 ml-2 select-none">└─</span>}
          <div
            className="px-3 py-1.5 rounded-md text-sm font-medium border"
            style={{ marginLeft: depth * 16 }}
          >
            <span className="text-slate-200">{node.name}</span>
            {node.notes && <span className="text-slate-500 text-xs ml-2">({node.notes})</span>}
          </div>
        </div>
        {children.length > 0 && (
          <div className="ml-4 mt-1 border-l border-slate-700 pl-2">
            {children.map(c => renderNode(c, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {roots.map(r => renderNode(r))}
    </div>
  );
}

function Timeline({ events }: { events: KeyEvent[] }) {
  return (
    <ol className="relative border-l border-slate-700 ml-3 space-y-6">
      {events.map((ev) => (
        <li key={ev.order} className="ml-6">
          <span className="absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full bg-blue-900 border border-blue-500 text-blue-300 text-xs font-bold">
            {ev.order}
          </span>
          <div>
            <p className="font-semibold text-slate-200 text-sm">{ev.title}</p>
            <p className="text-slate-400 text-xs mt-0.5">{ev.description}</p>
            <p className="text-blue-400 text-xs mt-0.5 italic">{ev.reference}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

const CULTURAL_COLORS: Record<CulturalNote["category"], string> = {
  customs: "bg-amber-900/40 border-amber-700 text-amber-300",
  law: "bg-blue-900/40 border-blue-700 text-blue-300",
  worship: "bg-purple-900/40 border-purple-700 text-purple-300",
  social: "bg-green-900/40 border-green-700 text-green-300",
  geography: "bg-teal-900/40 border-teal-700 text-teal-300",
};

// ─── main page ───────────────────────────────────────────────────────────────

export default function ContextPage() {
  const [selectedId, setSelectedId] = useState<string>(OT_BOOKS_CONTEXT[0]?.id ?? "GEN");
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [search, setSearch] = useState("");
  const [deepStudy, setDeepStudy] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(new Set(["overview"]));

  const book = useMemo(() => OT_BOOKS_CONTEXT.find(b => b.id === selectedId), [selectedId]);

  const filteredBooks = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return OT_BOOKS_CONTEXT;
    return OT_BOOKS_CONTEXT.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.overview.shortSummary.toLowerCase().includes(q)
    );
  }, [search]);

  const toggleBookmark = (id: string) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSection = (s: SectionId) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  if (!book) return <div className="p-8 text-slate-400">No books found.</div>;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* ── sidebar ── */}
      <aside className="w-56 flex-shrink-0 border-r border-white/10 flex flex-col bg-slate-900 overflow-hidden">
        <div className="p-3 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search books…"
              className="w-full bg-slate-800 rounded-md py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto py-1">
          {filteredBooks.map(b => (
            <li key={b.id}>
              <button
                onClick={() => { setSelectedId(b.id); setActiveSection("overview"); }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors
                  ${b.id === selectedId ? "bg-blue-600/20 text-blue-300" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
              >
                <span className="truncate">{b.name}</span>
                {bookmarks.has(b.id) && <Bookmark className="h-3 w-3 text-amber-400 flex-shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* ── main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-slate-900">
          <div>
            <h1 className="text-xl font-bold text-slate-100">{book.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{book.overview.shortSummary}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* quick/deep toggle */}
            <button
              onClick={() => setDeepStudy(d => !d)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                ${deepStudy
                  ? "border-purple-500 bg-purple-900/40 text-purple-300"
                  : "border-slate-600 bg-slate-800 text-slate-400 hover:text-slate-200"}`}
            >
              <Zap className="h-3 w-3" />
              {deepStudy ? "Deep Study" : "Quick Facts"}
            </button>
            {/* bookmark */}
            <button
              onClick={() => toggleBookmark(book.id)}
              className={`p-1.5 rounded-md transition-colors ${bookmarks.has(book.id) ? "text-amber-400" : "text-slate-500 hover:text-slate-300"}`}
            >
              <Bookmark className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* section nav */}
          <nav className="w-40 flex-shrink-0 border-r border-white/10 bg-slate-900/60 overflow-y-auto py-2">
            {SECTION_IDS.map(s => {
              const Icon = SECTION_ICONS[s];
              return (
                <button
                  key={s}
                  onClick={() => setActiveSection(s)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors
                    ${activeSection === s
                      ? "bg-blue-600/20 text-blue-300 border-l-2 border-blue-500"
                      : "text-slate-500 hover:bg-white/5 hover:text-slate-300"}`}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  {SECTION_LABELS[s]}
                </button>
              );
            })}
          </nav>

          {/* section content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeSection === "overview" && (
              <div className="space-y-6 max-w-3xl">
                <p className="text-slate-300 leading-relaxed">
                  {deepStudy ? book.overview.fullSummary : book.overview.shortSummary}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-white/10 bg-slate-900 p-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Themes</h3>
                    <ul className="space-y-1">
                      {book.overview.themes.map(t => (
                        <li key={t} className="flex items-start gap-2 text-sm text-slate-300">
                          <ChevronRight className="h-3.5 w-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-900 p-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Key Messages</h3>
                    <ul className="space-y-1">
                      {book.overview.keyMessages.map(m => (
                        <li key={m} className="flex items-start gap-2 text-sm text-slate-300">
                          <ChevronRight className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {/* Did You Know */}
                <div className="rounded-lg border border-amber-700/40 bg-amber-900/10 p-4">
                  <h3 className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wide mb-3">
                    <Lightbulb className="h-3.5 w-3.5" /> Did You Know?
                  </h3>
                  <ul className="space-y-2">
                    {book.didYouKnow.map((fact, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-amber-100/80">
                        <span className="text-amber-500 font-bold">{i + 1}.</span>
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeSection === "author" && (
              <div className="max-w-2xl space-y-4">
                <div className="rounded-lg border border-white/10 bg-slate-900 p-5">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Traditional Author</h3>
                  <p className="text-lg font-bold text-slate-200">{book.author.traditional}</p>
                  {deepStudy && (
                    <p className="text-slate-400 text-sm mt-2 leading-relaxed">{book.author.notes}</p>
                  )}
                  {!deepStudy && (
                    <p className="text-slate-500 text-xs mt-1">{book.author.notes}</p>
                  )}
                </div>
              </div>
            )}

            {activeSection === "timePeriod" && (
              <div className="max-w-2xl space-y-4">
                {(([
                  ["Events Date", book.timePeriod.eventsDate],
                  ["Writing Date", book.timePeriod.writingDate],
                  ["Biblical Placement", book.timePeriod.biblicalPlacement],
                  ...(deepStudy ? [["Relation to Events", book.timePeriod.relationToEvents]] : []),
                ] as [string, string][])).map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-white/10 bg-slate-900 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
                    <p className="text-slate-200 text-sm mt-1">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {activeSection === "historicalSetting" && (
              <div className="max-w-2xl space-y-4">
                {book.historicalSetting.rulers.length > 0 && (
                  <Section title="Key Rulers">
                    {book.historicalSetting.rulers.map(r => <Chip key={r} label={r} />)}
                  </Section>
                )}
                {book.historicalSetting.israelKings.length > 0 && (
                  <Section title="Israel / Judah Kings">
                    {book.historicalSetting.israelKings.map(k => <Chip key={k} label={k} color="purple" />)}
                  </Section>
                )}
                {book.historicalSetting.neighboringPowers.length > 0 && (
                  <Section title="Neighboring Powers">
                    {book.historicalSetting.neighboringPowers.map(p => <Chip key={p} label={p} color="red" />)}
                  </Section>
                )}
                {deepStudy && (
                  <div className="rounded-lg border border-white/10 bg-slate-900 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Political Background</p>
                    <p className="text-slate-300 text-sm leading-relaxed">{book.historicalSetting.politicalBackground}</p>
                  </div>
                )}
              </div>
            )}

            {activeSection === "map" && (
              <div className="max-w-2xl space-y-4">
                {book.mapLocations.length > 0 ? (
                  <>
                    <SvgMap locations={book.mapLocations} />
                    {deepStudy && (
                      <ul className="space-y-2 mt-2">
                        {book.mapLocations.map(loc => (
                          <li key={loc.name} className="flex items-start gap-3 text-sm">
                            <span className="font-semibold text-slate-300 w-40 flex-shrink-0">{loc.name}</span>
                            <span className="text-slate-400">{loc.description}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <EmptyState message="No map locations recorded for this book." />
                )}
              </div>
            )}

            {activeSection === "genealogy" && (
              <div className="max-w-2xl space-y-4">
                {book.genealogy.description && (
                  <p className="text-slate-400 text-sm italic">{book.genealogy.description}</p>
                )}
                {book.genealogy.nodes.length > 0 ? (
                  <GenealogyTree nodes={book.genealogy.nodes} />
                ) : (
                  <EmptyState message="No genealogy data recorded for this book." />
                )}
              </div>
            )}

            {activeSection === "keyEvents" && (
              <div className="max-w-2xl">
                <Timeline events={book.keyEvents} />
              </div>
            )}

            {activeSection === "culturalNotes" && (
              <div className="max-w-2xl space-y-3">
                {book.culturalNotes.map((note, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-4 ${CULTURAL_COLORS[note.category]}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm">{note.title}</p>
                      <span className="text-xs capitalize opacity-70 px-2 py-0.5 rounded-full bg-white/10">{note.category}</span>
                    </div>
                    <p className="text-sm opacity-80 leading-relaxed">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── small helpers ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900 p-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ label, color = "blue" }: { label: string; color?: "blue" | "purple" | "red" }) {
  const cls = {
    blue: "bg-blue-900/40 border-blue-700 text-blue-300",
    purple: "bg-purple-900/40 border-purple-700 text-purple-300",
    red: "bg-red-900/40 border-red-700 text-red-300",
  }[color];
  return <span className={`px-2 py-0.5 rounded-full text-xs border ${cls}`}>{label}</span>;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-600">
      <Info className="h-8 w-8 mb-2" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
