"use client";
import { useState } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

interface Step {
  badge: string;
  title: string;
  body: string;
  bullets: string[];
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    badge: "Welcome",
    title: "Welcome to Bible Study Tracker",
    body: "Your all-in-one platform for reading, studying, and sharing Scripture — with friends, in groups, or on your own. This quick tour will show you everything.",
    bullets: [],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={26} height={26}>
        <path d="M12 2l2.7 8.3H23l-7 5.1 2.7 8.3-7-5.1-7 5.1 2.7-8.3-7-5.1h8.3z" />
      </svg>
    ),
  },
  {
    badge: "Dashboard",
    title: "Your Home Base",
    body: "The Dashboard keeps you on track every day.",
    bullets: [
      "Daily verse — a fresh passage each morning",
      "Reading streak — consecutive days of study",
      "Activity feed — recent highlights from your groups",
      "Quick actions — jump straight into reading",
    ],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={26} height={26}>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    badge: "Bible Reader",
    title: "Powerful Bible Reader",
    body: "Everything you need for deep personal study.",
    bullets: [
      "Switch between KJV, NIV, and AMP translations",
      "Highlight verses in 5 colors and save bookmarks",
      "Write private annotations only you can see",
      'Full-text search — try “love one another” or “faith”',
    ],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={26} height={26}>
        <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5a1.5 1.5 0 0 0 0 3H19" />
        <path d="M19 18v3" />
      </svg>
    ),
  },
  {
    badge: "Groups",
    title: "Study Together in Groups",
    body: "Create or join groups for collaborative Bible study.",
    bullets: [
      "Public or private groups — you control who joins",
      "Share a join code with your church or small group",
      "Group chat for discussion, prayer, and sharing",
      "Admins can promote members and manage the group",
    ],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={26} height={26}>
        <circle cx="9" cy="9" r="3" />
        <circle cx="17" cy="10" r="2.3" />
        <path d="M3 19c0-2.8 2.7-5 6-5s6 2.2 6 5" />
        <path d="M15 19c0-2 1.6-3.6 4-3.6" />
      </svg>
    ),
  },
  {
    badge: "Friends",
    title: "Connect with Friends",
    body: "Build your study community one friend at a time.",
    bullets: [
      "Search any user by username and send a request",
      "Accept or decline incoming friend requests",
      "Invite friends directly into your groups",
    ],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={26} height={26}>
        <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3" />
        <path d="M19 16c1.5.5 3 1.5 3 3v1" />
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-1c0-2.2 2.7-4 6-4s6 1.8 6 4v1" />
      </svg>
    ),
  },
  {
    badge: "Study Plans",
    title: "Structured Reading Plans",
    body: "Follow through on your reading goals with plans.",
    bullets: [
      "Browse community plans or create your own",
      "Join group plans and track progress together",
      "Completion indicators show how far you've come",
      "Pick up where you left off after any break",
    ],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={26} height={26}>
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M3.5 9.5h17M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    badge: "Context Tab",
    title: "Historical & Cultural Context",
    body: "Understand every Bible book in its original setting.",
    bullets: [
      "Timeline of key events for every book of the Bible",
      "Family trees for major lineages — Genesis, Ruth, Matthew…",
      "Cultural notes on customs, law, worship, and geography",
      "Toggle Deep Study mode for scholarly detail",
    ],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={26} height={26}>
        <path d="M12 3l8 4v6c0 4-3.3 7-8 8-4.7-1-8-4-8-8V7z" />
      </svg>
    ),
  },
  {
    badge: "Settings",
    title: "Make It Yours",
    body: "Personalize every aspect of your experience.",
    bullets: [
      "Switch themes — light, dark, warm sepia, and more",
      "Update your display name and profile photo",
      "Manage notification preferences",
      "Replay this tour anytime via the ? button in the sidebar",
    ],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={26} height={26}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 14.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </svg>
    ),
  },
];

export function TutorialModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);

  if (!open) return null;

  const cur    = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const pct    = ((step + 1) / STEPS.length) * 100;

  function finish() {
    try { localStorage.setItem("tutorial_v1_seen", "1"); } catch { /* private browsing */ }
    setStep(0);
    onClose();
  }

  function next() { isLast ? finish() : setStep(s => s + 1); }
  function back() { if (step > 0) setStep(s => s - 1); }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "oklch(0% 0 0 / 0.52)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={e => e.target === e.currentTarget && finish()}
    >
      <div
        style={{
          background: "var(--paper)", borderRadius: 18,
          border: "1px solid var(--hairline)", boxShadow: "var(--shadow-modal)",
          width: "100%", maxWidth: 448,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          animation: "tutorialSlideIn 220ms ease",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div style={{ height: 3, background: "var(--paper-2)", flexShrink: 0 }}>
          <div style={{
            height: "100%", background: "var(--accent-btn)",
            width: `${pct}%`,
            transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          }} />
        </div>

        {/* Body */}
        <div style={{ padding: "24px 24px 16px" }}>

          {/* Top row: badge + close */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <span className="badge badge-accent" style={{ fontSize: 11, letterSpacing: "0.04em" }}>
              {step + 1} / {STEPS.length} — {cur.badge}
            </span>
            <button
              onClick={finish}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-4)", padding: 4, borderRadius: 6, display: "grid", placeItems: "center" }}
              aria-label="Close tutorial"
            >
              <X size={15} />
            </button>
          </div>

          {/* Icon */}
          <div style={{
            width: 50, height: 50, borderRadius: 12,
            background: "var(--accent-soft)", border: "1px solid var(--accent-border)",
            display: "grid", placeItems: "center",
            color: "var(--accent-ink)", marginBottom: 14, flexShrink: 0,
          }}>
            {cur.icon}
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: 19, fontWeight: 700, color: "var(--ink-1)",
            margin: "0 0 8px", fontFamily: "var(--font-serif)", lineHeight: 1.25,
          }}>
            {cur.title}
          </h2>

          {/* Body text */}
          <p style={{ fontSize: 13.5, color: "var(--ink-3)", margin: "0 0 14px", lineHeight: 1.65 }}>
            {cur.body}
          </p>

          {/* Bullets */}
          {cur.bullets.length > 0 && (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {cur.bullets.map((b, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: "var(--accent-btn)", flexShrink: 0, marginTop: 5,
                  }} />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Step dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 5, padding: "8px 0 2px" }}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
              style={{
                width: i === step ? 18 : 5, height: 5, borderRadius: 999,
                background: i === step ? "var(--accent-btn)" : "var(--hairline)",
                border: "none", cursor: "pointer", padding: 0,
                transition: "all 250ms ease",
              }}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px 20px",
          borderTop: "1px solid var(--hairline)", marginTop: 10,
        }}>
          {step > 0 ? (
            <button
              onClick={back}
              className="btn-ghost btn-sm"
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              <ChevronLeft size={14} /> Back
            </button>
          ) : (
            <button
              onClick={finish}
              style={{
                fontSize: 13, color: "var(--ink-4)", background: "none",
                border: "none", cursor: "pointer", padding: "6px 4px",
                fontFamily: "var(--font-ui)",
              }}
            >
              Skip tour
            </button>
          )}

          <button
            onClick={next}
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 22px", fontSize: 13.5 }}
          >
            {isLast ? "Get started" : "Next"}
            {!isLast && <ChevronRight size={14} />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes tutorialSlideIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
}
