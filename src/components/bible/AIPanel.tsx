"use client";
import { useState } from "react";
import type { BibleVerse } from "@/types";
import { Sparkles, X, Loader2, BookOpen, Heart, Star, MessageSquare, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

interface AIPanelProps {
  verse: BibleVerse;
  onClose: () => void;
}

type AIAction = "explain" | "reflection" | "prayer" | "related_verses";

const AI_ACTIONS: { id: AIAction; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "explain", label: "Explain", icon: BookOpen, desc: "Simple explanation with context" },
  { id: "reflection", label: "Reflect", icon: Star, desc: "Personal reflection & application" },
  { id: "prayer", label: "Pray", icon: Heart, desc: "Prayer inspired by this verse" },
  { id: "related_verses", label: "Related", icon: MessageSquare, desc: "Cross-references & connections" },
];

export function AIPanel({ verse, onClose }: AIPanelProps) {
  const [activeAction, setActiveAction] = useState<AIAction>("explain");
  const [result, setResult] = useState<string>("");
  const [relatedVerses, setRelatedVerses] = useState<Array<{ reference: string; connection: string; theme: string }>>([]);
  const [loading, setLoading] = useState(false);

  async function handleAction(action: AIAction) {
    setActiveAction(action);
    setResult("");
    setRelatedVerses([]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: action,
          context: {
            verse: verse.text,
            reference: `${verse.bookName} ${verse.chapter}:${verse.verse}`,
          },
        }),
      });

      if (!res.ok) throw new Error("AI unavailable");
      const data = await res.json();

      if (action === "related_verses" && Array.isArray(data.result)) {
        setRelatedVerses(data.result);
      } else {
        setResult(typeof data.result === "string" ? data.result : JSON.stringify(data.result));
      }
    } catch {
      toast.error("AI service unavailable. Check your API key.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-card)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-page">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #D4AF37, #F59E0B)" }}>
            <Sparkles size={13} className="text-gray-900" />
          </div>
          <span className="font-semibold text-sm text-page">AI Study Assistant</span>
        </div>
        <button onClick={onClose} className="text-muted-page hover:text-page"><X size={18} /></button>
      </div>

      {/* Verse reference */}
      <div className="px-4 py-3 border-b border-page">
        <p className="text-xs font-semibold mb-1" style={{ color: "var(--gold)" }}>
          {verse.bookName} {verse.chapter}:{verse.verse}
        </p>
        <p className="text-sm text-secondary-page verse-text leading-relaxed line-clamp-3">
          &ldquo;{verse.text}&rdquo;
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-1.5 p-3 border-b border-page overflow-x-auto no-scrollbar">
        {AI_ACTIONS.map((action) => (
          <button key={action.id}
            onClick={() => handleAction(action.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${activeAction === action.id && result ? "" : "text-muted-page hover:text-page"}`}
            style={activeAction === action.id && (result || relatedVerses.length > 0)
              ? { background: "rgba(212,175,55,0.2)", color: "var(--gold)" }
              : { background: "var(--bg-secondary)" }}>
            <action.icon size={13} />
            {action.label}
          </button>
        ))}
      </div>

      {/* Result */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 size={24} className="animate-spin text-muted-page" />
            <p className="text-xs text-muted-page">Claude is thinking...</p>
          </div>
        ) : result ? (
          <div className="text-sm text-secondary-page leading-relaxed verse-text whitespace-pre-line">
            {result}
          </div>
        ) : relatedVerses.length > 0 ? (
          <div className="space-y-3">
            {relatedVerses.map((v, i) => (
              <div key={i} className="p-3 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
                <p className="text-xs font-bold mb-1" style={{ color: "var(--gold)" }}>{v.reference}</p>
                <p className="text-xs text-secondary-page leading-relaxed">{v.connection}</p>
                <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.1)", color: "var(--gold-muted)" }}>
                  {v.theme}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(212,175,55,0.1)" }}>
              <Sparkles size={20} style={{ color: "var(--gold)" }} />
            </div>
            <p className="text-sm text-secondary-page mb-1">Ask AI about this verse</p>
            <p className="text-xs text-muted-page">Choose an action above to get started</p>
          </div>
        )}
      </div>

      {/* Powered by note */}
      <div className="px-4 py-2 border-t border-page flex items-center justify-center gap-1.5">
        <Sparkles size={11} className="text-muted-page" />
        <span className="text-xs text-muted-page">Powered by Claude AI</span>
      </div>
    </div>
  );
}
