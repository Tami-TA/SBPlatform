"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import toast from "react-hot-toast";
import { BookOpen, Eye, EyeOff, Mail, Lock, User, AtSign, ArrowLeft, Check } from "lucide-react";

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser, setFirebaseUser } = useAuthStore();

  function handleUsernameChange(val: string) {
    setUsername(val.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20));
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setStep(2);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!username || username.length < 3) { toast.error("Username must be at least 3 characters"); return; }
    setLoading(true);
    try {
      const { auth } = await import("@/lib/firebase");
      const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
      const { createUserProfile, getUserProfile } = await import("@/lib/firestore");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      await createUserProfile(cred.user.uid, { email, username, displayName });
      setFirebaseUser(cred.user);
      const profile = await getUserProfile(cred.user.uid);
      setUser(profile);
      toast.success("Account created! Welcome to Scripture 🎉");
      router.replace("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email-already-in-use")) {
        toast.error("Email already registered — try signing in");
      } else if (msg.includes("username-already-taken")) {
        toast.error("Username already taken");
      } else if (msg.includes("weak-password")) {
        toast.error("Password is too weak");
      } else {
        toast.error("Signup failed. Please try again.");
        console.error("Signup error:", err);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setLoading(true);
    try {
      const { auth, googleProvider } = await import("@/lib/firebase");
      const { signInWithPopup } = await import("firebase/auth");
      const { getUserProfile, createUserProfile } = await import("@/lib/firestore");
      const { generateUsername } = await import("@/lib/utils");
      const cred = await signInWithPopup(auth, googleProvider);
      setFirebaseUser(cred.user);
      let profile = await getUserProfile(cred.user.uid);
      if (!profile) {
        const uname = generateUsername(cred.user.displayName || "user");
        await createUserProfile(cred.user.uid, {
          email: cred.user.email || "", username: uname,
          displayName: cred.user.displayName || "Bible Reader",
          photoURL: cred.user.photoURL || undefined,
        });
        profile = await getUserProfile(cred.user.uid);
      }
      setUser(profile);
      toast.success("Account created with Google!");
      router.replace("/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // user dismissed — silent
      } else if (code === "auth/popup-blocked") {
        toast.error("Popup was blocked — allow popups and try again");
      } else if (code === "auth/unauthorized-domain") {
        toast.error("This domain isn't authorized for Google sign-in. Check Firebase console.");
        console.error("Google signup error:", err);
      } else if (code === "auth/operation-not-allowed") {
        toast.error("Google sign-in isn't enabled. Enable it in Firebase console.");
        console.error("Google signup error:", err);
      } else {
        toast.error(`Google sign-up failed${code ? ` (${code})` : ""}`);
        console.error("Google signup error:", err);
      }
    } finally {
      setLoading(false);
    }
  }

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabels = ["", "Weak", "Good", "Strong"];
  const strengthColors = ["", "bg-red-500", "bg-yellow-500", "bg-green-500"];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Decorative panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-foreground relative overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-8 bg-primary">
            <BookOpen size={26} className="text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-semibold text-background mb-4 leading-snug">Begin your journey</h1>
          <p className="text-background/60 max-w-xs text-sm leading-relaxed mb-8">
            &ldquo;Blessed is the one who reads aloud the words of this prophecy.&rdquo;
          </p>
          <p className="text-background/40 text-xs">— Revelation 1:3</p>
          <div className="mt-10 space-y-3 text-left max-w-xs">
            {["8 Bible translations", "Daily streaks & badges", "Study groups & friends", "Historical context", "AI-powered insights"].map((p) => (
              <div key={p} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/20">
                  <Check size={10} className="text-primary" />
                </div>
                <span className="text-sm text-background/70">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft size={14} /> Back
          </Link>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-7">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                  ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {step > s ? <Check size={12} /> : s}
                </div>
                {s < 2 && <div className={`h-px w-8 transition-all ${step > s ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
            <span className="text-xs text-muted-foreground ml-1">
              {step === 1 ? "Account" : "Profile"}
            </span>
          </div>

          {step === 1 ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-foreground mb-1">Create account</h2>
                <p className="text-sm text-muted-foreground">Join daily Bible readers</p>
              </div>

              <div className="mb-6">
                <button onClick={handleGoogleSignup} disabled={loading}
                  className="btn-ghost w-full flex items-center gap-3 mb-3">
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign up with Google
                </button>
                <div className="divider-cross">or use email</div>
              </div>

              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com" required className="input-field pl-10" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type={showPassword ? "text" : "password"} value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters" required className="input-field pl-10 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength ? strengthColors[passwordStrength] : "bg-muted"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{strengthLabels[passwordStrength]}</span>
                    </div>
                  )}
                </div>
                <button type="submit" className="btn-primary w-full mt-2">Continue</button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-foreground mb-1">Your profile</h2>
                <p className="text-sm text-muted-foreground">How should others know you?</p>
              </div>
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Display Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your full name" required className="input-field pl-10" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Username</label>
                  <div className="relative">
                    <AtSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" value={username} onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="unique_handle" required className="input-field pl-10" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Letters, numbers, underscore only. Min 3 characters.</p>
                </div>
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(1)} className="btn-ghost flex-1">Back</button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1">
                    {loading ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
              <div className="mt-4 p-3 rounded-lg bg-secondary border border-border">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  After signup you&apos;ll go straight to your dashboard where you can pick a reading plan and start today.
                </p>
              </div>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
