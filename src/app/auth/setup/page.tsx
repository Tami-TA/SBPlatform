"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { BookOpen, User, AtSign } from "lucide-react";
import toast from "react-hot-toast";

const PROJECT_ID = "sbplanner-2aa7b";

async function writeProfileRest(
  uid: string,
  idToken: string,
  data: { email: string; username: string; displayName: string; photoURL?: string }
): Promise<void> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;

  const str = (v: string) => ({ stringValue: v });
  const int = (v: number) => ({ integerValue: String(v) });
  const bool = (v: boolean) => ({ booleanValue: v });
  const arr = () => ({ arrayValue: { values: [] as unknown[] } });

  const fields: Record<string, unknown> = {
    uid: str(uid),
    email: str(data.email),
    username: str(data.username),
    displayName: str(data.displayName),
    currentStreak: int(0),
    longestStreak: int(0),
    totalDaysRead: int(0),
    badges: arr(),
    friendIds: arr(),
    groupIds: arr(),
    preferredTranslation: str("KJV"),
    notificationsEnabled: bool(true),
    createdAt: { timestampValue: new Date().toISOString() },
  };
  if (data.photoURL) fields.photoURL = str(data.photoURL);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
      signal: controller.signal,
    });
  } catch (fetchErr) {
    clearTimeout(timer);
    const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    if (msg.includes("abort") || msg.includes("AbortError")) {
      throw Object.assign(new Error("Request timed out after 12s"), { code: "deadline-exceeded" });
    }
    throw Object.assign(new Error(`Network error: ${msg}`), { code: "unavailable" });
  }
  clearTimeout(timer);

  if (!res.ok) {
    let rawText = "";
    try { rawText = await res.text(); } catch { /* ignore */ }
    let errBody: { error?: { message?: string; status?: string } } = {};
    try { errBody = JSON.parse(rawText); } catch { /* ignore */ }
    const msg = errBody?.error?.message ?? res.statusText;
    const status = errBody?.error?.status ?? `HTTP_${res.status}`;
    // Include raw response in error so it surfaces in the toast
    throw Object.assign(
      new Error(`[${res.status}] ${msg} | raw: ${rawText.slice(0, 200)}`),
      { code: status.toLowerCase().replace(/_/g, "-") }
    );
  }
}

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
      const idToken = await firebaseUser.getIdToken();

      await writeProfileRest(firebaseUser.uid, idToken, {
        email: firebaseUser.email || "",
        username,
        displayName: displayName.trim(),
        photoURL: firebaseUser.photoURL || undefined,
      });

      const { getUserProfile } = await import("@/lib/firestore");
      const profile = await getUserProfile(firebaseUser.uid);
      setUser(profile);
      toast.success("Welcome to Scripture!");
      router.replace("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const code = (err as { code?: string }).code ?? "";
      console.error("Setup error:", code, msg, err);

      if (code === "permission-denied" || code === "permission_denied") {
        toast.error(
          "Permission denied — go to Firebase Console → Firestore Database → Rules and publish the security rules.",
          { duration: 10000 }
        );
      } else if (code === "deadline-exceeded" || code === "unavailable") {
        toast.error(
          `Could not reach Firestore (${code}). Make sure the database exists and is in Native mode in Firebase Console.`,
          { duration: 10000 }
        );
      } else if (code === "not-found") {
        toast.error(
          "Permission denied (rules are blocking the write). Go to Firebase Console → Firestore Database → Rules and publish rules that allow authenticated users to write.",
          { duration: 10000 }
        );
      } else {
        toast.error(`Error (${code || "unknown"}): ${msg.slice(0, 150)}`, { duration: 10000 });
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
