"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

const PAD = 8;
const GAP = 14;
const TW  = 315;
const TH  = 230;

interface TourStep {
  page: string;
  targetId?: string;
  placement: "top" | "bottom" | "left" | "right" | "center";
  badge: string;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    page: "/dashboard",
    placement: "center",
    badge: "Welcome",
    title: "Welcome to Bible Study Tracker",
    body: "Your all-in-one platform for reading, studying, and sharing Scripture. Let's take a guided tour — we'll navigate through every part of the app together!",
  },
  {
    page: "/dashboard",
    targetId: "nav-sidebar",
    placement: "right",
    badge: "1 · Navigation",
    title: "The Sidebar",
    body: "Every section of the app lives here — Dashboard, Bible, Groups, Friends, Study Plans, Context, and Settings. Your streak and profile are at the bottom.",
  },
  {
    page: "/dashboard",
    targetId: "dash-verse",
    placement: "bottom",
    badge: "2 · Dashboard",
    title: "Verse of the Day",
    body: "A fresh Scripture passage every morning. Tap it to jump directly to that chapter in the Bible reader.",
  },
  {
    page: "/dashboard",
    targetId: "dash-streak",
    placement: "top",
    badge: "3 · Dashboard",
    title: "Reading Streak",
    body: "Your streak grows every day you engage with the app. Keep it alive by checking in daily — the sidebar always shows your current count.",
  },
  {
    page: "/dashboard/bible",
    targetId: "bible-controls",
    placement: "bottom",
    badge: "4 · Bible",
    title: "Bible Reader Controls",
    body: "Navigate books and chapters, switch between translations (KJV, ASV, WEB…), and open the search to find any verse by phrase.",
  },
  {
    page: "/dashboard/bible",
    targetId: "bible-chapter",
    placement: "top",
    badge: "5 · Bible",
    title: "Highlights & Annotations",
    body: "Tap any verse to highlight it in 5 colors, bookmark it, or write a private annotation. Your notes are visible only to you.",
  },
  {
    page: "/dashboard/friends",
    targetId: "friends-add",
    placement: "bottom",
    badge: "6 · Friends",
    title: "Add Friends",
    body: "Search any user by username and send them a friend request. Once connected, you can invite them into your study groups.",
  },
  {
    page: "/dashboard/groups",
    targetId: "groups-actions",
    placement: "bottom",
    badge: "7 · Groups",
    title: "Bible Study Groups",
    body: "Create public or private groups, or join one with an invite code. Groups get shared chat, collaborative reading plans, and a shared Bible study space.",
  },
  {
    page: "/dashboard/plans",
    targetId: "plans-header",
    placement: "bottom",
    badge: "8 · Study Plans",
    title: "Reading Plans",
    body: "Browse community plans or create your own. Assign plans to groups, track who's completed each day's reading, and pick up where you left off.",
  },
  {
    page: "/dashboard/context",
    targetId: "context-sidebar",
    placement: "right",
    badge: "9 · Context",
    title: "Bible Book Explorer",
    body: "Choose any of the 66 books of the Bible to explore its historical background, key events, and family trees for major lineages.",
  },
  {
    page: "/dashboard/context",
    targetId: "context-secnav",
    placement: "bottom",
    badge: "10 · Context",
    title: "Context Sections",
    body: "Dig into Overview, Author info, Time Period, Historical Setting, Family Trees (where relevant), Key Events, and Cultural Notes.",
  },
  {
    page: "/dashboard/profile",
    targetId: "profile-theme",
    placement: "bottom",
    badge: "11 · Settings",
    title: "Themes & Appearance",
    body: "Switch between light, dark, warm sepia, and other themes. Changes apply instantly and persist across all your sessions.",
  },
  {
    page: "/dashboard/profile",
    placement: "center",
    badge: "Done!",
    title: "You're all set!",
    body: "You've seen every major feature of Bible Study Tracker. The Help Tour button in the sidebar replays this walkthrough anytime. Happy studying!",
  },
];

interface SpotRect { top: number; left: number; width: number; height: number }

