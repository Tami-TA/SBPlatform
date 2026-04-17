"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import {
  getPublicReadingPlans,
  getUserPlanProgress,
  startReadingPlan,
  markDayComplete,
} from "@/lib/firestore";
import type { ReadingPlan, UserPlanProgress } from "@/types";
import { PRESET_READING_PLANS, getPlanDayReading } from "@/lib/bible-data";
import {
  ListChecks, Plus, Check, ChevronRight, BookOpen, Users,
  Clock, Star, Trophy, Loader2, X, Target, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function PlansPage() {
  const { user } = useAuthStore();
  const [myProgress, setMyProgress] = useState<UserPlanProgress[]>([]);
  const [publicPlans, setPublicPlans] = useState<ReadingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "browse">("active");
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([getUserPlanProgress(user.uid), getPublicReadingPlans()])
      .then(([prog, plans]) => { setMyProgress(prog); setPublicPlans(plans); })
      .finally(() => setLoading(false));
  }, [user]);

  async function handleStartPlan(plan: { name: string; description: string; duration: number; tags: string[]; id?: string }) {
    if (!user) return;
    setStarting(plan.name);
    try {
      await startReadingPlan(user.uid, plan.id || plan.name, plan.name);
      const updated = await getUserPlanProgress(user.uid);
      setMyProgress(updated);
      setActiveTab("active");
      toast.success(`Started "${plan.name}"!`);
    } catch {
      toast.error("Failed to start plan");
    } finally {
      setStarting(null);
    }
  }

  async function handleMarkDay(progressId: string, dayNum: number) {
    if (!user) return;
    await markDayComplete(progressId, dayNum, user.uid);
    const updated = await getUserPlanProgress(user.uid);
    setMyProgress(updated);
    toast.success("Day marked complete! 🎉");
  }

  const PLAN_DURATIONS = ["7 Days", "30 Days", "60 Days", "90 Days", "365 Days"];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-page">Reading Plans</h1>
          <p className="text-sm text-secondary-page mt-1">Structure your daily Scripture reading</p>
        </div>
        <button onClick={() => setActiveTab("browse")} className="btn-gold px-4 py-2.5 text-sm">
          <Plus size={16} /> Browse Plans
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-page mb-6">
        {[
          { id: "active", label: "My Plans", badge: myProgress.length },
          { id: "browse", label: "Browse Plans", badge: 0 },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as "active" | "browse")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${activeTab === tab.id ? "" : "border-transparent text-muted-page"}`}
            style={activeTab === tab.id ? { borderColor: "var(--gold)", color: "var(--gold)" } : {}}>
            {tab.label}
            {tab.badge > 0 && (
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-gray-900"
                style={{ background: "linear-gradient(135deg, #D4AF37, #F59E0B)" }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-muted-page" />
        </div>
      ) : activeTab === "active" ? (
        <div>
          {myProgress.length === 0 ? (
            <div className="text-center py-16 card">
              <ListChecks size={48} className="mx-auto mb-4 text-muted-page" />
              <h3 className="text-lg font-semibold text-page mb-2">No active plans</h3>
              <p className="text-secondary-page text-sm mb-6">Start a reading plan to track your progress</p>
              <button onClick={() => setActiveTab("browse")} className="btn-gold mx-auto px-6">
                Browse Plans <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myProgress.map((prog) => {
                const durationEstimate = 30;
                const pct = Math.min(100, Math.round((prog.completedDays.length / durationEstimate) * 100));
                const todayNum = prog.currentDay;
                const todayDone = prog.completedDays.includes(todayNum);

                const dayReading = getPlanDayReading(prog.planName, todayNum);

                return (
                  <div key={prog.id} className="card p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-page text-base mb-1">{prog.planName}</h3>
                        <p className="text-xs text-muted-page">Started {prog.startDate} · Day {todayNum} of {durationEstimate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-display font-bold text-gold-gradient">{pct}%</p>
                        <p className="text-xs text-muted-page">complete</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="progress-gold mb-4">
                      <div className="progress-gold-fill" style={{ width: `${pct}%` }} />
                    </div>

                    {/* Today's reading */}
                    <div className="p-3 rounded-xl border"
                      style={todayDone
                        ? { background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.3)" }
                        : { background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {todayDone
                            ? <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(34,197,94,0.2)" }}>
                                <Check size={16} className="text-green-500" />
                              </div>
                            : <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(212,175,55,0.15)" }}>
                                <BookOpen size={16} style={{ color: "var(--gold)" }} />
                              </div>
                          }
                          <div>
                            <p className="text-sm font-medium text-page">
                              {todayDone ? "Day complete!" : `Day ${todayNum}`}
                            </p>
                            {dayReading && (
                              <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--gold)" }}>
                                {dayReading.label}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {dayReading && !todayDone && (
                            <Link
                              href={`/dashboard/bible?book=${dayReading.bookId}&chapter=${dayReading.chapter}`}
                              className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                              style={{ background: "rgba(212,175,55,0.12)", color: "var(--gold)", border: "1px solid rgba(212,175,55,0.3)" }}>
                              Read <ArrowRight size={11} />
                            </Link>
                          )}
                          {!todayDone && (
                            <button onClick={() => handleMarkDay(prog.id, todayNum)}
                              className="btn-gold text-xs px-4 py-2">
                              Mark Done
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recent days grid */}
                    <div className="mt-4">
                      <p className="text-xs text-muted-page mb-2">Recent days</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {Array.from({ length: Math.min(14, todayNum + 2) }, (_, i) => i + 1).map((day) => (
                          <div key={day}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${prog.completedDays.includes(day) ? "" : day === todayNum ? "ring-2" : "opacity-40"}`}
                            style={prog.completedDays.includes(day)
                              ? { background: "linear-gradient(135deg, #D4AF37, #F59E0B)", color: "#1a0a0a" }
                              : day === todayNum
                              ? { background: "var(--bg-secondary)", color: "var(--gold)" }
                              : { background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                            {day}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-page text-xs text-muted-page">
                      <span className="flex items-center gap-1"><Check size={11} className="text-green-500" />{prog.completedDays.length} days done</span>
                      <span className="flex items-center gap-1"><Target size={11} />{Math.max(0, durationEstimate - prog.completedDays.length)} remaining</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Preset plans */}
          <div>
            <h2 className="text-base font-semibold text-page mb-3 flex items-center gap-2">
              <Star size={15} style={{ color: "var(--gold)" }} />
              Popular Plans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRESET_READING_PLANS.map((plan) => {
                const alreadyStarted = myProgress.some((p) => p.planName === plan.name);
                return (
                  <div key={plan.name} className="card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, rgba(29,78,216,0.15), rgba(212,175,55,0.15))" }}>
                        <BookOpen size={20} style={{ color: "var(--gold)" }} />
                      </div>
                      <span className="badge-gold">{plan.duration} days</span>
                    </div>
                    <h3 className="font-semibold text-page mb-1">{plan.name}</h3>
                    <p className="text-xs text-secondary-page mb-3 leading-relaxed">{plan.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {plan.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => handleStartPlan(plan)}
                      disabled={alreadyStarted || starting === plan.name}
                      className={`w-full text-sm py-2.5 rounded-xl font-semibold transition-all ${alreadyStarted ? "opacity-60 cursor-default" : ""}`}
                      style={alreadyStarted
                        ? { background: "var(--bg-secondary)", color: "var(--text-muted)" }
                        : { background: "linear-gradient(135deg, #D4AF37, #F59E0B)", color: "#1a0a0a" }}>
                      {starting === plan.name ? (
                        <Loader2 size={16} className="animate-spin mx-auto" />
                      ) : alreadyStarted ? (
                        <span className="flex items-center justify-center gap-1.5"><Check size={14} /> In Progress</span>
                      ) : (
                        "Start Plan"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* From community */}
          {publicPlans.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-page mb-3 flex items-center gap-2">
                <Users size={15} style={{ color: "var(--gold)" }} />
                Community Plans
              </h2>
              <div className="space-y-3">
                {publicPlans.map((plan) => (
                  <div key={plan.id} className="card p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-page">{plan.name}</h4>
                      <p className="text-xs text-muted-page">{plan.duration} days · {plan.completionCount} completed</p>
                    </div>
                    <button onClick={() => handleStartPlan({ ...plan, description: plan.description || "", tags: plan.tags || [] })} className="btn-ghost text-xs px-4 py-2">
                      Start
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
