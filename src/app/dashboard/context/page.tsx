"use client";

import { useState, useMemo, useCallback } from "react";
import {
  BookOpen, GitBranch, Calendar, Scroll, Lightbulb,
  Search, Bookmark, ChevronRight, Info, Users, Clock,
  Globe, Zap, X, ChevronDown,
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

// ─── character bio / tag data ─────────────────────────────────────────────────

interface CharInfo { bio: string; role: string; tags: string[]; lifespan?: string; knownFor: string }

const CHAR_INFO: Record<string, CharInfo> = {
  adam:     { bio: "The first man created by God from the dust of the ground. He lived in the Garden of Eden with Eve until they ate from the forbidden tree and were exiled.", role: "First Human", tags: ["Patriarch"], lifespan: "930 years", knownFor: "First man; the Fall of humanity (Gen 2–3)" },
  seth:     { bio: "Third son of Adam and Eve, born after Abel was killed. He carried on the faithful line that would lead to Noah.", role: "Son of Adam", tags: ["Patriarch"], lifespan: "912 years", knownFor: "Ancestor of the faithful line from Adam to Noah (Gen 5)" },
  noah:     { bio: "A righteous man in a corrupt generation, chosen by God to build the ark and preserve life through the great flood.", role: "Builder of the Ark", tags: ["Patriarch"], lifespan: "950 years", knownFor: "Built the ark; survived the Great Flood; received God's rainbow covenant (Gen 6–9)" },
  shem:     { bio: "Eldest son of Noah, one of three sons who survived the flood. Ancestor of the Semitic peoples and eventually Abraham.", role: "Son of Noah", tags: ["Patriarch"], lifespan: "600 years", knownFor: "Ancestor of the Semitic peoples including the line to Abraham" },
  abraham:  { bio: "Called by God to leave Ur of the Chaldeans. Received the covenant of circumcision and the miraculous promise of a son in old age.", role: "Father of the Faith", tags: ["Patriarch"], lifespan: "175 years", knownFor: "Father of Isaac; covenant with God; father of many nations (Gen 12–25)" },
  isaac:    { bio: "Son of Abraham and Sarah, born miraculously in their old age. Nearly sacrificed by Abraham but spared when God provided a ram.", role: "Son of Promise", tags: ["Patriarch"], lifespan: "180 years", knownFor: "Child of promise; nearly sacrificed; father of Jacob and Esau (Gen 21–35)" },
  ishmael:  { bio: "Son of Abraham by Hagar, Sarah's servant. Blessed by God and became the father of 12 princes, ancestors of Arab nations.", role: "Son of Abraham", tags: ["Patriarch"], knownFor: "Ancestor of 12 Arab tribes; blessed by God (Gen 16–17, 21)" },
  jacob:    { bio: "Twin brother of Esau who received the birthright. Wrestled with God at Penuel and was renamed Israel. Father of 12 sons who became the 12 tribes.", role: "Father of Israel", tags: ["Patriarch"], lifespan: "147 years", knownFor: "Renamed Israel; father of the 12 tribes (Gen 25–50)" },
  esau:     { bio: "Twin brother of Jacob who sold his birthright for a bowl of stew. Later reconciled with Jacob. Ancestor of the Edomites.", role: "Brother of Jacob", tags: ["Patriarch"], knownFor: "Sold his birthright; ancestor of the Edomites (Gen 25–36)" },
  joseph:   { bio: "Favored son of Jacob, sold into slavery by jealous brothers. Rose to become second-in-command of Egypt and ultimately saved his family from famine.", role: "Ruler of Egypt", tags: ["Patriarch"], lifespan: "110 years", knownFor: "Sold into slavery; interpreted Pharaoh's dreams; saved Israel from famine (Gen 37–50)" },
  judah:    { bio: "Fourth son of Jacob who offered himself as a substitute for Benjamin. Ancestor of King David and the Messianic line.", role: "Ancestor of David", tags: ["Patriarch"], knownFor: "Ancestor of the Davidic and Messianic line (Gen 38; Matt 1)" },
  levi:     { bio: "Third son of Jacob, ancestor of the priestly tribe of Israel. Moses and Aaron were descendants.", role: "Ancestor of Priests", tags: ["Patriarch"], knownFor: "Priestly line of Israel; ancestor of Moses and Aaron" },
  kohath:   { bio: "Second son of Levi, grandfather of Moses and Aaron. The Kohathites were responsible for carrying the most holy Tabernacle items.", role: "Levite Leader", tags: ["Patriarch", "Levite"], knownFor: "Grandfather of Moses; Kohathites cared for the Ark of the Covenant (Num 4)" },
  amram:    { bio: "Father of Moses, Aaron, and Miriam. A leader of the tribe of Levi who married Jochebed.", role: "Father of Moses", tags: ["Patriarch", "Levite"], lifespan: "137 years", knownFor: "Father of Moses, Aaron, and Miriam (Exo 6:18–20)" },
  moses:    { bio: "Raised in Pharaoh's court, then called at the burning bush to deliver Israel from Egypt. Received the Ten Commandments on Sinai and led 40 years in the wilderness.", role: "Deliverer & Lawgiver", tags: ["Prophet", "Leader"], lifespan: "120 years", knownFor: "Led the Exodus; received the Law; spoke with God face to face (Exo–Deu)" },
  aaron:    { bio: "Elder brother of Moses. Served as spokesman before Pharaoh. Appointed as the first High Priest of Israel.", role: "First High Priest", tags: ["Priest", "Levite"], lifespan: "123 years", knownFor: "First High Priest; spokesman for Moses in Egypt (Exo 4–Lev 9)" },
  miriam:   { bio: "Sister of Moses and Aaron. Led the women in worship after crossing the Red Sea. A prophetess in Israel.", role: "Prophetess", tags: ["Prophet"], knownFor: "Led worship after the Exodus; prophetess alongside Moses and Aaron (Exo 15; Num 12)" },
  nadab:    { bio: "Eldest son of Aaron, killed by God for offering 'unauthorized fire' before the Lord in the Tabernacle.", role: "Son of Aaron", tags: ["Priest", "Levite"], knownFor: "Died for offering unauthorized fire before God (Lev 10:1–2)" },
  abihu:    { bio: "Second son of Aaron, killed alongside Nadab for offering unauthorized fire before the Lord.", role: "Son of Aaron", tags: ["Priest", "Levite"], knownFor: "Died for offering unauthorized fire before God (Lev 10:1–2)" },
  eleazar:  { bio: "Third son of Aaron, succeeded his father as High Priest. Supervised the Levites in Tabernacle service.", role: "High Priest", tags: ["Priest", "Levite"], knownFor: "Succeeded Aaron as High Priest; oversaw Tabernacle worship (Num 20:25–28)" },
  ithamar:  { bio: "Youngest son of Aaron, supervised the Gershonites and Merarites in transporting the Tabernacle.", role: "Levite Priest", tags: ["Priest", "Levite"], knownFor: "Oversaw transport of Tabernacle sections (Num 4:28, 33)" },
  david:    { bio: "A shepherd boy who became Israel's greatest king. United the kingdom, brought the Ark to Jerusalem, and was promised an eternal dynasty pointing to Christ.", role: "King of Israel", tags: ["King", "Prophet"], lifespan: "~70 years", knownFor: "Defeated Goliath; wrote Psalms; ancestor of Jesus Christ (1 Sam 16 – 1 Kgs 2)" },
  solomon:  { bio: "Son of David, famed for God-given wisdom. Built the first Temple in Jerusalem. Later fell into idolatry, leading to the kingdom's division.", role: "King of Israel", tags: ["King"], knownFor: "Built the Temple; wisest king; wrote Proverbs, Ecclesiastes, Song of Solomon (1 Kgs 1–11)" },
  ruth:     { bio: "A Moabite widow who remained loyal to her mother-in-law Naomi. Her faithfulness led to marriage to Boaz, making her a great-grandmother of David.", role: "Faithful Foreigner", tags: ["Ancestor"], knownFor: "Loyalty to Naomi; great-grandmother of King David (Ruth 1–4)" },
  boaz:     { bio: "A wealthy Bethlehemite kinsman-redeemer who married Ruth, preserving the family line through covenant love.", role: "Kinsman-Redeemer", tags: ["Ancestor"], knownFor: "Married Ruth; great-grandfather of David (Ruth 2–4)" },
  jesus:    { bio: "The eternal Son of God incarnate. Born of the Virgin Mary, he fulfilled the Law and Prophets, died on the cross for sin, and rose on the third day.", role: "Son of God", tags: ["Messiah", "Savior"], knownFor: "Death and resurrection for the forgiveness of sins; fulfillment of all prophecy" },
  peter:    { bio: "A fisherman from Galilee, called by Jesus to be an apostle. Confessed Jesus as the Christ and led the early church after Pentecost.", role: "Apostle", tags: ["Apostle", "Disciple"], knownFor: "Preached on Pentecost; first epistle; first pope in Catholic tradition (Matt 4; Acts 2)" },
  paul:     { bio: "Born as Saul of Tarsus, a Pharisee who persecuted Christians until a dramatic encounter with the risen Christ on the road to Damascus.", role: "Apostle to Gentiles", tags: ["Apostle", "Prophet"], knownFor: "13 NT epistles; three missionary journeys; spread the gospel to the Roman world (Acts 9–28)" },
  john:     { bio: "Son of Zebedee and 'the disciple whom Jesus loved.' Wrote the Gospel of John, three letters, and Revelation.", role: "Apostle", tags: ["Apostle", "Disciple"], knownFor: "Wrote John, 1–3 John, and Revelation; present at the Transfiguration and Crucifixion" },
  james:    { bio: "Son of Zebedee and brother of John. One of Jesus's inner circle; the first apostle to be martyred under Herod Agrippa.", role: "Apostle", tags: ["Apostle", "Disciple"], knownFor: "First apostle martyred (Acts 12:2); present at the Transfiguration" },
  mary:     { bio: "Mother of Jesus. Received the announcement of the virgin birth from the angel Gabriel. Present at the crucifixion and in the upper room at Pentecost.", role: "Mother of Jesus", tags: ["Matriarch"], knownFor: "Virgin birth of Jesus; Magnificat (Luke 1–2; Acts 1)" },
  joseph_nt:{ bio: "Carpenter from Nazareth, betrothed to Mary. Received angelic instructions in dreams to take Mary as his wife and flee to Egypt.", role: "Earthly Father of Jesus", tags: ["Patriarch"], knownFor: "Raised Jesus in Nazareth; protected the family by fleeing to Egypt (Matt 1–2)" },
};

// ─── genealogy tree ───────────────────────────────────────────────────────────

function GenealogyTree({ nodes }: { nodes: GenealogyNode[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsed,  setCollapsed]  = useState<Set<string>>(new Set());
  const [treeSearch, setTreeSearch] = useState("");

  const childrenMap = useMemo(() => {
    const map = new Map<string, GenealogyNode[]>();
    nodes.forEach(n => {
      if (n.parentId) {
        const arr = map.get(n.parentId) ?? [];
        arr.push(n);
        map.set(n.parentId, arr);
      }
    });
    return map;
  }, [nodes]);

  const roots = useMemo(() => nodes.filter(n => !n.parentId), [nodes]);

  const ancestors = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const s = new Set<string>();
    let cur = nodes.find(n => n.id === selectedId);
    while (cur?.parentId) { s.add(cur.parentId); cur = nodes.find(n => n.id === cur!.parentId); }
    return s;
  }, [selectedId, nodes]);

  const descendants = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const s = new Set<string>();
    function walk(id: string) { (childrenMap.get(id) ?? []).forEach(k => { s.add(k.id); walk(k.id); }); }
    walk(selectedId);
    return s;
  }, [selectedId, childrenMap]);

  const matchNode = useCallback((n: GenealogyNode) => {
    if (!treeSearch) return true;
    const q = treeSearch.toLowerCase();
    return n.name.toLowerCase().includes(q) || (n.notes ?? "").toLowerCase().includes(q);
  }, [treeSearch]);

  const subtreeMatch = useCallback((id: string): boolean => {
    const node = nodes.find(n => n.id === id);
    if (!node) return false;
    if (matchNode(node)) return true;
    return (childrenMap.get(id) ?? []).some(k => subtreeMatch(k.id));
  }, [nodes, childrenMap, matchNode]);

  function toggleCollapse(id: string) {
    setCollapsed(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  const selectedNode = selectedId ? nodes.find(n => n.id === selectedId) ?? null : null;
  const charInfo     = selectedId ? (CHAR_INFO[selectedId] ?? null) : null;

  // Thin hairline connector between nodes
  function Stem() {
    return <div style={{ width: 1, height: 12, margin: "0 auto", background: "var(--hairline)" }} />;
  }

  function renderNode(node: GenealogyNode, showStem: boolean): React.ReactNode {
    if (treeSearch && !subtreeMatch(node.id)) return null;

    const kids        = childrenMap.get(node.id) ?? [];
    const isCollapsed = collapsed.has(node.id);
    const isSelected  = node.id === selectedId;
    const inLineage   = ancestors.has(node.id) || descendants.has(node.id);
    const info        = CHAR_INFO[node.id];

    return (
      <div key={node.id}>
        {showStem && <Stem />}

        {/* Node row — uses same active-state tokens as nav-item */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setSelectedId(isSelected ? null : node.id)}
          onKeyDown={e => e.key === "Enter" && setSelectedId(isSelected ? null : node.id)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 10px", borderRadius: 7,
            border: `1px solid ${isSelected || inLineage ? "var(--accent-border)" : "var(--hairline)"}`,
            background: isSelected || inLineage ? "var(--accent-soft)" : "var(--paper)",
            cursor: "pointer", outline: "none",
          }}
        >
          <span style={{
            flex: 1, fontSize: 13,
            color: isSelected ? "var(--accent-ink)" : "var(--ink-1)",
            fontWeight: isSelected ? 500 : 450,
          }}>
            {node.name}
          </span>

          {/* Show first tag as a standard badge */}
          {info?.tags[0] && (
            <span className="badge" style={{ fontSize: 10.5 }}>{info.tags[0]}</span>
          )}

          {/* Notes (secondary tag / date) — muted text, no extra badge */}
          {!info?.tags[0] && node.notes && (
            <span style={{ fontSize: 11, color: "var(--ink-4)", whiteSpace: "nowrap" }}>{node.notes}</span>
          )}

          {/* Collapse button — matches .icon-btn sizing */}
          {kids.length > 0 && (
            <button
              onClick={e => { e.stopPropagation(); toggleCollapse(node.id); }}
              style={{
                flexShrink: 0, width: 18, height: 18, display: "grid", placeItems: "center",
                borderRadius: 4, border: "none", background: "none",
                cursor: "pointer", color: "var(--ink-4)",
                transform: isCollapsed ? "rotate(-90deg)" : "none",
                transition: "transform 0.12s",
              }}
            >
              <ChevronDown size={11} />
            </button>
          )}
        </div>

        {/* Children */}
        {kids.length > 0 && !isCollapsed && (
          kids.length === 1 ? (
            renderNode(kids[0], true)
          ) : (
            <div>
              <Stem />
              <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(kids.length, 3)}, 1fr)`,
                gap: 6,
              }}>
                {kids.map(k => renderNode(k, false))}
              </div>
            </div>
          )
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

      {/* ── Tree ── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {nodes.length > 4 && (
          <div style={{ position: "relative", marginBottom: 10 }}>
            <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", pointerEvents: "none" }} />
            <input
              value={treeSearch}
              onChange={e => setTreeSearch(e.target.value)}
              placeholder="Search this tree…"
              className="input-field"
              style={{ paddingLeft: 28, height: 30, fontSize: 12.5 }}
            />
          </div>
        )}

        {!treeSearch && nodes.length > 1 && (
          <p style={{ fontSize: 11.5, color: "var(--ink-4)", margin: "0 0 8px" }}>
            Click any person to read their biography
          </p>
        )}

        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 200 }}>
            {roots.map(r => renderNode(r, false))}
          </div>
        </div>
      </div>

      {/* ── Info panel — plain .card, matching InfoRow / TagGroup style ── */}
      {selectedNode && (
        <div className="card" style={{ width: 220, flexShrink: 0, padding: "14px 16px", position: "sticky", top: 8, animation: "fadeIn 0.15s ease" }}>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, gap: 4 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-1)", margin: "0 0 1px", fontFamily: "var(--font-serif)" }}>
                {selectedNode.name}
              </p>
              {charInfo && (
                <p className="card-label" style={{ margin: 0 }}>{charInfo.role}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="btn-ghost btn-sm"
              style={{ padding: "0 4px", height: 20, flexShrink: 0, color: "var(--ink-4)" }}
            >
              <X size={12} />
            </button>
          </div>

          {charInfo?.tags && charInfo.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
              {charInfo.tags.map(t => <span key={t} className="badge" style={{ fontSize: 10.5 }}>{t}</span>)}
            </div>
          )}

          <p style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.6, margin: "0 0 10px" }}>
            {charInfo?.bio ?? selectedNode.notes ?? "A figure in biblical genealogy."}
          </p>

          {charInfo && (
            <div style={{ borderTop: "1px solid var(--hairline)", paddingTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
              {charInfo.lifespan && (
                <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>
                  <span style={{ fontWeight: 500, color: "var(--ink-2)" }}>Lifespan </span>
                  {charInfo.lifespan}
                </p>
              )}
              <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0, lineHeight: 1.45 }}>
                <span style={{ fontWeight: 500, color: "var(--ink-2)" }}>Known for </span>
                {charInfo.knownFor}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
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

  // Only show the Family Trees section when the book has real parentId relationships
  const hasGenealogy = useMemo(
    () => !!book && book.genealogy.nodes.filter(n => n.parentId).length >= 2,
    [book]
  );

  const visibleSections = useMemo(
    () => (hasGenealogy ? SECTION_IDS : SECTION_IDS.filter(s => s !== "genealogy")),
    [hasGenealogy]
  );

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
      <aside className="ctx-aside" data-tutorial-id="context-sidebar">
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
          <nav className="ctx-secnav" data-tutorial-id="context-secnav">
            {visibleSections.map(s => {
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
