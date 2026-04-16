"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { getGroup, subscribeToGroupMessages, sendGroupMessage } from "@/lib/firestore";
import type { Group, GroupMessage } from "@/types";
import {
  ArrowLeft, Send, BookOpen, Users, MessageCircle, Heart, Reply,
  Loader2, BookMarked, ChevronRight, Star,
} from "lucide-react";
import { timeAgo, getInitials } from "@/lib/utils";
import toast from "react-hot-toast";

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "bible" | "members" | "plans">("chat");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    getGroup(id).then(setGroup);
    const unsub = subscribeToGroupMessages(id, setMessages);
    return unsub;
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-muted-page" />
      </div>
    );
  }

  const TABS = [
    { id: "chat", label: "Discussion", icon: MessageCircle },
    { id: "bible", label: "Community Bible", icon: BookOpen },
    { id: "members", label: "Members", icon: Users },
    { id: "plans", label: "Reading Plan", icon: BookMarked },
  ] as const;

  return (
    <div className="h-full flex flex-col max-h-screen">
      {/* Group header */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-page" style={{ background: "var(--bg-card)" }}>
        <Link href="/dashboard/groups" className="text-muted-page hover:text-page transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-gray-900"
          style={{ background: "linear-gradient(135deg, #D4AF37, #F59E0B)" }}>
          {getInitials(group.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-page truncate">{group.name}</h2>
          <p className="text-xs text-muted-page">{group.memberIds.length} members</p>
        </div>
        <div className="flex items-center gap-1.5">
          {group.memberIds.slice(0, 4).map((_, i) => (
            <div key={i} className="w-7 h-7 rounded-full border-2 border-[var(--bg-card)] flex items-center justify-center text-xs font-bold text-gray-900 -ml-2 first:ml-0"
              style={{ background: "linear-gradient(135deg, #D4AF37, #B45309)" }}>
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-page overflow-x-auto no-scrollbar" style={{ background: "var(--bg-card)" }}>
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? "" : "border-transparent text-muted-page hover:text-secondary-page"}`}
            style={activeTab === tab.id ? { borderColor: "var(--gold)", color: "var(--gold)" } : {}}>
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "chat" && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-16">
                  <MessageCircle size={40} className="mx-auto mb-3 text-muted-page" />
                  <p className="text-secondary-page">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.authorUid === user?.uid;
                  return (
                    <div key={msg.id} className={`flex items-end gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-gray-900 flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #D4AF37, #F59E0B)" }}>
                        {msg.authorPhotoURL
                          ? <img src={msg.authorPhotoURL} alt={msg.authorUsername} className="w-8 h-8 rounded-full object-cover" />
                          : getInitials(msg.authorUsername)}
                      </div>
                      <div className={`max-w-xs md:max-w-md ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                        {!isMe && (
                          <span className="text-xs text-muted-page mb-1 ml-1">@{msg.authorUsername}</span>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl ${isMe ? "rounded-br-sm" : "rounded-bl-sm"} text-sm leading-relaxed`}
                          style={isMe
                            ? { background: "linear-gradient(135deg, #8B0000, #B91C1C)", color: "white" }
                            : { background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                          {msg.content}
                        </div>
                        <div className={`flex items-center gap-2 mt-1 ${isMe ? "flex-row-reverse" : ""}`}>
                          <span className="text-xs text-muted-page">{timeAgo(msg.createdAt instanceof Date ? msg.createdAt : new Date())}</span>
                          <button className="text-xs text-muted-page hover:text-page flex items-center gap-1">
                            <Heart size={11} /> {msg.likes.length > 0 && msg.likes.length}
                          </button>
                          <button className="text-xs text-muted-page hover:text-page flex items-center gap-1">
                            <Reply size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form onSubmit={handleSend} className="flex items-center gap-3 p-4 border-t border-page"
              style={{ background: "var(--bg-card)" }}>
              <div className="flex gap-2 flex-shrink-0">
                <button type="button" className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-page hover:text-page"
                  style={{ background: "var(--bg-secondary)" }} title="Share verse">
                  <BookOpen size={15} />
                </button>
              </div>
              <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Share a thought or verse..."
                className="input-field flex-1 py-2.5 text-sm" />
              <button type="submit" disabled={!newMessage.trim() || sending}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${newMessage.trim() ? "" : "opacity-50"}`}
                style={{ background: "linear-gradient(135deg, #D4AF37, #F59E0B)" }}>
                {sending ? <Loader2 size={16} className="animate-spin text-gray-900" /> : <Send size={16} className="text-gray-900" />}
              </button>
            </form>
          </>
        )}

        {activeTab === "bible" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(212,175,55,0.12)" }}>
                <BookOpen size={28} style={{ color: "var(--gold)" }} />
              </div>
              <h3 className="text-lg font-display font-bold text-page mb-2">Community Bible</h3>
              <p className="text-secondary-page text-sm mb-6">
                Read and annotate scripture together. All group members can see and contribute notes and insights.
              </p>
              <Link href={`/dashboard/bible?groupId=${id}`} className="btn-gold mx-auto inline-flex">
                Open Community Bible <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div className="flex-1 overflow-y-auto p-5">
            <h3 className="text-sm font-semibold text-secondary-page mb-3">
              {group.memberIds.length} Members
            </h3>
            <div className="space-y-2">
              {group.memberIds.map((uid, i) => (
                <div key={uid} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-gray-900"
                    style={{ background: "linear-gradient(135deg, #D4AF37, #F59E0B)" }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-page">Member {i + 1}</p>
                    {group.adminIds.includes(uid) && (
                      <span className="badge-gold text-xs">Admin</span>
                    )}
                  </div>
                  {uid === user?.uid && (
                    <span className="text-xs text-muted-page">(you)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "plans" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(139,0,0,0.12)" }}>
                <BookMarked size={28} style={{ color: "#e05050" }} />
              </div>
              <h3 className="text-lg font-display font-bold text-page mb-2">Group Reading Plan</h3>
              <p className="text-secondary-page text-sm mb-6">
                Follow a reading plan together and track each member&apos;s progress.
              </p>
              <Link href="/dashboard/plans" className="btn-crimson mx-auto inline-flex">
                Browse Plans <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
