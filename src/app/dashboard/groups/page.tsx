"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import {
  createGroup, getUserGroups, getPublicGroups, joinGroup, joinGroupByCode,
} from "@/lib/firestore";
import type { Group } from "@/types";
import {
  Users, Plus, X, Globe, Lock, BookOpen, MessageCircle, Copy, Check,
  Hash, ArrowRight, Loader2,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

// ── helpers ───────────────────────────────────────────────────────────────────

const HUES = [30, 100, 170, 240, 300];
function groupHue(id: string) { return HUES[id.charCodeAt(0) % HUES.length]; }

// ── page ──────────────────────────────────────────────────────────────────────

export default function GroupsPage() {
  const { user } = useAuthStore();
  const [myGroups,     setMyGroups]     = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState<"mine" | "discover">("mine");

  // create modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState({ name: "", description: "", isPublic: true });
  const [creating, setCreating]     = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // join-by-code
  const [joinCode,   setJoinCode]   = useState("");
  const [joining,    setJoining]    = useState(false);

  // joining a public group
  const [joiningId,  setJoiningId]  = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserGroups(user.uid),
      getPublicGroups(user.groupIds || []),
    ]).then(([mine, pub]) => {
      setMyGroups(mine);
      setPublicGroups(pub);
    }).finally(() => setLoading(false));
  }, [user]);

  // ── Create ──

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !form.name.trim()) return;
    setCreating(true);
    try {
      const id = await createGroup({
        name: form.name.trim(),
        description: form.description.trim(),
        createdBy: user.uid,
        memberIds: [user.uid],
        adminIds:  [user.uid],
        isPublic:  form.isPublic,
        tags: [],
      });
      const freshGroup = await import("@/lib/firestore").then(m => m.getGroup(id));
      if (freshGroup) {
        setMyGroups(prev => [freshGroup, ...prev]);
        if (!form.isPublic && freshGroup.joinCode) {
          setCreatedCode(freshGroup.joinCode);
        } else {
          closeCreate();
          toast.success("Group created!");
        }
      }
    } catch {
      toast.error("Failed to create group");
    } finally {
      setCreating(false);
    }
  }

  function closeCreate() {
    setShowCreate(false);
    setCreatedCode(null);
    setCodeCopied(false);
    setForm({ name: "", description: "", isPublic: true });
  }

  async function copyCode() {
    if (!createdCode) return;
    await navigator.clipboard.writeText(createdCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  // ── Join by code ──

  async function handleJoinByCode(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !joinCode.trim()) return;
    setJoining(true);
    try {
      const group = await joinGroupByCode(joinCode.trim(), user.uid);
      setMyGroups(prev => [group, ...prev.filter(g => g.id !== group.id)]);
      setPublicGroups(prev => prev.filter(g => g.id !== group.id));
      setJoinCode("");
      toast.success(`Joined "${group.name}"!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid code";
      toast.error(msg);
    } finally {
      setJoining(false);
    }
  }

  // ── Join public group ──

  async function handleJoinPublic(group: Group) {
    if (!user) return;
    setJoiningId(group.id);
    try {
      await joinGroup(group.id, user.uid);
      setMyGroups(prev => [group, ...prev]);
      setPublicGroups(prev => prev.filter(g => g.id !== group.id));
      toast.success(`Joined "${group.name}"!`);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "already-exists") toast.error("Already a member");
      else toast.error("Failed to join group");
    } finally {
      setJoiningId(null);
    }
  }

  // ── render ──

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "28px 24px 56px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink-1)", margin: "0 0 2px", letterSpacing: "-0.01em" }}>Groups</h1>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>Study together, grow together</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm" style={{ padding: "0 14px", height: 34, display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={13} /> New Group
          </button>
        </div>
      </div>

      {/* Join by code bar */}
      <form onSubmit={handleJoinByCode} style={{
        display: "flex", gap: 8, marginBottom: 24,
        background: "var(--paper-2)", border: "1px solid var(--hairline)",
        borderRadius: 10, padding: "10px 12px",
      }}>
        <Hash size={15} style={{ color: "var(--ink-4)", flexShrink: 0, marginTop: 2 }} />
        <input
          value={joinCode}
          onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
          placeholder="Have a join code? Enter it here…"
          className="input-field"
          style={{ flex: 1, height: 28, fontSize: 13, background: "transparent", border: "none", boxShadow: "none", padding: 0 }}
        />
        <button type="submit" disabled={joinCode.length < 6 || joining} className="btn-primary btn-sm" style={{ padding: "0 12px" }}>
          {joining ? <Loader2 size={13} className="animate-spin" /> : "Join"}
        </button>
      </form>

      {/* Tabs */}
      <div className="tab-list" style={{ marginBottom: 20 }}>
        <button className={`tab-item${tab === "mine" ? " active" : ""}`} onClick={() => setTab("mine")}>
          My Groups {!loading && myGroups.length > 0 && (
            <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 999, background: "var(--accent-soft-2)", color: "var(--accent-ink)", fontSize: 10.5, fontWeight: 600 }}>
              {myGroups.length}
            </span>
          )}
        </button>
        <button className={`tab-item${tab === "discover" ? " active" : ""}`} onClick={() => setTab("discover")}>
          Discover
        </button>
      </div>

      {/* ── MY GROUPS ── */}
      {tab === "mine" && (
        <div>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {[1, 2].map(i => <div key={i} style={{ height: 160, borderRadius: 12, background: "var(--paper-2)", border: "1px solid var(--hairline)" }} />)}
            </div>
          ) : myGroups.length === 0 ? (
            <div className="card" style={{ padding: "56px 24px", textAlign: "center" }}>
              <Users size={36} style={{ margin: "0 auto 12px", color: "var(--ink-4)" }} />
              <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-1)", margin: "0 0 4px" }}>No groups yet</p>
              <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 20px" }}>Create a group or discover public ones</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm" style={{ padding: "0 16px" }}>
                  <Plus size={12} /> Create Group
                </button>
                <button onClick={() => setTab("discover")} className="btn btn-sm" style={{ padding: "0 16px" }}>
                  Discover Groups
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {myGroups.map(group => <GroupCard key={group.id} group={group} />)}
              <button
                onClick={() => setShowCreate(true)}
                style={{
                  border: "1px dashed var(--hairline-2)", borderRadius: 12,
                  minHeight: 150, display: "grid", placeItems: "center",
                  background: "transparent", cursor: "pointer", color: "var(--ink-3)", fontFamily: "var(--font-ui)",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <Plus size={18} style={{ color: "var(--ink-4)", margin: "0 auto 8px" }} />
                  <div style={{ fontSize: 13 }}>New group</div>
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── DISCOVER ── */}
      {tab === "discover" && (
        <div>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[1, 2, 3].map(i => <div key={i} style={{ height: 72, borderRadius: 10, background: "var(--paper-2)", border: "1px solid var(--hairline)" }} />)}
            </div>
          ) : publicGroups.length === 0 ? (
            <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
              <Globe size={36} style={{ margin: "0 auto 12px", color: "var(--ink-4)" }} />
              <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-1)", margin: "0 0 4px" }}>No public groups yet</p>
              <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>Be the first — create a public group</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {publicGroups.map(group => (
                <div key={group.id} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: `oklch(88% 0.04 ${groupHue(group.id)})`,
                    display: "grid", placeItems: "center",
                    fontSize: 14, fontWeight: 600, color: `oklch(40% 0.06 ${groupHue(group.id)})`,
                  }}>
                    {group.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-1)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{group.name}</p>
                    <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>
                      {group.memberIds.length} member{group.memberIds.length !== 1 ? "s" : ""}
                      {group.description && ` · ${group.description.slice(0, 60)}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleJoinPublic(group)}
                    disabled={joiningId === group.id}
                    className="btn-primary btn-sm"
                    style={{ padding: "0 14px", flexShrink: 0 }}
                  >
                    {joiningId === group.id ? <Loader2 size={12} className="animate-spin" /> : "Join"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Feature callouts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginTop: 32 }}>
        {[
          { Icon: BookOpen,      title: "Shared Notes",  desc: "Annotate scripture together" },
          { Icon: MessageCircle, title: "Group Chat",    desc: "Discuss passages live" },
          { Icon: Users,         title: "Track Progress",desc: "See who has read today" },
        ].map(f => (
          <div key={f.title} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <f.Icon size={15} style={{ color: "var(--accent-ink)" }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-1)", margin: "0 0 2px" }}>{f.title}</p>
              <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Create modal ── */}
      {showCreate && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "oklch(0% 0 0 / 0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}>
          <div className="card" style={{ width: "100%", maxWidth: 440, padding: 24 }}>

            {createdCode ? (
              /* ── Join code reveal ── */
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--accent-soft)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
                  <Lock size={22} style={{ color: "var(--accent-ink)" }} />
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--ink-1)", margin: "0 0 6px" }}>Group created!</h2>
                <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 20px" }}>
                  Share this code so members can join your private group.
                </p>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  background: "var(--paper-2)", border: "1px solid var(--hairline-2)",
                  borderRadius: 10, padding: "12px 16px", marginBottom: 20,
                }}>
                  <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.15em", color: "var(--ink-1)", fontVariantNumeric: "tabular-nums" }}>
                    {createdCode}
                  </span>
                  <button onClick={copyCode} style={{ color: "var(--ink-3)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    {codeCopied ? <Check size={16} style={{ color: "var(--accent-ink)" }} /> : <Copy size={16} />}
                  </button>
                </div>
                <button onClick={closeCreate} className="btn-primary" style={{ width: "100%" }}>Done</button>
              </div>
            ) : (
              /* ── Create form ── */
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--ink-1)", margin: 0 }}>Create a Study Group</h2>
                  <button onClick={closeCreate} style={{ color: "var(--ink-3)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label className="card-label" style={{ marginBottom: 6 }}>Group Name</label>
                    <input
                      type="text" value={form.name} required
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Morning Devotions, Youth Study"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="card-label" style={{ marginBottom: 6 }}>Description <span style={{ opacity: 0.5, textTransform: "none", fontWeight: 400 }}>(optional)</span></label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="What will this group study?"
                      rows={2}
                      className="input-field"
                      style={{ resize: "none" }}
                    />
                  </div>

                  <div>
                    <label className="card-label" style={{ marginBottom: 8 }}>Privacy</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {([
                        { value: true,  label: "Public",  Icon: Globe, desc: "Anyone can join" },
                        { value: false, label: "Private", Icon: Lock,  desc: "Join by code only" },
                      ] as const).map(opt => (
                        <button
                          key={String(opt.value)}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, isPublic: opt.value }))}
                          style={{
                            flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid",
                            display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4,
                            cursor: "pointer", fontFamily: "var(--font-ui)",
                            background: form.isPublic === opt.value ? "var(--accent-soft)" : "var(--paper)",
                            borderColor: form.isPublic === opt.value ? "var(--accent-border)" : "var(--hairline)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <opt.Icon size={13} style={{ color: form.isPublic === opt.value ? "var(--accent-ink)" : "var(--ink-3)" }} />
                            <span style={{ fontSize: 13, fontWeight: 500, color: form.isPublic === opt.value ? "var(--accent-ink)" : "var(--ink-1)" }}>{opt.label}</span>
                          </div>
                          <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                    <button type="button" onClick={closeCreate} className="btn btn-sm" style={{ flex: 1, height: 36 }}>Cancel</button>
                    <button type="submit" disabled={creating || !form.name.trim()} className="btn-primary btn-sm" style={{ flex: 1, height: 36 }}>
                      {creating ? <Loader2 size={13} className="animate-spin" /> : "Create Group"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Group card component ───────────────────────────────────────────────────────

function GroupCard({ group }: { group: Group }) {
  const hue = groupHue(group.id);
  return (
    <Link href={`/dashboard/groups/${group.id}`}
      style={{ textDecoration: "none", display: "block" }}
      className="card"
    >
      <div style={{ padding: 18 }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: `oklch(88% 0.04 ${hue})`,
            display: "grid", placeItems: "center",
            fontSize: 14, fontWeight: 600, color: `oklch(40% 0.06 ${hue})`,
          }}>
            {group.name.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 500, color: "var(--ink-1)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{group.name}</p>
            {group.description && (
              <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{group.description}</p>
            )}
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--ink-4)", flexShrink: 0 }}>
            {group.isPublic ? <Globe size={11} /> : <Lock size={11} />}
            {group.isPublic ? "Public" : "Private"}
          </span>
        </div>

        {/* Member avatars */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ display: "flex" }}>
            {group.memberIds.slice(0, 5).map((_, i) => (
              <div key={i} style={{
                width: 22, height: 22, borderRadius: "50%", fontSize: 9, fontWeight: 600,
                marginLeft: i ? -5 : 0,
                background: `oklch(72% 0.05 ${HUES[i % HUES.length]})`,
                border: "2px solid var(--paper)", color: "white",
                display: "grid", placeItems: "center",
              }}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
            {group.memberIds.length} member{group.memberIds.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div style={{ borderTop: "1px solid var(--hairline)", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--ink-4)" }}>
              <MessageCircle size={11} /> Chat
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--ink-4)" }}>
              <BookOpen size={11} /> Notes
            </span>
          </div>
          <span style={{ fontSize: 12, color: "var(--accent-ink)", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
            Open <ArrowRight size={11} />
          </span>
        </div>
      </div>
    </Link>
  );
}
