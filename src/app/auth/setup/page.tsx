"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { BookOpen, User, AtSign, Check, X } from "lucide-react";
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
    throw Object.assign(
      new Error(`[${res.status}] ${msg} | raw: ${rawText.slice(0, 200)}`),
      { code: status.toLowerCase().replace(/_/g, "-") }
    );
  }
}

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "short";

export default function SetupPage() {
  const { firebaseUser, setUser, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [saving, setSaving] = useState(false);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (authLoading) return;
    if (!firebaseUser) router.replace("/auth/login");
    else setDisplayName(firebaseUser.displayName || "");
  }, [firebaseUser, authLoading, router]);

  function handleUsernameChange(val: string) {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setUsername(clean);
    clearTimeout(checkTimer.current);
    if (clean.length < 3) { setUsernameStatus("short"); return; }
    setUsernameStatus("checking");
    checkTimer.current = setTimeout(async () => {
      try {
        const { checkUsernameAvailable } = await import("@/lib/firestore");
        const ok = await checkUsernameAvailable(clean);
        setUsernameStatus(ok ? "available" : "taken");
      } catch { setUsernameStatus("idle"); }
    }, 500);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser) return;
    if (!displayName.trim()) { toast.error("Please enter a display name"); return; }
    if (!username || username.length < 3) { toast.error("Username must be at least 3 characters"); return; }
    if (usernameStatus === "taken")    { toast.error("That username is already taken"); return; }
    if (usernameStatus === "checking") { toast.error("Still checking username — try again in a moment"); return; }

    setSaving(true);
    try {
      const idToken = await firebaseUser.getIdToken();

      await writeProfileRest(firebaseUser.uid, idToken, {
        email: firebaseUser.email || "",
        username,
        displayName: displayName.trim(),
        photoURL: firebaseUser.photoURL || undefined,
      });

      // Reserve username in the `usernames` collection
      const { reserveUsername, getUserProfile } = await import("@/lib/firestore");
      await reserveUsername(username, firebaseUser.uid);

      const profile = await getUserProfile(firebaseUser.uid);
      setUser(profile);
      toast.success("Welcome to Bible Study Tracker!");
      router.replace("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const code = (err as { code?: string }).code ?? "";
      console.error("Setup error:", code, msg, err);
      toast.error(`[${code || "unknown"}] ${msg.slice(0, 300)}`, { duration: 15000 });
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) return null;

  const usernameHint =
    usernameStatus === "checking"  ? { text: "Checking…",     color: "var(--ink-4)",                  icon: null } :
    usernameStatus === "available" ? { text: "Available",      color: "oklch(52% 0.14 145)",           icon: <Check size={12} /> } :
    usernameStatus === "taken"     ? { text: "Already taken",  color: "oklch(57.7% 0.245 27.3)",       icon: <X size={12} /> } :
    usernameStatus === "short"     ? { text: "Min 3 characters", color: "var(--ink-4)",                icon: null } :
    null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--accent-btn)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <BookOpen size={18} color="white" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-1)" }}>Bible Study Tracker</span>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink-1)", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
          Set up your profile
        </h2>
        <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 28px" }}>Just a couple more details to get started.</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink-2)", marginBottom: 6 }}>
              Display name
            </label>
            <div style={{ position: "relative" }}>
              <User size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", pointerEvents: "none" }} />
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
                className="input-field"
                style={{ paddingLeft: 30 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink-2)", marginBottom: 6 }}>
              Username
            </label>
            <div style={{ position: "relative" }}>
              <AtSign size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", pointerEvents: "none" }} />
              <input
                type="text"
                value={username}
                onChange={e => handleUsernameChange(e.target.value)}
                placeholder="yourname"
                required
                className="input-field"
                style={{ paddingLeft: 30 }}
              />
            </div>
            {usernameHint ? (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5, fontSize: 12, color: usernameHint.color, fontWeight: 500 }}>
                {usernameHint.icon}
                {usernameHint.text}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "var(--ink-4)", margin: "5px 0 0" }}>
                Lowercase letters, numbers, underscores. 3–20 characters.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || usernameStatus === "taken" || usernameStatus === "checking"}
            className="btn-primary"
            style={{ width: "100%", marginTop: 4 }}
          >
            {saving ? "Saving…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
