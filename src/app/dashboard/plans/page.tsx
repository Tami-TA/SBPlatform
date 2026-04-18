"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import {
  getPublicReadingPlans,
  getUserPlanProgress,
  getUserReadingPlans,
  createReadingPlan,
  updateReadingPlan,
  deleteReadingPlan,
  startReadingPlan,
  markDayComplete,
} from "@/lib/firestore";
import type { ReadingPlan, UserPlanProgress } from "@/types";
import { PRESET_READING_PLANS, getPlanDayReading } from "@/lib/bible-data";
import {
  ListChecks, Plus, Check, ChevronRight, BookOpen, Users,
  Star, Loader2, Target, ArrowRight, Pencil, Trash2, Globe, Lock,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface PlanForm {
  name: string;
  description: string;
  duration: number;
  isPublic: boolean;
}

const DEFAULT_FORM: PlanForm = { name: "", description: "", duration: 30, isPublic: false };

export default function PlansPage() {
  const { user } = useAuthStore();
  const [myProgress, setMyProgress] = useState<UserPlanProgress[]>([]);
  const [publicPlans, setPublicPlans] = useState<ReadingPlan[]>([]);
  const [myCreatedPlans, setMyCreatedPlans] = useState<ReadingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "browse" | "create">("active");
  const [starting, setStarting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ReadingPlan | null>(null);
  const [form, setForm] = useState<PlanForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([getUserPlanProgress(user.uid), getPublicReadingPlans(), getUserReadingPlans(user.uid)])
      .then(([prog, plans, created]) => { setMyProgress(prog); setPublicPlans(plans); setMyCreatedPlans(created); })
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

  async function handleSavePlan() {
    if (!user || !form.name.trim()) return;
    setSaving(true);
    try {
      if (editingPlan) {
        await updateReadingPlan(editingPlan.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          duration: form.duration,
          isPublic: form.isPublic,
        });
        toast.success("Plan updated!");
      } else {
        await createReadingPlan({
          name: form.name.trim(),
          description: form.description.trim(),
          duration: form.duration,
          isPublic: form.isPublic,
          createdBy: user.uid,
          days: [],
          memberIds: [],
          tags: [],
        });
        toast.success("Plan created!");
      }
      const updated = await getUserReadingPlans(user.uid);
      setMyCreatedPlans(updated);
      setShowForm(false);
      setEditingPlan(null);
      setForm(DEFAULT_FORM);
    } catch {
      toast.error("Failed to save plan");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePlan(planId: string, planName: string) {
    if (!confirm(`Delete "${planName}"? This cannot be undone.`)) return;
    setDeleting(planId);
    try {
      await deleteReadingPlan(planId);
      setMyCreatedPlans((prev) => prev.filter((p) => p.id !== planId));
      toast.success("Plan deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  function openEdit(plan: ReadingPlan) {
    setEditingPlan(plan);
    setForm({ name: plan.name, description: plan.description || "", duration: plan.duration, isPublic: plan.isPublic });
    setShowForm(true);
  }

  function openCreate() {
    setEditingPlan(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Reading Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">Structure your daily Scripture reading</p>
        </div>
        <button onClick={openCreate} className="btn-primary px-4 py-2.5 text-sm">
          <Plus size={16} /> New Plan
        </button>
      </div>

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="card p-6 w-full max-w-md space-y-4">
            <h2 className="font-display text-lg font-bold text-foreground">{editingPlan ? "Edit Plan" : "Create Reading Plan"}</h2>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Plan name</label>
              <input className="input-field" placeholder="e.g. Gospels in 30 Days"
                value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Description</label>
              <textarea className="input-field resize-none" rows={3} placeholder="What will readers study?"
                value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Duration (days)</label>
              <input type="number" min={1} max={365} className="input-field"
                value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))} />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setForm((f) => ({ ...f, isPublic: !f.isPublic }))}
                className={`toggle-track ${form.isPublic ? "on" : ""}`} aria-label="Toggle public">
                <span className="toggle-thumb" />
              </button>
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                {form.isPublic ? <Globe size={13} /> : <Lock size={13} />}
                {form.isPublic ? "Public — others can browse this plan" : "Private — only you can see this"}
              </span>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowForm(false); setEditingPlan(null); setForm(DEFAULT_FORM); }}
                className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleSavePlan} disabled={saving || !form.name.trim()} className="btn-primary flex-1">
                {saving ? <Loader2 size={16} className="animate-spin" /> : editingPlan ? "Save Changes" : "Create Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-list mb-6">
        {[
          { id: "active", label: "My Plans", badge: myProgress.length },
          { id: "create", label: "My Created", badge: myCreatedPlans.length },
          { id: "browse", label: "Browse", badge: 0 },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as "active" | "browse" | "create")}
            className={activeTab === tab.id ? "tab-item active" : "tab-item"}>
            {tab.label}
            {tab.badge > 0 && (
              <span className="ml-1.5 w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : activeTab === "active" ? (
        <div>
          {myProgress.length === 0 ? (
            <div className="text-center py-16 card">
              <ListChecks size={48} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No active plans</h3>
              <p className="text-muted-foreground text-sm mb-6">Start a reading plan to track your progress</p>
              <button onClick={() => setActiveTab("browse")} className="btn-primary mx-auto px-6">
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
                        <h3 className="font-semibold text-foreground text-base mb-1">{prog.planName}</h3>
                        <p className="text-xs text-muted-foreground">Started {prog.startDate} · Day {todayNum} of {durationEstimate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-display font-bold text-primary">{pct}%</p>
                        <p className="text-xs text-muted-foreground">complete</p>
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
                            : <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--primary)/0.1" }}>
                                <BookOpen size={16} className="text-primary" />
                              </div>
                          }
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {todayDone ? "Day complete!" : `Day ${todayNum}`}
                            </p>
                            {dayReading && (
                              <p className="text-xs font-semibold mt-0.5" className="text-primary">
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
                              style={{ background: "var(--accent)"}}>
                              Read <ArrowRight size={11} />
                            </Link>
                          )}
                          {!todayDone && (
                            <button onClick={() => handleMarkDay(prog.id, todayNum)}
                              className="btn-primary text-xs px-4 py-2">
                              Mark Done
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recent days grid */}
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-2">Recent days</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {Array.from({ length: Math.min(14, todayNum + 2) }, (_, i) => i + 1).map((day) => (
                          <div key={day}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${prog.completedDays.includes(day) ? "" : day === todayNum ? "ring-2" : "opacity-40"}`}
                            style={prog.completedDays.includes(day)
                              ? { background: "var(--primary)", color: "#1a0a0a" }
                              : day === todayNum
                              ? { background: "var(--bg-secondary)", color: "var(--primary)" }
                              : { background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                            {day}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Check size={11} className="text-green-500" />{prog.completedDays.length} days done</span>
                      <span className="flex items-center gap-1"><Target size={11} />{Math.max(0, durationEstimate - prog.completedDays.length)} remaining</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === "create" ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{myCreatedPlans.length} plan{myCreatedPlans.length !== 1 ? "s" : ""} created by you</p>
            <button onClick={openCreate} className="btn-primary text-xs px-4 py-2">
              <Plus size={14} /> New Plan
            </button>
          </div>
          {myCreatedPlans.length === 0 ? (
            <div className="text-center py-16 card">
              <BookOpen size={40} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-base font-semibold text-foreground mb-2">No plans yet</h3>
              <p className="text-sm text-muted-foreground mb-6">Create a custom reading plan for yourself or the community</p>
              <button onClick={openCreate} className="btn-primary mx-auto px-6">
                <Plus size={16} /> Create First Plan
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myCreatedPlans.map((plan) => (
                <div key={plan.id} className="card p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground truncate">{plan.name}</h4>
                      <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={plan.isPublic
                          ? { background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }
                          : { background: "var(--bg-secondary)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                        {plan.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                        {plan.isPublic ? "Public" : "Private"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{plan.description || "No description"} · {plan.duration} days</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleStartPlan({ name: plan.name, description: plan.description || "", duration: plan.duration, tags: plan.tags || [], id: plan.id })}
                      className="btn-ghost text-xs px-3 py-1.5">Start</button>
                    <button onClick={() => openEdit(plan)} className="p-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                      style={{ background: "var(--bg-secondary)" }} title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDeletePlan(plan.id, plan.name)} disabled={deleting === plan.id}
                      className="p-2 rounded-lg transition-colors text-red-400 hover:text-red-300"
                      style={{ background: "rgba(239,68,68,0.1)" }} title="Delete">
                      {deleting === plan.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Preset plans */}
          <div>
            <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <Star size={15} className="text-primary" />
              Popular Plans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRESET_READING_PLANS.map((plan) => {
                const alreadyStarted = myProgress.some((p) => p.planName === plan.name);
                return (
                  <div key={plan.name} className="card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, rgba(29,78,216,0.15), oklch(from var(--primary) l c h / 0.12))" }}>
                        <BookOpen size={20} className="text-primary" />
                      </div>
                      <span className="badge-cobalt">{plan.duration} days</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{plan.description}</p>
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
                        : { background: "var(--primary)", color: "#1a0a0a" }}>
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
              <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users size={15} className="text-primary" />
                Community Plans
              </h2>
              <div className="space-y-3">
                {publicPlans.map((plan) => (
                  <div key={plan.id} className="card p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">{plan.name}</h4>
                      <p className="text-xs text-muted-foreground">{plan.duration} days · {plan.completionCount} completed</p>
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