export function TutorialOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step,       setStep]       = useState(0);
  const [spotRect,   setSpotRect]   = useState<SpotRect | null>(null);
  const [navigating, setNavigating] = useState(false);
  const router   = useRouter();
  const pathname = usePathname();

  const cur    = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isCenter = cur.placement === "center" || !cur.targetId;

  // Navigate when step requires a different page
  useEffect(() => {
    if (!open || !cur) return;
    if (pathname !== cur.page) {
      setNavigating(true);
      setSpotRect(null);
      router.push(cur.page);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, open]);

  // Detect navigation completion
  useEffect(() => {
    if (!open) return;
    if (cur && pathname === cur.page) setNavigating(false);
  }, [pathname, open, cur]);

  // Find target element after page settles
  useEffect(() => {
    if (!open || !cur || navigating) return;
    if (pathname !== cur.page) return;
    if (isCenter) { setSpotRect(null); return; }

    const find = () => {
      const el = document.querySelector<HTMLElement>(`[data-tutorial-id="${cur.targetId}"]`);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      setSpotRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
      return true;
    };

    if (!find()) {
      const t1 = setTimeout(() => { if (!find()) setTimeout(find, 600); }, 200);
      return () => clearTimeout(t1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, pathname, open, navigating, isCenter]);

  // Reset on close
  useEffect(() => {
    if (!open) { setStep(0); setSpotRect(null); setNavigating(false); }
  }, [open]);

  function finish() {
    try { localStorage.setItem("tutorial_v1_seen", "1"); } catch { /* private browsing */ }
    onClose();
  }

  function next()  { setSpotRect(null); if (isLast) finish(); else setStep(s => s + 1); }
  function back()  { setSpotRect(null); setStep(s => Math.max(0, s - 1)); }
  function goTo(n: number) { setSpotRect(null); setStep(n); }

  if (!open || !cur) return null;

  return (
    <>
      {/* Backdrop / spotlight */}
      {!isCenter && spotRect ? (
        <>
          {/* 4 dark panes framing the spotlight window */}
          <div style={{ position:"fixed", inset:0, top:0, left:0, right:0, height: spotRect.top, zIndex:9990, background:"oklch(0% 0 0 / 0.55)", pointerEvents:"none" }} />
          <div style={{ position:"fixed", top: spotRect.top + spotRect.height, left:0, right:0, bottom:0, zIndex:9990, background:"oklch(0% 0 0 / 0.55)", pointerEvents:"none" }} />
          <div style={{ position:"fixed", top: spotRect.top, left:0, width: spotRect.left, height: spotRect.height, zIndex:9990, background:"oklch(0% 0 0 / 0.55)", pointerEvents:"none" }} />
          <div style={{ position:"fixed", top: spotRect.top, left: spotRect.left + spotRect.width, right:0, height: spotRect.height, zIndex:9990, background:"oklch(0% 0 0 / 0.55)", pointerEvents:"none" }} />
          {/* Accent ring around target */}
          <div style={{ position:"fixed", top: spotRect.top, left: spotRect.left, width: spotRect.width, height: spotRect.height, borderRadius:10, border:"2px solid var(--accent-btn)", boxShadow:"0 0 0 3px oklch(0.65 0.18 250 / 0.3)", zIndex:9991, pointerEvents:"none", transition:"all 250ms ease" }} />
        </>
      ) : (
        <div style={{ position:"fixed", inset:0, zIndex:9990, background:"oklch(0% 0 0 / 0.52)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)" }} />
      )}

      {/* Tooltip card */}
      <TooltipCard
        cur={cur}
        step={step}
        total={STEPS.length}
        spotRect={spotRect}
        isCenter={isCenter}
        isLast={isLast}
        navigating={navigating}
        onNext={next}
        onBack={back}
        onSkip={finish}
        onDot={goTo}
      />
    </>
  );
}

// ── Tooltip card ──────────────────────────────────────────────────────────────

function TooltipCard({ cur, step, total, spotRect, isCenter, isLast, navigating, onNext, onBack, onSkip, onDot }: {
  cur: TourStep; step: number; total: number;
  spotRect: SpotRect | null; isCenter: boolean; isLast: boolean; navigating: boolean;
  onNext: () => void; onBack: () => void; onSkip: () => void; onDot: (n: number) => void;
}) {
  const pos = tooltipPosition(cur.placement, spotRect, isCenter);

  return (
    <div
      key={`tut-${step}`}
      style={{
        position: "fixed", zIndex: 9999,
        background: "var(--paper)", border: "1px solid var(--hairline)", borderRadius: 14,
        boxShadow: "0 16px 48px oklch(0% 0 0 / 0.22), 0 2px 8px oklch(0% 0 0 / 0.10)",
        width: isCenter ? 420 : TW,
        maxWidth: "min(calc(100vw - 32px), 440px)",
        overflow: "hidden",
        animation: "tutIn 220ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        ...pos,
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Progress bar */}
      <div style={{ height: 3, background: "var(--paper-2)", flexShrink: 0 }}>
        <div style={{ height: "100%", background: "var(--accent-btn)", width: `${((step + 1) / total) * 100}%`, transition: "width 280ms ease" }} />
      </div>

      <div style={{ padding: "14px 16px 10px" }}>
        {/* Badge + close */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span className="badge badge-accent" style={{ fontSize: 10.5 }}>{cur.badge}</span>
          <button onClick={onSkip} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-4)", padding: 3, borderRadius: 4, display: "grid", placeItems: "center" }} aria-label="Close tour">
            <X size={14} />
          </button>
        </div>

        {/* Title */}
        <h3 style={{ fontSize: isCenter ? 18 : 14.5, fontWeight: 700, color: "var(--ink-1)", margin: "0 0 6px", fontFamily: "var(--font-serif)", lineHeight: 1.3 }}>
          {navigating ? "Navigating…" : cur.title}
        </h3>

        {/* Body / spinner */}
        {navigating ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-4)", fontSize: 12.5, padding: "2px 0 4px" }}>
            <NavSpinner /> Taking you there…
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0, lineHeight: 1.65 }}>{cur.body}</p>
        )}
      </div>

      {/* Step dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 4, padding: "4px 16px 4px" }}>
        {Array.from({ length: total }, (_, i) => (
          <button key={i} onClick={() => onDot(i)} aria-label={`Go to step ${i + 1}`} style={{
            width: i === step ? 18 : 5, height: 5, borderRadius: 999,
            background: i === step ? "var(--accent-btn)" : "var(--hairline)",
            border: "none", cursor: "pointer", padding: 0, transition: "all 200ms ease",
          }} />
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px 14px", borderTop: "1px solid var(--hairline)", marginTop: 6 }}>
        {step > 0 ? (
          <button onClick={onBack} className="btn-ghost btn-sm" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12.5 }}>
            <ChevronLeft size={13} /> Back
          </button>
        ) : (
          <button onClick={onSkip} style={{ fontSize: 12.5, color: "var(--ink-4)", background: "none", border: "none", cursor: "pointer", padding: "4px 2px", fontFamily: "var(--font-ui)" }}>
            Skip tour
          </button>
        )}
        <button onClick={onNext} disabled={navigating} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 18px", fontSize: 13, opacity: navigating ? 0.6 : 1 }}>
          {isLast ? "Finish!" : "Next"} {!isLast && <ChevronRight size={13} />}
        </button>
      </div>

      <style>{`
        @keyframes tutIn { from { opacity:0; transform: scale(0.93) translateY(8px); } to { opacity:1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}

function NavSpinner() {
  return (
    <>
      <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid var(--hairline)", borderTopColor: "var(--accent-btn)", flexShrink: 0, animation: "tutSpin 700ms linear infinite" }} />
      <style>{`@keyframes tutSpin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ── Tooltip positioning ───────────────────────────────────────────────────────

function tooltipPosition(
  placement: TourStep["placement"],
  rect: SpotRect | null,
  isCenter: boolean,
): React.CSSProperties {
  if (isCenter || !rect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

  const W = typeof window !== "undefined" ? window.innerWidth : 1200;
  const H = typeof window !== "undefined" ? window.innerHeight : 800;
  const cx = rect.left + rect.width  / 2;
  const cy = rect.top  + rect.height / 2;
  const clampX = (x: number) => Math.max(16, Math.min(W - TW - 16, x));
  const clampY = (y: number) => Math.max(16, Math.min(H - TH - 16, y));

  if (placement === "bottom") {
    const top = rect.top + rect.height + GAP;
    return top + TH > H - 16
      ? { bottom: H - rect.top + GAP, left: clampX(cx - TW / 2) }
      : { top, left: clampX(cx - TW / 2) };
  }
  if (placement === "top") {
    const bottom = H - rect.top + GAP;
    return bottom + TH > H - 16
      ? { top: rect.top + rect.height + GAP, left: clampX(cx - TW / 2) }
      : { bottom, left: clampX(cx - TW / 2) };
  }
  if (placement === "right") {
    const left = rect.left + rect.width + GAP;
    return left + TW > W - 16
      ? { top: clampY(cy - TH / 2), right: W - rect.left + GAP }
      : { top: clampY(cy - TH / 2), left };
  }
  if (placement === "left") {
    return { top: clampY(cy - TH / 2), right: W - rect.left + GAP };
  }
  return { bottom: 24, left: "50%", transform: "translateX(-50%)" };
}
