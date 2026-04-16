"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, appleProvider } from "@/lib/firebase";
import { createUserProfile, getUserProfile } from "@/lib/firestore";
import { generateUsername } from "@/lib/utils";
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
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      await createUserProfile(cred.user.uid, {
        email,
        username,
        displayName,
        photoURL: undefined,
      });
      setFirebaseUser(cred.user);
      const profile = await getUserProfile(cred.user.uid);
      setUser(profile);
      toast.success("Account created! Welcome to Scripture 🎉");
      router.replace("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      toast.error(msg.includes("email-already-in-use") ? "Email already registered" : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      setFirebaseUser(cred.user);
      let profile = await getUserProfile(cred.user.uid);
      if (!profile) {
        const username = generateUsername(cred.user.displayName || "user");
        await createUserProfile(cred.user.uid, {
          email: cred.user.email || "",
          username,
          displayName: cred.user.displayName || "Bible Reader",
          photoURL: cred.user.photoURL || undefined,
        });
        profile = await getUserProfile(cred.user.uid);
      }
      setUser(profile);
      toast.success("Account created with Google!");
      router.replace("/dashboard");
    } catch {
      toast.error("Google sign-up failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleSignup() {
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, appleProvider);
      setFirebaseUser(cred.user);
      let profile = await getUserProfile(cred.user.uid);
      if (!profile) {
        const uname = generateUsername(cred.user.displayName || "user");
        await createUserProfile(cred.user.uid, {
          email: cred.user.email || "",
          username: uname,
          displayName: cred.user.displayName || "Bible Reader",
        });
        profile = await getUserProfile(cred.user.uid);
      }
      setUser(profile);
      toast.success("Account created with Apple!");
      router.replace("/dashboard");
    } catch {
      toast.error("Apple sign-up failed");
    } finally {
      setLoading(false);
    }
  }

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabels = ["", "Weak", "Good", "Strong"];
  const strengthColors = ["", "bg-red-500", "bg-yellow-500", "bg-green-500"];

  return (
    <div className="min-h-screen bg-page flex">
      {/* Decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0a0805 0%, #1a0808 50%, #0d0a04 100%)" }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8 animate-float"
            style={{ background: "linear-gradient(135deg, #D4AF37, #F59E0B)", boxShadow: "0 0 40px rgba(212,175,55,0.4)" }}>
            <BookOpen size={36} className="text-gray-900" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-4">
            Begin Your Journey
          </h1>
          <p className="text-gray-400 max-w-sm leading-relaxed mb-6">
            &ldquo;Blessed is the one who reads aloud the words of this prophecy.&rdquo;
          </p>
          <p className="text-gold-500 text-sm font-medium">— Revelation 1:3</p>
          {/* Perks list */}
          <div className="mt-10 space-y-3 text-left max-w-xs">
            {["7+ Bible translations", "Daily streaks & badges", "Study groups & friends", "AI-powered insights", "Personal annotations"].map((p) => (
              <div key={p} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(212,175,55,0.2)", border: "1px solid rgba(212,175,55,0.4)" }}>
                  <Check size={12} style={{ color: "#D4AF37" }} />
                </div>
                <span className="text-sm text-gray-300">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-page hover:text-page transition-colors mb-8">
            <ArrowLeft size={16} /> Back to home
          </Link>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? "text-gray-900" : "text-muted-page"}`}
                  style={{ background: step >= s ? "linear-gradient(135deg, #D4AF37, #F59E0B)" : "var(--bg-secondary)" }}>
                  {step > s ? <Check size={14} /> : s}
                </div>
                {s < 2 && <div className={`flex-1 h-0.5 w-8 transition-all ${step > s ? "opacity-100" : "opacity-30"}`}
                  style={{ background: "linear-gradient(90deg, #D4AF37, #F59E0B)" }} />}
              </div>
            ))}
            <span className="text-sm text-secondary-page ml-2">
              {step === 1 ? "Account Details" : "Your Profile"}
            </span>
          </div>

          {step === 1 ? (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-display font-bold text-page mb-2">Create Account</h2>
                <p className="text-secondary-page">Join thousands of daily Bible readers</p>
              </div>

              <div className="space-y-3 mb-6">
                <button onClick={handleGoogleSignup} disabled={loading} className="btn-ghost w-full flex items-center gap-3">
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign up with Google
                </button>
                <button onClick={handleAppleSignup} disabled={loading} className="btn-ghost w-full flex items-center gap-3">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                  </svg>
                  Sign up with Apple
                </button>
              </div>

              <div className="divider-cross mb-6">or use email</div>

              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-page mb-2">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-page" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com" required className="input-field pl-10" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-page mb-2">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-page" />
                    <input type={showPassword ? "text" : "password"} value={password}
                      onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters"
                      required className="input-field pl-10 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-page hover:text-page">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength ? strengthColors[passwordStrength] : "bg-[var(--bg-secondary)]"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-page">{strengthLabels[passwordStrength]}</span>
                    </div>
                  )}
                </div>
                <button type="submit" className="btn-gold w-full mt-2">Continue</button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-display font-bold text-page mb-2">Your Profile</h2>
                <p className="text-secondary-page">How should others know you?</p>
              </div>
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-page mb-2">Display Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-page" />
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your full name" required className="input-field pl-10" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-page mb-2">Username</label>
                  <div className="relative">
                    <AtSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-page" />
                    <input type="text" value={username} onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="unique_handle" required className="input-field pl-10" />
                  </div>
                  <p className="text-xs text-muted-page mt-1.5">Friends can find you by username. Letters, numbers, underscore only.</p>
                </div>
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(1)} className="btn-ghost flex-1">Back</button>
                  <button type="submit" disabled={loading} className="btn-crimson flex-1">
                    {loading ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </>
          )}

          <p className="text-center text-sm text-secondary-page mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: "var(--gold)" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
