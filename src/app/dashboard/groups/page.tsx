"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { createGroup, getUserGroups, joinGroup } from "@/lib/firestore";
import type { Group } from "@/types";
import { Users, Plus, X, Search, Globe, Lock, ArrowRight, MessageCircle, BookOpen } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { getInitials, timeAgo } from "@/lib/utils";

export default function GroupsPage() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "", isPublic: true });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserGroups(user.uid)
      .then(setGroups)
      .finally(() => setLoading(false));
  }, [user]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newGroup.name.trim()) return;
    setCreating(true);
    try {
      const id = await createGroup({
        name: newGroup.name,
        description: newGroup.description,
        createdBy: user.uid,
        memberIds: [user.uid],
        adminIds: [user.uid],
        isPublic: newGroup.isPublic,
        tags: [],
      });
      const group: Group = {
        id,
        name: newGroup.name,
        description: newGroup.description,
        createdBy: user.uid,
        createdAt: new Date(),
        memberIds: [user.uid],
        adminIds: [user.uid],
        isPublic: newGroup.isPublic,
        tags: [],
      };
      setGroups((prev) => [group, ...prev]);
      setShowCreate(false);
      setNewGroup({ name: "", description: "", isPublic: true });
      toast.success("Group created!");
    } catch {
      toast.error("Failed to create group");
    } finally {
      setCreating(false);
    }
  }

  const GROUP_COLORS = [
    "from-cobalt-900/20 to-gold-500/10",
    "from-purple-900/20 to-blue-900/10",
    "from-emerald-900/20 to-teal-900/10",
    "from-amber-900/20 to-orange-900/10",
  ];

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 32px 48px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: 28, letterSpacing: "-0.015em", margin: "0 0 4px", color: "var(--ink-1)" }}>Groups</h1>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>Read together. Annotate together.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={13} /> New group
        </button>
      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md rounded-2xl p-6 animate-slide-up bg-card border border-border">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-display font-bold text-foreground">Create a Study Group</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Group Name</label>
                <input type="text" value={newGroup.name} onChange={(e) => setNewGroup((g) => ({ ...g, name: e.target.value }))}
                  placeholder="e.g. Morning Devotions, Youth Bible Study" required className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Description (optional)</label>
                <textarea value={newGroup.description} onChange={(e) => setNewGroup((g) => ({ ...g, description: e.target.value }))}
                  placeholder="What is this group about?" rows={3} className="input-field resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Visibility</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setNewGroup((g) => ({ ...g, isPublic: true }))}
                    className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${newGroup.isPublic ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground opacity-60"}`}>
                    <Globe size={16} /> Public
                  </button>
                  <button type="button" onClick={() => setNewGroup((g) => ({ ...g, isPublic: false }))}
                    className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${!newGroup.isPublic ? "bg-secondary border-border text-foreground" : "border-border text-muted-foreground opacity-60"}`}>
                    <Lock size={16} /> Private
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={creating} className="btn-crimson flex-1">
                  {creating ? "Creating..." : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* My Groups */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl animate-pulse bg-card" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 card">
          <Users size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No groups yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Create a group or join one to study together</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto px-6">
            <Plus size={16} /> Create Your First Group
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {groups.map((group, i) => {
            const hues = [30, 100, 170, 240, 300];
            return (
              <Link key={group.id} href={`/dashboard/groups/${group.id}`}
                className="card" style={{ padding: 20, textDecoration: "none", display: "block" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, letterSpacing: "-0.01em", marginBottom: 2, color: "var(--ink-1)" }}>{group.name}</div>
                    {group.description && (
                      <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{group.description}</div>
                    )}
                  </div>
                  <span className={`badge-accent`} style={{ marginLeft: 8 }}>Active</span>
                </div>
                {/* Member avatar stack */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ display: "flex" }}>
                    {group.memberIds.slice(0, 4).map((_, j) => (
                      <div key={j} style={{
                        width: 24, height: 24, borderRadius: "50%", fontSize: 10, fontWeight: 500,
                        marginLeft: j ? -6 : 0,
                        background: `oklch(72% 0.04 ${hues[j % hues.length]})`,
                        border: "2px solid var(--paper)", color: "white",
                        display: "grid", placeItems: "center",
                      }}>
                        {String.fromCharCode(65 + j)}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{group.memberIds.length} member{group.memberIds.length !== 1 ? "s" : ""}</div>
                </div>
                <hr style={{ border: "none", borderTop: "1px solid var(--hairline)", margin: "4px 0 12px" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    {group.isPublic ? "Public" : "Private"} group
                  </div>
                  <span className="btn btn-sm">Open</span>
                </div>
              </Link>
            );
          })}
          {/* New group card */}
          <button onClick={() => setShowCreate(true)} style={{
            border: "1px dashed var(--hairline-2)", borderRadius: 12,
            display: "grid", placeItems: "center", minHeight: 180, color: "var(--ink-3)",
            fontSize: 13, background: "transparent", cursor: "pointer", fontFamily: "var(--font-ui)",
          }}>
            <div style={{ textAlign: "center" }}>
              <Plus size={18} style={{ color: "var(--ink-4)", margin: "0 auto 8px" }} />
              <div>Start a new group</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 2 }}>Invite up to 12 members</div>
            </div>
          </button>
        </div>
      )}

      {/* Features info */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: BookOpen, title: "Shared Bible", desc: "Annotate scripture together as a group" },
          { icon: MessageCircle, title: "Group Chat", desc: "Discuss passages and share insights" },
          { icon: Users, title: "Group Plans", desc: "Follow reading plans as a community" },
        ].map((f) => (
          <div key={f.title} className="card p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--accent)"}}>
              <f.icon size={18} className="text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">{f.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
