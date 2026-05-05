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
  getUserGroups,
  getGroupReadingPlans,
  startGroupPlanProgress,
  getGroupPlanProgress,
  markGroupPlanDayComplete,
} from "@/lib/firestore";
import type { ReadingPlan, UserPlanProgress, Group, GroupPlanProgress } from "@/types";
import {
  BIBLE_BOOKS, PRESET_READING_PLANS, getPlanDayReading,
  registerPlanSequence, getTotalChaptersForBooks,
} from "@/lib/bible-data";
import {
  ListChecks, Plus, Check, ChevronRight, BookOpen, Users,
  Star, Loader2, Target, ArrowRight, Pencil, Trash2, Globe, Lock, X, User,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface PlanForm {
  name: string;
  description: string;
  duration: number;
  isPublic: boolean;
  selectedBooks: string[];
  assignTo: "personal" | "group";
  targetGroupId: string;
}

const DEFAULT_FORM: PlanForm = {
  name: "", description: "", duration: 30, isPublic: false, selectedBooks: [],
  assignTo: "personal", targetGroupId: "",
};

const OT_BOOKS = BIBLE_BOOKS.filter((b) => b.testament === "OT");
const NT_BOOKS = BIBLE_BOOKS.filter((b) => b.testament === "NT");

const BOOK_PRESETS = [
  { label: "NT", books: NT_BOOKS.map((b) => b.id) },
  { label: "Gospels", books: ["MAT", "MRK", "LUK", "JHN"] },
  { label: "Epistles", books: ["ROM","1CO","2CO","GAL","EPH","PHP","COL","1TH","2TH","1TI","2TI","TIT","PHM","HEB","JAS","1PE","2PE","1JN","2JN","3JN","JUD"] },
  { label: "Wisdom", books: ["PSA", "PRO", "JOB", "ECC", "SNG"] },
  { label: "OT", books: OT_BOOKS.map((b) => b.id) },
];

export default function PlansPage() {
  const { user } = useAuthStore();
  const [myProgress,       setMyProgress]       = useState<UserPlanProgress[]>([]);
  const [publicPlans,      setPublicPlans]       = useState<ReadingPlan[]>([]);
  const [myCreatedPlans,   setMyCreatedPlans]    = useState<ReadingPlan[]>([]);
  const [myGroups,         setMyGroups]          = useState<Group[]>([]);
  const [groupPlans,       setGroupPlans]        = useState<ReadingPlan[]>([]);
  const [groupProgress,    setGroupProgress]     = useState<GroupPlanProgress[]>([]);
  const [loading,          setLoading]           = useState(true);
  const [planMap,          setPlanMap]           = useState<Map<string, ReadingPlan>>(new Map());
  const [activeTab,        setActiveTab]         = useState<"active" | "group" | "create" | "browse">("active");
  const [starting,         setStarting]          = useState<string | null>(null);
  const [showForm,         setShowForm]          = useState(false);
  const [editingPlan,      setEditingPlan]       = useState<ReadingPlan | null>(null);
  const [form,             setForm]              = useState<PlanForm>(DEFAULT_FORM);
  const [saving,           setSaving]            = useState(false);
  const [deleting,         setDeleting]          = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserPlanProgress(user.uid),
      getPublicReadingPlans(),
      getUserReadingPlans(user.uid),
      getUserGroups(user.uid),
    ]).then(async ([prog, plans, created, groups]) => {
      setMyProgress(prog);
      setPublicPlans(plans);
      setMyCreatedPlans(created);
      setMyGroups(groups);

      const map = new Map<string, ReadingPlan>();
      [...plans, ...created].forEach((p) => {
        map.set(p.id, p);
        map.set(p.name, p);
        if (p.selectedBooks?.length) registerPlanSequence(p.name, p.selectedBooks);
      });
      setPlanMap(map);

      // Load group plans for all user's groups
      if (groups.length > 0) {
        const gPlansArrays = await Promise.all(groups.map(g => getGroupReadingPlans(g.id)));
        const allGroupPlans = gPlansArrays.flat();
        setGroupPlans(allGroupPlans);

        // Load user's group plan progress
        const allProgress = await Promise.all(
          allGroupPlans.map(p => getGroupPlanProgress(p.groupId!, p.id))
        );
        const myGProgress = allProgress.flat().filter(p => p.userId === user.uid);
        setGroupProgress(myGProgress);

        // Register sequences
        allGroupPlans.forEach(p => {
          if (p.selectedBooks?.length) registerPlanSequence(p.name, p.selectedBooks);
          map.set(p.id, p);
          map.set(p.name, p);
        });
        setPlanMap(new Map(map));
      }
    }).finally(() => setLoading(false));
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
    toast.success("Day marked complete!");
  }

  async function handleJoinGroupPlan(plan: ReadingPlan) {
    if (!user || !plan.groupId) return;
    setStarting(plan.id);
    try {
      await startGroupPlanProgress(plan.groupId, plan.id, plan.name, user.uid);
      const progress = await getGroupPlanProgress(plan.groupId, plan.id);
      const myNew = progress.filter(p => p.userId === user.uid);
      setGroupProgress(prev => [...prev.filter(p => p.planId !== plan.id), ...myNew]);
      toast.success(`Joined "${plan.name}"!`);
    } catch {
      toast.error("Failed to join plan");
    } finally {
      setStarting(null);
    }
  }

  async function handleMarkGroupDay(progressId: string, dayNum: number, planId: string, groupId: string) {
    if (!user) return;
    try {
      await markGroupPlanDayComplete(progressId, dayNum);
      const progress = await getGroupPlanProgress(groupId, planId);
      const myNew = progress.filter(p => p.userId === user.uid);
      setGroupProgress(prev => [...prev.filter(p => p.planId !== planId), ...myNew]);
      toast.success("Day marked complete!");
    } catch {
      toast.error("Failed to mark day");
    }
  }

  async function handleSavePlan() {
    if (!user || !form.name.trim()) return;
    if (form.assignTo === "group" && !form.targetGroupId) {
      toast.error("Select a group to assign this plan to");
      return;
    }
    setSaving(true);
    try {
      const planName = form.name.trim();
      if (editingPlan) {
        await updateReadingPlan(editingPlan.id, {
          name: planName,
          description: form.description.trim(),
          duration: form.duration,
          isPublic: form.isPublic,
          ...(form.selectedBooks.length ? { selectedBooks: form.selectedBooks } : {}),
        });
        if (form.selectedBooks.length) registerPlanSequence(planName, form.selectedBooks);
        toast.success("Plan updated!");
      } else {
        await createReadingPlan({
          name: planName,
          description: form.description.trim(),
          duration: form.duration,
          isPublic: form.isPublic,
          createdBy: user.uid,
          days: [],
          memberIds: [],
          tags: [],
          ...(form.selectedBooks.length ? { selectedBooks: form.selectedBooks } : {}),
          ...(form.assignTo === "group" && form.targetGroupId ? { groupId: form.targetGroupId } : {}),
        });
        if (form.selectedBooks.length) registerPlanSequence(planName, form.selectedBooks);
        toast.success(form.assignTo === "group" ? "Group plan created!" : "Plan created!");
      }
      const updated = await getUserReadingPlans(user.uid);
      const updatedMap = new Map(planMap);
      updated.forEach((p) => {
        updatedMap.set(p.id, p);
        updatedMap.set(p.name, p);
        if (p.selectedBooks?.length) registerPlanSequence(p.name, p.selectedBooks);
      });
      setPlanMap(updatedMap);
      setMyCreatedPlans(updated);

      // Refresh group plans if created for a group
      if (form.assignTo === "group" && form.targetGroupId) {
        const gPlans = await getGroupReadingPlans(form.targetGroupId);
        setGroupPlans(prev => [...prev.filter(p => p.groupId !== form.targetGroupId), ...gPlans]);
        setActiveTab("group");
      }

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
    setForm({ name: plan.name, description: plan.description || "", duration: plan.duration, isPublic: plan.isPublic, selectedBooks: plan.selectedBooks || [], assignTo: "personal", targetGroupId: "" });
    setShowForm(true);
  }

  function toggleBook(bookId: string) {
    setForm((f) => ({
      ...f,
      selectedBooks: f.selectedBooks.includes(bookId)
        ? f.selectedBooks.filter((b) => b !== bookId)
        : [...f.selectedBooks, bookId],
    }));
  }

  function applyPreset(books: string[]) {
    setForm((f) => ({ ...f, selectedBooks: books }));
  }

  function openCreate() {
    setEditingPlan(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  }

  return (
    <div className="pg">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: 28, letterSpacing: "-0.015em", margin: "0 0 4px", color: "var(--ink-1)" }}>Study plans</h1>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>Structured reading paths — personal or shared with your group.</p>
        </div>
        <button onClick={openCreate} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={13} /> New Plan
        </button>
      </div>

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="card p-6 w-full max-w-lg space-y-4 my-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">{editingPlan ? "Edit Plan" : "Create Reading Plan"}</h2>
              <button onClick={() => { setShowForm(false); setEditingPlan(null); setForm(DEFAULT_FORM); }}>
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            {/* Assign to */}
            {!editingPlan && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Assign to</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setForm(f => ({ ...f, assignTo: "personal", targetGroupId: "" }))}
                    className={form.assignTo === "personal" ? "btn-primary btn-sm" : "btn btn-sm"}
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <User size={12} /> Myself
                  </button>
                  <button
                    onClick={() => setForm(f => ({ ...f, assignTo: "group" }))}
                    disabled={myGroups.length === 0}
                    className={form.assignTo === "group" ? "btn-primary btn-sm" : "btn btn-sm"}
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <Users size={12} /> A Group
                  </button>
                  {myGroups.length === 0 && (
                    <span style={{ fontSize: 12, color: "var(--ink-4)", alignSelf: "center" }}>Join a group first</span>
                  )}
                </div>
                {form.assignTo === "group" && myGroups.length > 0 && (
                  <select
                    value={form.targetGroupId}
                    onChange={e => setForm(f => ({ ...f, targetGroupId: e.target.value }))}
                    className="input-field mt-2"
                  >
                    <option value="">Select group…</option>
                    {myGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Plan name</label>
                <input className="input-field" placeholder="e.g. Gospels in 30 Days"
                  value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Duration (days)</label>
                <input type="number" min={1} max={365} className="input-field"
                  value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))} />
              </div>
              <div className="flex items-end pb-0.5">
                <div className="flex items-center gap-2.5">
                  <button onClick={() => setForm((f) => ({ ...f, isPublic: !f.isPublic }))}
                    className={`toggle-track ${form.isPublic ? "on" : ""}`} aria-label="Toggle public">
                    <span className="toggle-thumb" />
                  </button>
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    {form.isPublic ? <Globe size={13} /> : <Lock size={13} />}
                    {form.isPublic ? "Public" : "Private"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Description (optional)</label>
              <textarea className="input-field resize-none" rows={2} placeholder="What will readers study?"
                value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>

            {/* Book selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Books to read
                  {form.selectedBooks.length > 0 && (
                    <span className="ml-2 text-primary">
                      {form.selectedBooks.length} books · {getTotalChaptersForBooks(form.selectedBooks)} chapters
                      {" "}≈ {Math.ceil(getTotalChaptersForBooks(form.selectedBooks) / form.duration)} ch/day
                    </span>
                  )}
                </label>
                {form.selectedBooks.length > 0 && (
                  <button onClick={() => setForm((f) => ({ ...f, selectedBooks: [] }))}
                    className="text-xs text-muted-foreground hover:text-foreground">
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {BOOK_PRESETS.map((p) => (
                  <button key={p.label} onClick={() => applyPreset(p.books)}
                    className="text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border transition-colors">
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-secondary px-3 py-1.5 border-b border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Old Testament</span>
                </div>
                <div className="p-2 grid grid-cols-8 sm:grid-cols-10 gap-1">
                  {OT_BOOKS.map((b) => (
                    <button key={b.id} onClick={() => toggleBook(b.id)} title={`${b.name} (${b.chapters} ch)`}
                      className={`text-[10px] px-1 py-1 rounded font-medium transition-all text-center ${form.selectedBooks.includes(b.id) ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-secondary"}`}>
                      {b.abbreviation}
                    </button>
                  ))}
                </div>
                <div className="bg-secondary px-3 py-1.5 border-t border-b border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">New Testament</span>
                </div>
                <div className="p-2 grid grid-cols-8 sm:grid-cols-10 gap-1">
                  {NT_BOOKS.map((b) => (
                    <button key={b.id} onClick={() => toggleBook(b.id)} title={`${b.name} (${b.chapters} ch)`}
                      className={`text-[10px] px-1 py-1 rounded font-medium transition-all text-center ${form.selectedBooks.includes(b.id) ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-secondary"}`}>
                      {b.abbreviation}
                    </button>
                  ))}
                </div>
              </div>
              {form.selectedBooks.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1.5">No books selected — you can still create the plan and add content later</p>
              )}
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
      <div className="underline-tabs" style={{ marginBottom: 24 }}>
        {[
          { id: "active",  label: "My Plans",    badge: myProgress.length },
          { id: "group",   label: "Group Plans",  badge: groupPlans.length },
          { id: "create",  label: "Created",      badge: myCreatedPlans.length },
          { id: "browse",  label: "Browse",       badge: 0 },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={activeTab === tab.id ? "utab active" : "utab"}>
            {tab.label}
            {tab.badge > 0 && (
              <span style={{ color: "var(--ink-4)", marginLeft: 4 }}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : activeTab === "active" ? (
        // ── MY PERSONAL PLANS ──
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
                const planData = planMap.get(prog.planId) ?? planMap.get(prog.planName);
                const presetPlan = PRESET_READING_PLANS.find((p) => p.name === prog.planName);
                const duration = planData?.duration ?? presetPlan?.duration ?? 30;
                const pct = Math.min(100, Math.round((prog.completedDays.length / duration) * 100));
                const todayNum = prog.currentDay;
                const todayDone = prog.completedDays.includes(todayNum);
                const dayReading = getPlanDayReading(prog.planName, todayNum);

                return (
                  <div key={prog.id} className="card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                      <div>
                        <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 400, letterSpacing: "-0.01em", color: "var(--ink-1)", margin: "0 0 4px" }}>{prog.planName}</h3>
                        <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>Started {prog.startDate} · Day {todayNum} of {duration}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 400, color: "var(--ds-accent-ink)", margin: 0 }}>{pct}%</p>
                        <p style={{ fontSize: 11, color: "var(--ink-3)", margin: 0 }}>complete</p>
                      </div>
                    </div>
                    <div style={{ height: 4, background: "var(--paper-3)", borderRadius: 2, overflow: "hidden", marginBottom: 16 }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "var(--ds-accent)", borderRadius: 2 }} />
                    </div>
                    <div className={`p-3 rounded-xl border ${todayDone ? "bg-green-500/8 border-green-500/30" : "bg-secondary border-border"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {todayDone
                            ? <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-green-500/20"><Check size={16} className="text-green-500" /></div>
                            : <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10"><BookOpen size={16} className="text-primary" /></div>}
                          <div>
                            <p className="text-sm font-medium text-foreground">{todayDone ? "Day complete!" : `Day ${todayNum}`}</p>
                            {dayReading && <p className="text-xs font-semibold mt-0.5 text-primary">{dayReading.label}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {dayReading && !todayDone && (
                            <Link href={`/dashboard/bible?book=${dayReading.bookId}&chapter=${dayReading.chapter}`}
                              className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors bg-accent">
                              Read <ArrowRight size={11} />
                            </Link>
                          )}
                          {!todayDone && (
                            <button onClick={() => handleMarkDay(prog.id, todayNum)} className="btn-primary text-xs px-4 py-2">
                              Mark Done
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-2">Recent days</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {Array.from({ length: Math.min(14, todayNum + 2) }, (_, i) => i + 1).map((day) => (
                          <div key={day} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${prog.completedDays.includes(day) ? "bg-primary text-primary-foreground" : day === todayNum ? "bg-secondary text-primary ring-2 ring-primary/30" : "bg-secondary text-muted-foreground opacity-40"}`}>
                            {day}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Check size={11} className="text-green-500" />{prog.completedDays.length} days done</span>
                      <span className="flex items-center gap-1"><Target size={11} />{Math.max(0, duration - prog.completedDays.length)} remaining</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      ) : activeTab === "group" ? (
        // ── GROUP PLANS ──
        <div>
          {myGroups.length === 0 ? (
            <div className="text-center py-16 card">
              <Users size={40} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-base font-semibold text-foreground mb-2">No groups yet</h3>
              <p className="text-sm text-muted-foreground mb-6">Join or create a group to share reading plans</p>
              <Link href="/dashboard/groups" className="btn-primary mx-auto px-6">Find Groups</Link>
            </div>
          ) : groupPlans.length === 0 ? (
            <div className="text-center py-16 card">
              <BookOpen size={40} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-base font-semibold text-foreground mb-2">No group plans yet</h3>
              <p className="text-sm text-muted-foreground mb-6">Create a plan and assign it to one of your groups</p>
              <button onClick={openCreate} className="btn-primary mx-auto px-6"><Plus size={14} /> Create Group Plan</button>
            </div>
          ) : (
            <div className="space-y-4">
              {groupPlans.map(plan => {
                const myProg = groupProgress.find(p => p.planId === plan.id);
                const group = myGroups.find(g => g.id === plan.groupId);
                const pct = myProg ? Math.min(100, Math.round((myProg.completedDays.length / plan.duration) * 100)) : 0;
                const todayNum = myProg?.currentDay ?? 1;
                const todayDone = myProg?.completedDays.includes(todayNum) ?? false;
                const dayReading = myProg ? getPlanDayReading(plan.name, todayNum) : null;

                return (
                  <div key={plan.id} className="card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 400, color: "var(--ink-1)", margin: 0 }}>{plan.name}</h3>
                          {group && <span className="badge" style={{ fontSize: 11 }}>{group.name}</span>}
                        </div>
                        <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>{plan.duration} days · {plan.description || "Group reading plan"}</p>
                      </div>
                      {myProg ? (
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 400, color: "var(--ds-accent-ink)", margin: 0 }}>{pct}%</p>
                          <p style={{ fontSize: 11, color: "var(--ink-3)", margin: 0 }}>your progress</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleJoinGroupPlan(plan)}
                          disabled={starting === plan.id}
                          className="btn-primary btn-sm"
                        >
                          {starting === plan.id ? <Loader2 size={12} className="animate-spin" /> : "Join Plan"}
                        </button>
                      )}
                    </div>

                    {myProg && (
                      <>
                        <div style={{ height: 4, background: "var(--paper-3)", borderRadius: 2, overflow: "hidden", marginBottom: 12 }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "var(--ds-accent)", borderRadius: 2 }} />
                        </div>
                        <div className={`p-3 rounded-xl border ${todayDone ? "bg-green-500/8 border-green-500/30" : "bg-secondary border-border"}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {todayDone
                                ? <div className="w-7 h-7 rounded-full flex items-center justify-center bg-green-500/20"><Check size={14} className="text-green-500" /></div>
                                : <div className="w-7 h-7 rounded-full flex items-center justify-center bg-primary/10"><BookOpen size={14} className="text-primary" /></div>}
                              <div>
                                <p className="text-sm font-medium text-foreground">{todayDone ? "Day complete!" : `Day ${todayNum}`}</p>
                                {dayReading && <p className="text-xs font-semibold mt-0.5 text-primary">{dayReading.label}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {dayReading && !todayDone && (
                                <Link href={`/dashboard/bible?book=${dayReading.bookId}&chapter=${dayReading.chapter}`}
                                  className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 bg-accent">
                                  Read <ArrowRight size={11} />
                                </Link>
                              )}
                              {!todayDone && (
                                <button onClick={() => handleMarkGroupDay(myProg.id, todayNum, plan.id, plan.groupId!)}
                                  className="btn-primary text-xs px-3 py-1.5">
                                  Mark Done
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      ) : activeTab === "create" ? (
        // ── MY CREATED PLANS ──
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{myCreatedPlans.length} plan{myCreatedPlans.length !== 1 ? "s" : ""} created by you</p>
            <button onClick={openCreate} className="btn-primary text-xs px-4 py-2"><Plus size={14} /> New Plan</button>
          </div>
          {myCreatedPlans.length === 0 ? (
            <div className="text-center py-16 card">
              <BookOpen size={40} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-base font-semibold text-foreground mb-2">No plans yet</h3>
              <p className="text-sm text-muted-foreground mb-6">Create a custom reading plan for yourself or a group</p>
              <button onClick={openCreate} className="btn-primary mx-auto px-6"><Plus size={16} /> Create First Plan</button>
            </div>
          ) : (
            <div className="space-y-3">
              {myCreatedPlans.map((plan) => (
                <div key={plan.id} className="card p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground truncate">{plan.name}</h4>
                      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border ${plan.isPublic ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-secondary text-muted-foreground border-border"}`}>
                        {plan.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                        {plan.isPublic ? "Public" : "Private"}
                      </span>
                      {plan.groupId && (
                        <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border bg-blue-500/10 text-blue-600 border-blue-500/30">
                          <Users size={10} /> Group
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{plan.description || "No description"} · {plan.duration} days</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!plan.groupId && (
                      <button onClick={() => handleStartPlan({ name: plan.name, description: plan.description || "", duration: plan.duration, tags: plan.tags || [], id: plan.id })}
                        className="btn-ghost text-xs px-3 py-1.5">Start</button>
                    )}
                    <button onClick={() => openEdit(plan)} className="p-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground bg-secondary" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDeletePlan(plan.id, plan.name)} disabled={deleting === plan.id}
                      className="p-2 rounded-lg transition-colors text-red-400 hover:text-red-300 bg-destructive/10" title="Delete">
                      {deleting === plan.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      ) : (
        // ── BROWSE ──
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <Star size={15} className="text-primary" /> Popular Plans
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {PRESET_READING_PLANS.map((plan) => {
                const alreadyStarted = myProgress.some((p) => p.planName === plan.name);
                return (
                  <div key={plan.name} className="card card-tinted" style={{ padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ fontFamily: "var(--font-serif)", fontSize: 16, color: "var(--ink-1)", flex: 1 }}>{plan.name}</div>
                      <span className="badge-accent" style={{ marginLeft: 8, flexShrink: 0 }}>{plan.duration}d</span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 12, lineHeight: 1.55 }}>{plan.description}</p>
                    <button onClick={() => handleStartPlan(plan)} disabled={alreadyStarted || starting === plan.name}
                      className={alreadyStarted ? "btn" : "btn-primary"} style={{ width: "100%", justifyContent: "center" }}>
                      {starting === plan.name ? <Loader2 size={14} className="animate-spin" />
                        : alreadyStarted ? <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Check size={12} /> In Progress</span>
                        : "Start Plan"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          {publicPlans.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users size={15} className="text-primary" /> Community Plans
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
