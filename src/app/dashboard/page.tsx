"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";
import { getTodaysVerse } from "@/lib/bible-data";
import { getUserPlanProgress } from "@/lib/firestore";
import { formatVerseRef } from "@/lib/utils";
import type { UserPlanProgress } from "@/types";

// ── Minimal icons ─────────────────────────────────────────────────────────────

function IcoBookmark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
      <path d="M6 3h12v18l-6-4-6 4z"/>
    </svg>
  );
}
function IcoCopy() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}
function IcoChevron() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
      <path d="m9 6 6 6-6 6"/>
    </svg>
  );
}
function IcoCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
      <path d="m5 12 5 5 9-11"/>
    </svg>
  );
}
function IcoFlame() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
      <path d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 11 8 13 8 14a4 4 0 0 0 8 0"/>
    </svg>
  );
}
function IcoPlans() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>
    </svg>
  );
}

// ── Streak dots for the week ──────────────────────────────────────────────────

function StreakDots({ currentStreak }: { currentStreak: number }) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const today = new Date().getDay();
  const mondayOffset = today === 0 ? 6 : today - 1;
  const done = days.map((_, i) => {
    const daysAgo = mondayOffset - i;
    if (daysAgo < 0) return false;
    return daysAgo < currentStreak;
  });

  return (
    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
      {days.map((d, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: done[i] ? "var(--ds-accent-soft-2)" : "var(--paper-2)",
            border: "1px solid " + (done[i] ? "oklch(82% 0.03 245)" : "var(--hairline)"),
            display: "grid", placeItems: "center",
            color: done[i] ? "var(--ds-accent-ink)" : "var(--ink-4)",
          }}>
            {done[i] && <IcoCheck />}
          </div>
          <div style={{ fontSize: 10.5, color: "var(--ink-4)", fontWeight: 500 }}>{d}</div>
        </div>
      ))}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<UserPlanProgress[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const todaysVerse = getTodaysVerse();

  useEffect(() => {
    if (!user) return;
    getUserPlanProgress(user.uid)
      .then(setPlans)
      .finally(() => setLoadingPlans(false));
  }, [user]);

  if (!user) return null;

  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }

  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const activePlan = plans[0] ?? null;
  const verseRef = formatVerseRef(todaysVerse.bookName, todaysVerse.chapter, todaysVerse.verse);

  return (
    <div className="pg">

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6, fontWeight: 500 }}>
            {dateLabel}
          </div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: 28, letterSpacing: "-0.015em", margin: "0 0 4px", color: "var(--ink-1)" }}>
            {greeting()}, {user.displayName.split(" ")[0]}.
          </h1>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>
            {activePlan ? `Continue ${activePlan.planName} · Day ${activePlan.currentDay}` : "Start a reading plan to track your progress."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/dashboard/plans" className="btn"><IcoBookmark /> Plans</Link>
          {activePlan ? (
            <Link href="/dashboard/bible" className="btn-primary">Continue reading <IcoChevron /></Link>
          ) : (
            <Link href="/dashboard/plans" className="btn-primary">Start reading <IcoChevron /></Link>
          )}
        </div>
      </div>

      {/* Verse of the day — full width */}
      <div className="card" style={{ padding: "28px 32px", marginBottom: 20, background: "var(--paper-2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div className="card-label">Verse of the day</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="btn-ghost btn-sm"
              onClick={() => navigator.clipboard?.writeText(`"${todaysVerse.text}" — ${verseRef}`)}
              title="Copy"
            >
              <IcoCopy />
            </button>
            <Link href={`/dashboard/bible?book=${todaysVerse.bookId}&chapter=${todaysVerse.chapter}`}
              className="btn-ghost btn-sm" title="Read chapter">
              <IcoChevron />
            </Link>
          </div>
        </div>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 24, lineHeight: 1.45, fontWeight: 400, letterSpacing: "-0.005em", color: "var(--ink-1)", margin: "0 0 12px", maxWidth: 760 }}>
          &ldquo;{todaysVerse.text}&rdquo;
        </p>
        <div style={{ fontSize: 12.5, color: "var(--ink-3)", fontVariant: "small-caps", letterSpacing: "0.04em" }}>
          {verseRef}
        </div>
      </div>

      {/* Three columns */}
      <div className="grid-dash-3">

        {/* Today's reading */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="card-label">Today&apos;s reading</div>
            {activePlan && (
              <span className="badge-accent">Day {activePlan.currentDay}</span>
            )}
          </div>
          {loadingPlans ? (
            <div style={{ height: 40, borderRadius: 6, background: "var(--paper-2)", animation: "pulse 1.5s infinite" }} />
          ) : activePlan ? (
            <>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, letterSpacing: "-0.01em", marginBottom: 4 }}>
                {activePlan.planName}
              </div>
              <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: "0 0 14px", lineHeight: 1.55 }}>
                Day {activePlan.currentDay} of {(activePlan as UserPlanProgress & { plan?: { duration: number } }).plan?.duration ?? 30}
              </p>
              <div style={{ height: 4, background: "var(--paper-3)", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
                <div style={{
                  width: `${Math.min(100, Math.round((activePlan.completedDays.length / ((activePlan as UserPlanProgress & { plan?: { duration: number } }).plan?.duration ?? 30)) * 100))}%`,
                  height: "100%", background: "var(--ds-accent)",
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-3)", marginBottom: 12 }}>
                <span>{activePlan.completedDays.length} completed</span>
                <span>{((activePlan as UserPlanProgress & { plan?: { duration: number } }).plan?.duration ?? 30) - activePlan.completedDays.length} remaining</span>
              </div>
              <hr style={{ border: "none", borderTop: "1px solid var(--hairline)", margin: "0 0 12px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Keep your streak going</div>
                <Link href="/dashboard/bible" className="btn btn-sm btn-primary">Resume</Link>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <IcoPlans />
              <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "8px 0 12px" }}>No active plan</p>
              <Link href="/dashboard/plans" className="btn btn-sm btn-primary">Start a plan</Link>
            </div>
          )}
        </div>

        {/* Streak */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="card-label">Streak</div>
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>This week</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 38, fontWeight: 400, color: "var(--ink-1)", lineHeight: 1 }}>
              {user.currentStreak}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>days</div>
          </div>
          <StreakDots currentStreak={user.currentStreak} />
          <hr style={{ border: "none", borderTop: "1px solid var(--hairline)", margin: "12px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "var(--ink-3)" }}>Longest</span>
            <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink-1)" }}>{user.longestStreak} days</span>
          </div>
        </div>

        {/* Active plan progress bar */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="card-label">Active plan</div>
          </div>
          {activePlan ? (
            <>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, letterSpacing: "-0.01em", marginBottom: 2 }}>{activePlan.planName}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 14 }}>
                Started {activePlan.startDate}
              </div>
              <div style={{ display: "flex", gap: 3, marginBottom: 12 }}>
                {Array.from({ length: Math.min(30, (activePlan as UserPlanProgress & { plan?: { duration: number } }).plan?.duration ?? 30) }).map((_, i) => (
                  <div key={i} style={{
                    flex: 1, height: 18,
                    background: i < activePlan.completedDays.length ? "var(--ds-accent-soft-2)" : "var(--paper-3)",
                    borderRadius: 1,
                    borderTop: i === activePlan.currentDay - 1 ? "2px solid var(--ds-accent)" : "none",
                  }} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", justifyContent: "space-between" }}>
                <span>Day {activePlan.currentDay}</span>
                <span>{((activePlan as UserPlanProgress & { plan?: { duration: number } }).plan?.duration ?? 30) - activePlan.currentDay} left</span>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ fontSize: 13, color: "var(--ink-3)" }}>No plan started yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid-dash-eq3">
        <div className="card" style={{ padding: 16 }}>
          <div className="card-label" style={{ marginBottom: 8 }}>Total days read</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 30, fontWeight: 400, letterSpacing: "-0.02em", color: "var(--ink-1)" }}>{user.totalDaysRead}</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>days</div>
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="card-label" style={{ marginBottom: 8 }}>Active plans</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 30, fontWeight: 400, letterSpacing: "-0.02em", color: "var(--ds-accent-ink)" }}>{plans.length}</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>in progress</div>
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="card-label" style={{ marginBottom: 8 }}>Longest streak</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 30, fontWeight: 400, letterSpacing: "-0.02em", color: "var(--ink-1)" }}>{user.longestStreak}</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>days</div>
          </div>
        </div>
      </div>
    </div>
  );
}
