"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import {
  searchUsersByUsername,
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  getUserProfile,
} from "@/lib/firestore";
import type { Friend, FriendRequest, User } from "@/types";
import {
  Search, UserPlus, UserCheck, X, Users, Check, Flame,
  Loader2, ChevronRight, Trophy,
} from "lucide-react";
import toast from "react-hot-toast";
import { getInitials, getStreakLevel } from "@/lib/utils";

export default function FriendsPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "search">("friends");
  const [pendingSent, setPendingSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    getFriendRequests(user.uid).then(setRequests);
    loadFriends();
  }, [user]);

  async function loadFriends() {
    if (!user) return;
    setLoadingFriends(true);
    try {
      const friendProfiles = await Promise.all(
        (user.friendIds || []).slice(0, 30).map((uid) => getUserProfile(uid))
      );
      const validFriends = friendProfiles
        .filter(Boolean)
        .map((p) => ({
          uid: p!.uid,
          username: p!.username,
          displayName: p!.displayName,
          photoURL: p!.photoURL,
          currentStreak: p!.currentStreak,
          status: "friend" as const,
        }));
      setFriends(validFriends);
    } finally {
      setLoadingFriends(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setActiveTab("search");
    const results = await searchUsersByUsername(searchQuery.toLowerCase());
    setSearchResults(results.filter((u) => u.uid !== user?.uid));
    setSearching(false);
  }

  async function handleSendRequest(targetUser: User) {
    if (!user) return;
    if (user.friendIds?.includes(targetUser.uid)) { toast.error("Already friends!"); return; }
    setPendingSent((prev) => new Set([...prev, targetUser.uid]));
    try {
      await sendFriendRequest(user.uid, targetUser.uid, user.username, user.displayName, user.photoURL);
      toast.success(`Friend request sent to @${targetUser.username}`);
    } catch {
      toast.error("Failed to send request");
      setPendingSent((prev) => { const s = new Set(prev); s.delete(targetUser.uid); return s; });
    }
  }

  async function handleAccept(req: FriendRequest) {
    await acceptFriendRequest(req.id, req.fromUid, user!.uid);
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    toast.success(`You and @${req.fromUsername} are now friends!`);
    loadFriends();
  }

  async function handleDecline(req: FriendRequest) {
    await declineFriendRequest(req.id);
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
  }

  const TABS = [
    { id: "friends", label: "Friends", badge: friends.length },
    { id: "requests", label: "Requests", badge: requests.length },
    { id: "search", label: "Find People", badge: 0 },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Friends</h1>
        <p className="text-sm text-muted-foreground mt-1">Find and connect with fellow believers</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username (e.g. john123)"
            className="input-field pl-10" />
        </div>
        <button type="submit" disabled={searching} className="btn-primary px-4 py-2.5 text-sm">
          {searching ? <Loader2 size={16} className="animate-spin" /> : "Search"}
        </button>
      </form>

      {/* Tabs */}
      <div className="flex border-b border-border mb-5">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${activeTab === tab.id ? "" : "border-transparent text-muted-foreground"}`}
            className={activeTab === tab.id ? "tab-item active" : "tab-item"}>
            {tab.label}
            {tab.badge > 0 && (
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-gray-900"
                style={{ background: "var(--primary)" }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Friends list */}
      {activeTab === "friends" && (
        <div>
          {loadingFriends ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--bg-card)" }} />
              ))}
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-16 card">
              <Users size={40} className="mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-semibold text-foreground mb-2">No friends yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Search by username to find people to study with</p>
              <button onClick={() => setActiveTab("search")} className="btn-primary text-sm px-5 py-2">
                Find Friends
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => {
                const level = getStreakLevel(friend.currentStreak);
                return (
                  <div key={friend.uid} className="flex items-center gap-3 p-4 rounded-xl card">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-gray-900 flex-shrink-0"
                      style={{ background: "var(--primary)" }}>
                      {friend.photoURL
                        ? <img src={friend.photoURL} alt={friend.displayName} className="w-11 h-11 rounded-full object-cover" />
                        : getInitials(friend.displayName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{friend.displayName}</p>
                      <p className="text-xs text-muted-foreground">@{friend.username}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {friend.currentStreak > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <Flame size={12} className="text-orange-400" />
                          <span className="font-semibold text-orange-400">{friend.currentStreak}</span>
                        </div>
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

      {/* Friend requests */}
      {activeTab === "requests" && (
        <div>
          {requests.length === 0 ? (
            <div className="text-center py-16 card">
              <UserPlus size={40} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No pending friend requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{requests.length} pending request{requests.length !== 1 ? "s" : ""}</p>
              {requests.map((req) => (
                <div key={req.id} className="card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-gray-900 flex-shrink-0"
                    style={{ background: "var(--primary)" }}>
                    {req.fromPhotoURL
                      ? <img src={req.fromPhotoURL} alt={req.fromDisplayName} className="w-10 h-10 rounded-full object-cover" />
                      : getInitials(req.fromDisplayName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{req.fromDisplayName}</p>
                    <p className="text-xs text-muted-foreground">@{req.fromUsername}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDecline(req)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors"
                      style={{ background: "var(--bg-secondary)" }}>
                      <X size={16} />
                    </button>
                    <button onClick={() => handleAccept(req)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-900 transition-all"
                      style={{ background: "var(--primary)" }}>
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search results */}
      {activeTab === "search" && (
        <div>
          {searching ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-16 card">
              <Search size={40} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Search for users by their username above</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{searchResults.length} user{searchResults.length !== 1 ? "s" : ""} found</p>
              {searchResults.map((result) => {
                const isFriend = user?.friendIds?.includes(result.uid);
                const hasSentRequest = pendingSent.has(result.uid);
                const level = getStreakLevel(result.currentStreak);
                return (
                  <div key={result.uid} className="card p-4 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-gray-900 flex-shrink-0"
                      style={{ background: "var(--primary)" }}>
                      {result.photoURL
                        ? <img src={result.photoURL} alt={result.displayName} className="w-11 h-11 rounded-full object-cover" />
                        : getInitials(result.displayName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{result.displayName}</p>
                      <p className="text-xs text-muted-foreground">@{result.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {result.currentStreak > 0 && (
                          <span className="text-xs text-orange-400 flex items-center gap-1">
                            <Flame size={11} /> {result.currentStreak} day streak
                          </span>
                        )}
                        <span className={`text-xs font-medium ${level.color}`}>{level.label}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendRequest(result)}
                      disabled={isFriend || hasSentRequest}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isFriend || hasSentRequest ? "opacity-60 cursor-default" : "hover:opacity-80"}`}
                      style={isFriend || hasSentRequest
                        ? { background: "var(--bg-secondary)", color: "var(--text-muted)" }
                        : { background: "var(--primary)", color: "#1a0a0a" }}>
                      {isFriend ? (
                        <><UserCheck size={13} /> Friends</>
                      ) : hasSentRequest ? (
                        <><Check size={13} /> Sent</>
                      ) : (
                        <><UserPlus size={13} /> Add</>
                      )}
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
