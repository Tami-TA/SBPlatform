"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import {
  getGroup, subscribeToGroupMessages, sendGroupMessage,
  getGroupMemberProfiles,
  logGroupReading, getGroupReadingLogs,
  inviteFriendToGroup, getUserProfile,
  getGroupReadingPlans, startGroupPlanProgress, getGroupPlanProgress, markGroupPlanDayComplete,
  promoteToAdmin, demoteAdmin, removeGroupMember,
} from "@/lib/firestore";
import type { Group, GroupMessage, User, GroupReadingLog, ReadingPlan, GroupPlanProgress } from "@/types";
import {
  ArrowLeft, Send, BookOpen, Users, MessageCircle, Heart, Loader2,
  BookMarked, Copy, Check, Lock, Globe, UserPlus, X,
  CheckCircle2, Circle, Shield, ShieldOff, UserMinus,
} from "lucide-react";
import { timeAgo, getInitials } from "@/lib/utils";
import toast from "react-hot-toast";

const TODAY = new Date().toISOString().slice(0, 10);
const HUES = [30, 100, 170, 240, 300];

// ── sub-components ────────────────────────────────────────────────────────────

function Avatar({ name, photoURL, size = 32 }: { name: string; photoURL?: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "var(--accent-soft-2)", color: "var(--accent-ink)",
      display: "grid", placeItems: "center", overflow: "hidden",
      fontSize: size * 0.33, fontWeight: 600, border: "1px solid var(--hairline)",
    }}>
      {photoURL
        ? <img src={photoURL} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : getInitials(name)}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();

  const [group,       setGroup]       = useState<Group | null>(null);
  const [messages,    setMessages]    = useState<GroupMessage[]>([]);
  const [members,     setMembers]     = useState<User[]>([]);
  const [readLogs,    setReadLogs]    = useState<GroupReadingLog[]>([]);
  const [groupPlans,  setGroupPlans]  = useState<ReadingPlan[]>([]);
  const [groupPlanProgs, setGroupPlanProgs] = useState<GroupPlanProgress[]>([]);
  const [joiningPlan, setJoiningPlan] = useState<string | null>(null);
  const [newMessage,  setNewMessage]  = useState("");
  const [activeTab,   setActiveTab]   = useState<"chat" | "bible" | "members" | "plan">("chat");
  const [sending,     setSending]     = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const [codeCopied,  setCodeCopied]  = useState(false);
  const [showInvite,  setShowInvite]  = useState(false);

  // Friends for invite
  const [friends,     setFriends]     = useState<User[]>([]);
  const [invitingId,  setInvitingId]  = useState<string | null>(null);
  const [invitedIds,  setInvitedIds]  = useState<Set<string>>(new Set());

  // Admin member management
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [demotingId,  setDemotingId]  = useState<string | null>(null);
  const [removingId,  setRemovingId]  = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    if (!id) return;
    getGroup(id).then(g => {
      setGroup(g);
      if (g) {
        getGroupMemberProfiles(g.memberIds).then(setMembers);
        getGroupReadingLogs(id, TODAY).then(setReadLogs);
      }
    });
    getGroupReadingPlans(id).then(async plans => {
      setGroupPlans(plans);
      if (plans.length > 0 && user) {
        const progArrays = await Promise.all(plans.map(p => getGroupPlanProgress(id, p.id)));
        setGroupPlanProgs(progArrays.flat());
      }
    });
    const unsub = subscribeToGroupMessages(id, setMessages);
    return unsub;
  }, [id]);

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load friends when invite panel opens
  useEffect(() => {
    if (!showInvite || !user) return;
    Promise.all((user.friendIds || []).map(uid => getUserProfile(uid)))
      .then(profiles => setFriends(profiles.filter(Boolean) as User[]));
  }, [showInvite, user]);

  // ── Actions ──

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newMessage.trim() || !id) return;
    setSending(true);
    try {
      await sendGroupMessage({
        groupId: id,
        authorUid: user.uid,
        authorUsername: user.username,
        authorPhotoURL: user.photoURL,
        content: newMessage.trim(),
        type: "text",
      });
      setNewMessage("");
    } catch (err) {
      console.error("sendGroupMessage error:", err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  async function handleMarkRead() {
    if (!user || !id) return;
    const already = readLogs.some(l => l.userId === user.uid);
    if (already) return;
    setMarkingRead(true);
    try {
      await logGroupReading(id, user.uid, TODAY);
      setReadLogs(prev => [...prev, { id: "_local", groupId: id, userId: user.uid, date: TODAY, completed: true }]);
      toast.success("Reading marked complete!");
    } catch {
      toast.error("Failed to mark reading");
    } finally {
      setMarkingRead(false);
    }
  }

  async function handleInviteFriend(friend: User) {
    if (!user || !group) return;
    if (group.memberIds.includes(friend.uid)) { toast.error(`${friend.displayName} is already a member`); return; }
    setInvitingId(friend.uid);
    try {
      await inviteFriendToGroup(group.id, group.name, user.uid, user.username, friend.uid);
      setInvitedIds(prev => new Set([...prev, friend.uid]));
      toast.success(`Invite sent to @${friend.username}`);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "already-exists") toast.error("Invite already sent");
      else toast.error("Failed to send invite");
    } finally {
      setInvitingId(null);
    }
  }

  async function copyJoinCode() {
    if (!group?.joinCode) return;
    await navigator.clipboard.writeText(group.joinCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  async function handlePromote(uid: string, name: string) {
    if (!id) return;
    setPromotingId(uid);
    try {
      await promoteToAdmin(id, uid);
      const g = await getGroup(id);
      if (g) setGroup(g);
      toast.success(`${name} is now an admin`);
    } catch {
      toast.error("Failed to promote member");
    } finally {
      setPromotingId(null);
    }
  }

  async function handleDemote(uid: string, name: string) {
    if (!id) return;
    setDemotingId(uid);
    try {
      await demoteAdmin(id, uid);
      const g = await getGroup(id);
      if (g) setGroup(g);
      toast.success(`${name} removed from admins`);
    } catch (err) {
      if ((err as { code?: string }).code === "last-admin") {
        toast.error("Cannot demote the last admin");
      } else {
        toast.error("Failed to demote admin");
      }
    } finally {
      setDemotingId(null);
    }
  }

  async function handleRemoveMember(uid: string, name: string) {
    if (!id || !confirm(`Remove ${name} from this group?`)) return;
    setRemovingId(uid);
    try {
      await removeGroupMember(id, uid);
      const g = await getGroup(id);
      if (g) {
        setGroup(g);
        getGroupMemberProfiles(g.memberIds).then(setMembers);
      }
      toast.success(`${name} removed from group`);
    } catch (err) {
      if ((err as { code?: string }).code === "last-admin") {
        toast.error("Cannot remove the last admin");
      } else {
        toast.error("Failed to remove member");
      }
    } finally {
      setRemovingId(null);
    }
  }

  // ── Derived ──

  if (!group) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240 }}>
        <Loader2 size={22} className="animate-spin" style={{ color: "var(--ink-4)" }} />
      </div>
    );
  }

  const isAdmin   = group.adminIds.includes(user?.uid ?? "");
  const isMember  = group.memberIds.includes(user?.uid ?? "");
  const myLog     = readLogs.find(l => l.userId === user?.uid);
  const hue       = HUES[group.id.charCodeAt(0) % HUES.length];

  const TABS = [
    { id: "chat",    label: "Discussion",   Icon: MessageCircle },
    { id: "bible",   label: "Shared Bible", Icon: BookOpen      },
    { id: "members", label: "Members",      Icon: Users         },
    { id: "plan",    label: "Reading Plan", Icon: BookMarked    },
  ] as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)", overflow: "hidden" }}>

      {/* ── Group header ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "0 20px", height: 56, flexShrink: 0,
        borderBottom: "1px solid var(--hairline)",
        background: "var(--paper)",
      }}>
        <Link href="/dashboard/groups" style={{ color: "var(--ink-3)", display: "flex", alignItems: "center" }}>
          <ArrowLeft size={18} />
        </Link>
        <div style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          background: `oklch(88% 0.04 ${hue})`,
          display: "grid", placeItems: "center",
          fontSize: 13, fontWeight: 600, color: `oklch(40% 0.06 ${hue})`,
        }}>
          {group.name.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-1)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{group.name}</p>
          <p style={{ fontSize: 11.5, color: "var(--ink-3)", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
            {group.isPublic ? <Globe size={10} /> : <Lock size={10} />}
            {group.memberIds.length} member{group.memberIds.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Join code (admin + private) */}
        {isAdmin && !group.isPublic && group.joinCode && (
          <button
            onClick={copyJoinCode}
            title="Copy join code"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 6, border: "1px solid var(--hairline)",
              background: "var(--paper-2)", fontSize: 12, fontWeight: 600,
              color: "var(--ink-2)", letterSpacing: "0.05em", cursor: "pointer",
              fontFamily: "var(--font-ui)",
            }}
          >
            <Lock size={11} />
            {group.joinCode}
            {codeCopied ? <Check size={11} style={{ color: "var(--accent-ink)" }} /> : <Copy size={11} />}
          </button>
        )}

        {/* Invite button (members) */}
        {isMember && (
          <button
            onClick={() => setShowInvite(true)}
            className="btn btn-sm"
            style={{ display: "flex", alignItems: "center", gap: 5 }}
          >
            <UserPlus size={12} /> Invite
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="tab-list" style={{ paddingLeft: 20, paddingRight: 20, flexShrink: 0 }}>
        {TABS.map(t => (
          t.id === "bible" ? (
            <button
              key={t.id}
              onClick={() => router.push(`/dashboard/groups/${id}/bible`)}
              className="tab-item"
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <t.Icon size={12} />
              {t.label}
            </button>
          ) : (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as "chat" | "members" | "plan")}
              className={`tab-item${activeTab === t.id ? " active" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <t.Icon size={12} />
              {t.label}
            </button>
          )
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* ── CHAT ── */}
        {activeTab === "chat" && (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "56px 0", color: "var(--ink-4)" }}>
                  <MessageCircle size={36} style={{ margin: "0 auto 10px" }} />
                  <p style={{ fontSize: 13, margin: 0 }}>No messages yet — start the conversation!</p>
                </div>
              ) : messages.map(msg => {
                const isMe = msg.authorUid === user?.uid;
                return (
                  <div key={msg.id} style={{ display: "flex", alignItems: "flex-end", gap: 8, flexDirection: isMe ? "row-reverse" : "row" }}>
                    <Avatar name={msg.authorUsername} photoURL={msg.authorPhotoURL} size={28} />
                    <div style={{ maxWidth: "65%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                      {!isMe && (
                        <span style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 3, marginLeft: 2 }}>@{msg.authorUsername}</span>
                      )}
                      <div style={{
                        padding: "8px 12px", borderRadius: 14,
                        borderBottomRightRadius: isMe ? 4 : 14,
                        borderBottomLeftRadius:  isMe ? 14 : 4,
                        fontSize: 13.5, lineHeight: 1.5,
                        background: isMe ? "var(--accent-btn)" : "var(--paper-2)",
                        color: isMe ? "white" : "var(--ink-1)",
                        border: isMe ? "none" : "1px solid var(--hairline)",
                      }}>
                        {msg.content}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexDirection: isMe ? "row-reverse" : "row" }}>
                        <span style={{ fontSize: 11, color: "var(--ink-4)" }}>
                          {timeAgo(msg.createdAt instanceof Date ? msg.createdAt : new Date())}
                        </span>
                        {msg.likes.length > 0 && (
                          <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 2 }}>
                            <Heart size={10} /> {msg.likes.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} style={{
              display: "flex", gap: 8, padding: "12px 20px",
              borderTop: "1px solid var(--hairline)", background: "var(--paper)", flexShrink: 0,
            }}>
              <input
                type="text" value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Share a thought or verse…"
                className="input-field"
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                style={{
                  width: 36, height: 36, borderRadius: 8, border: "none",
                  background: newMessage.trim() ? "var(--accent-btn)" : "var(--paper-2)",
                  color: newMessage.trim() ? "white" : "var(--ink-4)",
                  display: "grid", placeItems: "center", cursor: newMessage.trim() ? "pointer" : "default",
                  transition: "background 120ms",
                }}
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </form>
          </>
        )}

        {/* ── MEMBERS ── */}
        {activeTab === "members" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
            <div style={{ maxWidth: 560, margin: "0 auto" }}>
              <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: "0 0 14px" }}>
                {group.memberIds.length} member{group.memberIds.length !== 1 ? "s" : ""}
              </p>

              {members.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {group.memberIds.map((uid, i) => (
                    <div key={uid} className="card" style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `oklch(88% 0.04 ${HUES[i % HUES.length]})`, display: "grid", placeItems: "center", fontSize: 12, color: `oklch(40% 0.06 ${HUES[i % HUES.length]})`, fontWeight: 600 }}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0 }}>Member {i + 1}</p>
                      </div>
                      {uid === user?.uid && <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>you</span>}
                      {group.adminIds.includes(uid) && <span className="badge-accent" style={{ fontSize: 11 }}>Admin</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {members.map(member => {
                    const isSelf      = member.uid === user?.uid;
                    const memberAdmin = group.adminIds.includes(member.uid);
                    const actionable  = isAdmin && !isSelf;
                    return (
                      <div key={member.uid} className="card" style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={member.displayName} photoURL={member.photoURL} size={36} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-1)", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{member.displayName}</p>
                          <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>@{member.username}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          {isSelf && <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>you</span>}
                          {memberAdmin && <span className="badge-accent" style={{ fontSize: 11 }}>Admin</span>}
                          {actionable && !memberAdmin && (
                            <button
                              onClick={() => handlePromote(member.uid, member.displayName)}
                              disabled={promotingId === member.uid}
                              title="Make Admin"
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: 4, display: "flex" }}
                            >
                              {promotingId === member.uid ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                            </button>
                          )}
                          {actionable && memberAdmin && (
                            <button
                              onClick={() => handleDemote(member.uid, member.displayName)}
                              disabled={demotingId === member.uid}
                              title="Remove Admin"
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: 4, display: "flex" }}
                            >
                              {demotingId === member.uid ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={14} />}
                            </button>
                          )}
                          {actionable && (
                            <button
                              onClick={() => handleRemoveMember(member.uid, member.displayName)}
                              disabled={removingId === member.uid}
                              title="Remove from group"
                              style={{ background: "none", border: "none", cursor: "pointer", color: "oklch(57.7% 0.245 27.3)", padding: 4, display: "flex" }}
                            >
                              {removingId === member.uid ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={14} />}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {isAdmin && (
                <button
                  onClick={() => setShowInvite(true)}
                  className="btn btn-sm"
                  style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 6 }}
                >
                  <UserPlus size={12} /> Invite Friends
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── READING PLAN ── */}
        {activeTab === "plan" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
            <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Group reading plans */}
              {groupPlans.length > 0 && (
                <div>
                  <div className="card-label" style={{ marginBottom: 10 }}>Group Reading Plans</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {groupPlans.map(plan => {
                      const myProg = groupPlanProgs.find(p => p.planId === plan.id && p.userId === user?.uid);
                      const pct = myProg ? Math.min(100, Math.round((myProg.completedDays.length / plan.duration) * 100)) : 0;
                      const todayNum = myProg?.currentDay ?? 1;
                      const todayDone = myProg?.completedDays.includes(todayNum) ?? false;
                      return (
                        <div key={plan.id} className="card" style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-1)", margin: "0 0 2px" }}>{plan.name}</p>
                              <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>{plan.duration} days</p>
                            </div>
                            {!myProg ? (
                              <button
                                onClick={async () => {
                                  if (!user || !id) return;
                                  setJoiningPlan(plan.id);
                                  try {
                                    await startGroupPlanProgress(id, plan.id, plan.name, user.uid);
                                    const progs = await Promise.all(groupPlans.map(p => getGroupPlanProgress(id, p.id)));
                                    setGroupPlanProgs(progs.flat());
                                  } catch { toast.error("Failed to join plan"); }
                                  finally { setJoiningPlan(null); }
                                }}
                                disabled={joiningPlan === plan.id}
                                className="btn btn-sm"
                                style={{ display: "flex", alignItems: "center", gap: 5 }}
                              >
                                {joiningPlan === plan.id ? <Loader2 size={12} className="animate-spin" /> : "Join"}
                              </button>
                            ) : (
                              <span style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 400, color: "var(--accent-ink)" }}>{pct}%</span>
                            )}
                          </div>
                          {myProg && (
                            <>
                              <div style={{ height: 4, background: "var(--paper-3)", borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
                                <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent-btn)", borderRadius: 2, transition: "width 300ms" }} />
                              </div>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                                  {todayDone ? "Day complete!" : `Day ${todayNum} of ${plan.duration}`}
                                </span>
                                {!todayDone && (
                                  <button
                                    onClick={async () => {
                                      if (!user) return;
                                      try {
                                        await markGroupPlanDayComplete(myProg.id, todayNum);
                                        const progs = await Promise.all(groupPlans.map(p => getGroupPlanProgress(id!, p.id)));
                                        setGroupPlanProgs(progs.flat());
                                        toast.success("Day marked complete!");
                                      } catch { toast.error("Failed to mark day"); }
                                    }}
                                    className="btn btn-sm"
                                    style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}
                                  >
                                    <CheckCircle2 size={13} /> Mark Done
                                  </button>
                                )}
                                {todayDone && <CheckCircle2 size={16} style={{ color: "var(--accent-ink)" }} />}
                              </div>

                              {/* Group progress */}
                              {members.length > 0 && (() => {
                                const planProgs = groupPlanProgs.filter(p => p.planId === plan.id);
                                return planProgs.length > 0 ? (
                                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--hairline)" }}>
                                    <p style={{ fontSize: 11, color: "var(--ink-4)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Group progress</p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                      {members.map(m => {
                                        const mp = planProgs.find(p => p.userId === m.uid);
                                        const mpct = mp ? Math.min(100, Math.round((mp.completedDays.length / plan.duration) * 100)) : null;
                                        return (
                                          <div key={m.uid} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <Avatar name={m.displayName} photoURL={m.photoURL} size={20} />
                                            <span style={{ fontSize: 12, color: "var(--ink-2)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.displayName}</span>
                                            {mpct !== null
                                              ? <span style={{ fontSize: 11, color: "var(--accent-ink)", fontWeight: 500 }}>{mpct}%</span>
                                              : <span style={{ fontSize: 11, color: "var(--ink-4)" }}>Not started</span>}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : null;
                              })()}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Today's reading tracker */}
              <div className="card" style={{ padding: "18px 20px" }}>
                <div className="card-label" style={{ marginBottom: 10 }}>Today's Reading — {TODAY}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <button
                    onClick={handleMarkRead}
                    disabled={!!myLog || markingRead}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "8px 16px", borderRadius: 8, border: "1px solid",
                      fontSize: 13.5, fontWeight: 500, cursor: myLog ? "default" : "pointer",
                      fontFamily: "var(--font-ui)",
                      background: myLog ? "var(--accent-soft)" : "var(--paper)",
                      borderColor: myLog ? "var(--accent-border)" : "var(--hairline-2)",
                      color: myLog ? "var(--accent-ink)" : "var(--ink-1)",
                    }}
                  >
                    {markingRead
                      ? <Loader2 size={14} className="animate-spin" />
                      : myLog
                        ? <><CheckCircle2 size={15} /> Reading complete!</>
                        : <><Circle size={15} /> Mark as read today</>}
                  </button>
                </div>
                <div className="card-label" style={{ marginBottom: 8 }}>
                  Group progress — {readLogs.length} / {group.memberIds.length} read today
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {members.length === 0
                    ? group.memberIds.map((uid, i) => {
                        const done = readLogs.some(l => l.userId === uid);
                        return (
                          <div key={uid} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {done ? <CheckCircle2 size={15} style={{ color: "var(--accent-ink)", flexShrink: 0 }} /> : <Circle size={15} style={{ color: "var(--hairline-2)", flexShrink: 0 }} />}
                            <span style={{ fontSize: 13, color: done ? "var(--ink-1)" : "var(--ink-3)" }}>Member {i + 1}{uid === user?.uid ? " (you)" : ""}</span>
                          </div>
                        );
                      })
                    : members.map(member => {
                        const done = readLogs.some(l => l.userId === member.uid);
                        return (
                          <div key={member.uid} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {done ? <CheckCircle2 size={15} style={{ color: "var(--accent-ink)", flexShrink: 0 }} /> : <Circle size={15} style={{ color: "var(--hairline-2)", flexShrink: 0 }} />}
                            <Avatar name={member.displayName} photoURL={member.photoURL} size={22} />
                            <span style={{ fontSize: 13, color: done ? "var(--ink-1)" : "var(--ink-3)", flex: 1 }}>{member.displayName}{member.uid === user?.uid ? " (you)" : ""}</span>
                            {done && <span style={{ fontSize: 11, color: "var(--accent-ink)", fontWeight: 500 }}>✓ Read</span>}
                          </div>
                        );
                      })}
                </div>
                <div style={{ marginTop: 14 }}>
                  <div style={{ height: 6, background: "var(--paper-3)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 999, background: "var(--accent-btn)", width: `${group.memberIds.length > 0 ? (readLogs.length / group.memberIds.length) * 100 : 0}%`, transition: "width 400ms ease" }} />
                  </div>
                  <p style={{ fontSize: 11.5, color: "var(--ink-3)", margin: "4px 0 0", textAlign: "right" }}>
                    {group.memberIds.length > 0 ? Math.round((readLogs.length / group.memberIds.length) * 100) : 0}% of group read today
                  </p>
                </div>
              </div>

              {/* Create group plan link */}
              <div className="card" style={{ padding: "16px 20px" }}>
                <div className="card-label" style={{ marginBottom: 6 }}>Assign a Plan to this Group</div>
                <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 12px", lineHeight: 1.5 }}>
                  Create a reading plan and assign it to this group so all members can track progress together.
                </p>
                <Link href="/dashboard/plans" className="btn btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <BookMarked size={12} /> Manage Plans
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Invite friends panel ── */}
      {showInvite && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "oklch(0% 0 0 / 0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}>
          <div className="card" style={{ width: "100%", maxWidth: 400, padding: 20, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--ink-1)", margin: 0 }}>Invite Friends</h3>
              <button onClick={() => setShowInvite(false)} style={{ color: "var(--ink-3)", background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {friends.length === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center" }}>
                  <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>No friends to invite yet</p>
                  <Link href="/dashboard/friends" onClick={() => setShowInvite(false)}
                    style={{ fontSize: 13, color: "var(--accent-ink)", marginTop: 8, display: "block" }}>
                    Find Friends →
                  </Link>
                </div>
              ) : friends.map(friend => {
                const alreadyMember  = group.memberIds.includes(friend.uid);
                const alreadyInvited = invitedIds.has(friend.uid);
                return (
                  <div key={friend.uid} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={friend.displayName} photoURL={friend.photoURL} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-1)", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{friend.displayName}</p>
                      <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>@{friend.username}</p>
                    </div>
                    <button
                      onClick={() => handleInviteFriend(friend)}
                      disabled={alreadyMember || alreadyInvited || invitingId === friend.uid}
                      style={{
                        padding: "5px 12px", borderRadius: 7, border: "1px solid", flexShrink: 0,
                        fontSize: 12.5, fontWeight: 500, cursor: alreadyMember || alreadyInvited ? "default" : "pointer",
                        fontFamily: "var(--font-ui)",
                        background: alreadyMember || alreadyInvited ? "var(--paper-2)" : "var(--accent-btn)",
                        color:      alreadyMember || alreadyInvited ? "var(--ink-3)"   : "white",
                        borderColor: alreadyMember || alreadyInvited ? "var(--hairline)" : "transparent",
                        opacity: alreadyMember || alreadyInvited ? 0.6 : 1,
                      }}
                    >
                      {invitingId === friend.uid ? <Loader2 size={12} className="animate-spin" />
                        : alreadyMember  ? "Member"
                        : alreadyInvited ? "Invited"
                        : "Invite"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
