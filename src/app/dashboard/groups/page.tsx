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
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-page">Study Groups</h1>
          <p className="text-sm text-secondary-page mt-1">Grow together in faith</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-gold px-4 py-2.5 text-sm">
          <Plus size={16} /> New Group
        </button>
      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md rounded-2xl p-6 animate-slide-up"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-display font-bold text-page">Create a Study Group</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-muted-page" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-page mb-1.5">Group Name</label>
                <input type="text" value={newGroup.name} onChange={(e) => setNewGroup((g) => ({ ...g, name: e.target.value }))}
                  placeholder="e.g. Morning Devotions, Youth Bible Study" required className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-page mb-1.5">Description (optional)</label>
                <textarea value={newGroup.description} onChange={(e) => setNewGroup((g) => ({ ...g, description: e.target.value }))}
                  placeholder="What is this group about?" rows={3} className="input-field resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-page mb-2">Visibility</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setNewGroup((g) => ({ ...g, isPublic: true }))}
                    className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${newGroup.isPublic ? "" : "opacity-60"}`}
                    style={newGroup.isPublic ? { background: "rgba(212,175,55,0.15)", borderColor: "rgba(212,175,55,0.4)", color: "var(--gold)" } : { borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                    <Globe size={16} /> Public
                  </button>
                  <button type="button" onClick={() => setNewGroup((g) => ({ ...g, isPublic: false }))}
                    className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${!newGroup.isPublic ? "" : "opacity-60"}`}
                    style={!newGroup.isPublic ? { background: "rgba(139,0,0,0.15)", borderColor: "rgba(139,0,0,0.4)", color: "#e05050" } : { borderColor: "var(--border)", color: "var(--text-secondary)" }}>
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
            <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: "var(--bg-card)" }} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 card">
          <Users size={48} className="mx-auto mb-4 text-muted-page" />
          <h3 className="text-lg font-semibold text-page mb-2">No groups yet</h3>
          <p className="text-secondary-page text-sm mb-6">Create a group or join one to study together</p>
          <button onClick={() => setShowCreate(true)} className="btn-gold mx-auto px-6">
            <Plus size={16} /> Create Your First Group
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-base font-semibold text-page mb-3">My Groups ({groups.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group, i) => (
              <Link key={group.id} href={`/dashboard/groups/${group.id}`}
                className="card p-5 group cursor-pointer overflow-hidden relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${GROUP_COLORS[i % GROUP_COLORS.length]} opacity-50`} />
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-gray-900"
                      style={{ background: "linear-gradient(135deg, #D4AF37, #F59E0B)" }}>
                      {getInitials(group.name)}
                    </div>
                    <div className="flex items-center gap-1">
                      {group.isPublic
                        ? <Globe size={13} className="text-muted-page" />
                        : <Lock size={13} className="text-muted-page" />}
                    </div>
                  </div>
                  <h3 className="font-semibold text-page mb-1 group-hover:text-gold-500 transition-colors">{group.name}</h3>
                  {group.description && (
                    <p className="text-xs text-secondary-page line-clamp-2 mb-3">{group.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-page">
                      <span className="flex items-center gap-1"><Users size={12} />{group.memberIds.length}</span>
                      <span className="flex items-center gap-1"><MessageCircle size={12} />Active</span>
                    </div>
                    <ArrowRight size={14} className="text-muted-page group-hover:text-gold-500 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
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
              style={{ background: "rgba(212,175,55,0.12)" }}>
              <f.icon size={18} style={{ color: "var(--gold)" }} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-page">{f.title}</h4>
              <p className="text-xs text-secondary-page mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
