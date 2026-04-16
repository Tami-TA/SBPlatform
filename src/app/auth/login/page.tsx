"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, appleProvider } from "@/lib/firebase";
import { getUserProfile, createUserProfile } from "@/lib/firestore";
import { generateUsername } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import toast from "react-hot-toast";
import { BookOpen, Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser, setFirebaseUser } = useAuthStore();

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setFirebaseUser(cred.user);
      const profile = await getUserProfile(cred.user.uid);
      setUser(profile);
      toast.success("Welcome back!");
      router.replace("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      toast.error(msg.includes("wrong-password") ? "Incorrect password" : msg.includes("user-not-found") ? "No account found" : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
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
      toast.success("Signed in with Google!");
      router.replace("/dashboard");
    } catch {
      toast.error("Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleLogin() {
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, appleProvider);
      setFirebaseUser(cred.user);
      let profile = await getUserProfile(cred.user.uid);
      if (!profile) {
        const username = generateUsername(cred.user.displayName || "user");
        await createUserProfile(cred.user.uid, {
          email: cred.user.email || "",
          username,
          displayName: cred.user.displayName || "Bible Reader",
        });
        profile = await getUserProfile(cred.user.uid);
      }
      setUser(profile);
      toast.success("Signed in with Apple!");
      router.replace("/dashboard");
    } catch {
      toast.error("Apple sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-page flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0a0805 0%, #1a0808 50%, #0d0a04 100%)" }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8 animate-float"
            style={{ background: "linear-gradient(135deg, #D4AF37, #F59E0B)", boxShadow: "0 0 40px rgba(212,175,55,0.4)" }}>
            <BookOpen size={36} className="text-gray-900" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-4">
            Welcome Back to Scripture
          </h1>
          <p className="text-gray-400 max-w-sm leading-relaxed">
            &ldquo;Your word is a lamp to my feet and a light to my path.&rdquo;
          </p>
          <p className="text-gold-500 text-sm mt-3 font-medium">— Psalm 119:105</p>
          {/* Decorative diamonds */}
          <div className="absolute top-12 right-12 w-8 h-8 opacity-20 animate-float"
            style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", background: "#D4AF37", animationDelay: "0.5s" }} />
          <div className="absolute bottom-20 left-16 w-5 h-5 opacity-15 animate-float"
            style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", background: "#D4AF37", animationDelay: "1s" }} />
          <div className="absolute top-1/3 left-10 w-3 h-3 opacity-10"
            style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", background: "#D4AF37" }} />
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-page hover:text-page transition-colors mb-8">
            <ArrowLeft size={16} /> Back to home
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold text-page mb-2">Sign In</h2>
            <p className="text-secondary-page">Continue your faith journey</p>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button onClick={handleGoogleLogin} disabled={loading}
              className="btn-ghost w-full flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Continue with Google</span>
            </button>
            <button onClick={handleAppleLogin} disabled={loading}
              className="btn-ghost w-full flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="currentColor">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
              </svg>
              <span>Continue with Apple</span>
            </button>
          </div>

          <div className="divider-cross mb-6">or sign in with email</div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-page mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-page" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-page mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-page" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-field pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-page hover:text-page transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-crimson w-full mt-2">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-secondary-page mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="font-semibold hover:underline" style={{ color: "var(--gold)" }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
