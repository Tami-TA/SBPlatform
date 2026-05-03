"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { BookOpen, User, AtSign } from "lucide-react";
import toast from "react-hot-toast";

export default function SetupPage() {
  const { firebaseUser, setUser, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!firebaseUser) router.replace("/auth/login");
    else setDisplayName(firebaseUser.displayName || "");
  }, [firebaseUser, authLoading, router]);

  function handleUsernameChange(val: string) {
    setUsername(val.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser) return;
    if (!displayName.trim()) { toast.error("Please enter a display name"); return; }
    if (!username || username.length < 3) { toast.error("Username must be at least 3 characters"); return; }

    setSaving(true);
    try {
      const { createUserProfile, getUserProfile } = await import("@/lib/firestore");

      await Promise.race([
        createUserProfile(firebaseUser.uid, {
          email: firebaseUser.email || "",
          username,
          displayName: displayName.trim(),
          photoURL: firebaseUser.photoURL || undefined,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 10000)
        ),
      ]);

      const profile = await getUserProfile(firebaseUser.uid);
      setUser(profile);
      toast.success("Welcome to Scripture!");
      router.replace("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Setup error:", err);
      if (msg.includes("timeout")) {
        toast.error("Request timed out — check Firestore security rules in Firebase console");
      } else if (msg.includes("permission") || msg.includes("PERMISSION")) {
        toast.error("Permission denied — check Firestore security rules in Firebase console");
      } else if (msg.includes("username-already-taken")) {
        toast.error("Username already taken — try another");
      } else {
        toast.error(`Error: ${msg.slice(0, 100)}`);
      }
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary">
            <BookOpen size={20} className="text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">Scripture</span>
        </div>

        <div className="mb-7">
          <h2 className="text-2xl font-semibold text-foreground mb-1">Set up your profile</h2>
          <p className="text-sm text-muted-foreground">Just a couple more details to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Display name</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Username</label>
            <div className="relative">
              <AtSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="yourname"
                required
                className="input-field pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">Lowercase, numbers, underscores. Min 3 characters.</p>
          </div>

          <button type="submit" disabled={saving} className="btn-crimson w-full mt-2">
            {saving ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
