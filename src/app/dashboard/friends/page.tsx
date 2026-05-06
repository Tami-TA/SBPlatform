"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import {
  searchUsersByUsername,
  sendFriendRequest,
  getFriendRequests,
  getSentFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  getUserProfile,
} from "@/lib/firestore";
import type { Friend, FriendRequest, User } from "@/types";
import {
  Search, UserPlus, UserCheck, X, Users, Check, Flame,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { getInitials, getStreakLevel } from "@/lib/utils";

export default function FriendsPage() {
  const { user, setUser } = useAuthStore();
  const [searchQuery, setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching]       = useState(false);
  const [requests, setRequests]         = useState<FriendRequest[]>([]);
  const [friends, setFriends]           = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [activeTab, setActiveTab]       = useState<"friends" | "requests" | "search">("friends");
  const [pendingSent, setPendingSent]   = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getFriendRequests(user.uid),
      getSentFriendRequests(user.uid),
    ]).then(([received, sent]) => {
      setRequests(received);
      setPendingSent(new Set(sent.map(r => r.toUid)));
    }).catch(() => {});
    loadFriends();
  }, [user]);

  async function loadFriends() {
    if (!user) return;
    setLoadingFriends(true);
    try {
      // Always fetch the current user's doc fresh from Firestore so we don't
      // rely on the auth-store snapshot (which is only set at login/refresh).
      const freshProfile = await getUserProfile(user.uid);
      const ids = freshProfile?.friendIds ?? [];
      const profiles = await Promise.all(ids.slice(0, 30).map(uid => getUserProfile(uid)));
      setFriends(
        profiles.filter(Boolean).map(p => ({
          uid: p!.uid,
          username: p!.username,
          displayName: p!.displayName,
          photoURL: p!.photoURL,
          currentStreak: p!.currentStreak,
          status: "friend" as const,
        }))
      );
    } catch {
      // silent — friends list stays empty on error
    } finally {
      setLoadingFriends(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    setSearching(true);
    setActiveTab("search");
    try {
      const results = await searchUsersByUsername(q);
      setSearchResults(results.filter(u => u.uid !== user?.uid));
    } catch {
      toast.error("Search failed — please try again");
    } finally {
      setSearching(false);
    }
  }

  async function handleSendRequest(target: User) {
    if (!user) return;
    if (user.friendIds?.includes(target.uid)) { toast.error("Already friends!"); return; }
    if (pendingSent.has(target.uid)) { toast.error("Request already sent"); return; }
    setPendingSent(prev => new Set([...prev, target.uid]));
    try {
      await sendFriendRequest(user.uid, target.uid, user.username, user.displayName, user.photoURL);
      toast.success(`Friend request sent to @${target.username}`);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      const msg  = err instanceof Error ? err.message : "Failed to send request";
      if (code === "already-exists") {
        toast.error("Request already sent");
      } else {
        toast.error(msg);
        setPendingSent(prev => { const s = new Set(prev); s.delete(target.uid); return s; });
      }
    }
  }

  async function handleAccept(req: FriendRequest) {
    try {
      await acceptFriendRequest(req.id, req.fromUid, user!.uid);
      setRequests(prev => prev.filter(r => r.id !== req.id));
      // Refresh auth store so "Already friends" status in search is current.
      getUserProfile(user!.uid).then(p => { if (p) setUser(p); });
      toast.success(`You and @${req.fromUsername} are now friends!`);
      setActiveTab("friends");
      await loadFriends();
    } catch {
      toast.error("Failed to accept request");
    }
  }

  async function handleDecline(req: FriendRequest) {
    try {
      await declineFriendRequest(req.id);
      setRequests(prev => prev.filter(r => r.id !== req.id));
    } catch {
      toast.error("Failed to decline request");
    }
  }

  const TABS = [
    { id: "friends",  label: "Friends",     count: friends.length },
    { id: "requests", label: "Requests",    count: requests.length },
    { id: "search",   label: "Find People", count: 0 },
  ] as const;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 24px 56px" }}>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink-1)", margin: "0 0 2px", letterSpacing: "-0.01em" }}>Friends</h1>
        <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>Find and connect with fellow believers</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", pointerEvents: "none" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by username…"
            className="input-field"
            style={{ paddingLeft: 30 }}
          />
        </div>
        <button type="submit" disabled={searching} className="btn-primary btn-sm" style={{ padding: "0 16px", height: 36 }}>
          {searching ? <Loader2 size={14} className="animate-spin" /> : "Search"}
        </button>
      </form>

      {/* Tabs */}
      <div className="tab-list" style={{ marginBottom: 20 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-item${activeTab === tab.id ? " active" : ""}`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                marginLeft: 6, padding: "1px 6px", borderRadius: 999,
                background: "var(--accent-soft-2)", color: "var(--accent-ink)",
                fontSize: 10.5, fontWeight: 600,
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Friends list ── */}
      {activeTab === "friends" && (
        <div>
          {loadingFriends ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 64, borderRadius: 10, background: "var(--paper-2)", border: "1px solid var(--hairline)" }} />
              ))}
            </div>
          ) : friends.length === 0 ? (
            <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
              <Users size={36} style={{ margin: "0 auto 12px", color: "var(--ink-4)" }} />
              <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-1)", margin: "0 0 4px" }}>No friends yet</p>
              <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 16px" }}>Search by username to find people to study with</p>
              <button onClick={() => setActiveTab("search")} className="btn-primary btn-sm" style={{ padding: "0 20px" }}>
                Find Friends
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {friends.map(friend => {
                const level = getStreakLevel(friend.currentStreak);
                return (
                  <div key={friend.uid} className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar name={friend.displayName} photoURL={friend.photoURL} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-1)", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{friend.displayName}</p>
                      <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>@{friend.username}</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                      {friend.currentStreak > 0 && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "oklch(62% 0.18 50)", fontWeight: 500 }}>
                          <Flame size={11} /> {friend.currentStreak}
                        </span>
                      )}
                      <span className={`text-xs font-medium ${level.color}`}>{level.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Incoming requests ── */}
      {activeTab === "requests" && (
        <div>
          {requests.length === 0 ? (
            <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
              <UserPlus size={36} style={{ margin: "0 auto 12px", color: "var(--ink-4)" }} />
              <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>No pending friend requests</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: "0 0 4px" }}>
                {requests.length} pending request{requests.length !== 1 ? "s" : ""}
              </p>
              {requests.map(req => (
                <div key={req.id} className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar name={req.fromDisplayName} photoURL={req.fromPhotoURL} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-1)", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.fromDisplayName}</p>
                    <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>@{req.fromUsername}</p>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => handleDecline(req)}
                      title="Decline"
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: "1px solid var(--hairline)",
                        background: "var(--paper-2)", color: "var(--ink-3)",
                        display: "grid", placeItems: "center", cursor: "pointer",
                      }}
                    >
                      <X size={14} />
                    </button>
                    <button
                      onClick={() => handleAccept(req)}
                      title="Accept"
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: "var(--accent-btn)", color: "white",
                        display: "grid", placeItems: "center", cursor: "pointer", border: "none",
                      }}
                    >
                      <Check size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Search results ── */}
      {activeTab === "search" && (
        <div>
          {searching ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
              <Loader2 size={22} className="animate-spin" style={{ color: "var(--ink-4)" }} />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
              <Search size={36} style={{ margin: "0 auto 12px", color: "var(--ink-4)" }} />
              <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>
                {searchQuery ? `No users found for "${searchQuery}"` : "Search for users by their username above"}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: "0 0 4px" }}>
                {searchResults.length} user{searchResults.length !== 1 ? "s" : ""} found
              </p>
              {searchResults.map(result => {
                const isFriend      = user?.friendIds?.includes(result.uid);
                const hasSentReq    = pendingSent.has(result.uid);
                const level         = getStreakLevel(result.currentStreak);
                return (
                  <div key={result.uid} className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar name={result.displayName} photoURL={result.photoURL} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-1)", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{result.displayName}</p>
                      <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "0 0 3px" }}>@{result.username}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {result.currentStreak > 0 && (
                          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11.5, color: "oklch(62% 0.18 50)", fontWeight: 500 }}>
                            <Flame size={10} /> {result.currentStreak} day streak
                          </span>
                        )}
                        <span className={`text-xs ${level.color}`}>{level.label}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendRequest(result)}
                      disabled={isFriend || hasSentReq}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "5px 12px", borderRadius: 7, fontSize: 12.5, fontWeight: 500,
                        border: "1px solid",
                        flexShrink: 0,
                        cursor: isFriend || hasSentReq ? "default" : "pointer",
                        opacity: isFriend || hasSentReq ? 0.65 : 1,
                        background: isFriend || hasSentReq ? "var(--paper-2)" : "var(--accent-btn)",
                        color:      isFriend || hasSentReq ? "var(--ink-2)"   : "white",
                        borderColor: isFriend || hasSentReq ? "var(--hairline)" : "transparent",
                        fontFamily: "var(--font-ui)",
                      }}
                    >
                      {isFriend  ? <><UserCheck size={12} /> Friends</>
                       : hasSentReq ? <><Check size={12} /> Sent</>
                       : <><UserPlus size={12} /> Add</>}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Avatar({ name, photoURL, size }: { name: string; photoURL?: string; size: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "var(--accent-soft-2)", color: "var(--accent-ink)",
      display: "grid", placeItems: "center",
      fontSize: size * 0.32, fontWeight: 600, overflow: "hidden",
      border: "1px solid var(--hairline)",
    }}>
      {photoURL
        ? <img src={photoURL} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : getInitials(name)}
    </div>
  );
}
