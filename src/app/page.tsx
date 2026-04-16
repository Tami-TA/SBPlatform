"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";
import { BookOpen, Star, Users, Flame, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  const features = [
    { icon: BookOpen, title: "Multiple Translations", desc: "KJV, NIV, ESV, AMP, NKJV and more — all in one place." },
    { icon: Flame, title: "Streak Tracking", desc: "Build daily habits and earn badges for consistency milestones." },
    { icon: Users, title: "Study Groups", desc: "Create or join groups, share insights, and grow together." },
    { icon: Star, title: "Smart Annotations", desc: "Highlight, bookmark, and annotate with AI-powered insights." },
  ];

  return (
    <div className="min-h-screen bg-page overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.04] dark:opacity-[0.08]"
          style={{ background: "radial-gradient(circle, #D4AF37, transparent)" }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.04] dark:opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #8B0000, transparent)" }} />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #D4AF37, #F59E0B)" }}>
            <BookOpen size={20} className="text-gray-900" />
          </div>
          <span className="font-display text-xl font-bold text-page">Scripture</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn-ghost text-sm px-5 py-2.5">Sign In</Link>
          <Link href="/auth/signup" className="btn-gold text-sm px-5 py-2.5">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8"
          style={{ borderColor: "rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.1)", color: "var(--gold)" }}>
          <Star size={14} fill="currentColor" />
          <span className="text-sm font-medium">Your Daily Bible Companion</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-display font-bold text-page leading-tight mb-6">
          Grow Deeper in{" "}
          <span className="text-gold-gradient">God&apos;s Word</span>
          <br />Every Single Day
        </h1>
        <p className="text-lg md:text-xl text-secondary-page max-w-2xl mx-auto mb-10 leading-relaxed">
          Read, highlight, annotate, and discuss Scripture with friends and study groups.
          Build lasting habits with streaks, reading plans, and AI-powered insights.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/signup" className="btn-gold px-8 py-4 text-base">
            Start Reading Free
            <ArrowRight size={18} />
          </Link>
          <Link href="/auth/login" className="btn-ghost px-8 py-4 text-base">
            Sign In
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-12 mt-16">
          {[{ num: "66", label: "Books of the Bible" }, { num: "7+", label: "Translations" }, { num: "∞", label: "Daily Readings" }]
            .map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-display font-bold text-gold-gradient">{stat.num}</div>
                <div className="text-sm text-muted-page mt-1">{stat.label}</div>
              </div>
            ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-page mb-4">
            Everything You Need to Study Scripture
          </h2>
          <p className="text-secondary-page max-w-xl mx-auto">
            A complete platform designed to deepen your relationship with God&apos;s Word.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card p-6 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "linear-gradient(135deg, rgba(139,0,0,0.15), rgba(212,175,55,0.15))" }}>
                <f.icon size={24} style={{ color: "var(--gold)" }} />
              </div>
              <h3 className="font-semibold text-page mb-2">{f.title}</h3>
              <p className="text-sm text-secondary-page leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-16">
        <div className="rounded-2xl p-10 text-center"
          style={{ background: "linear-gradient(135deg, rgba(139,0,0,0.2) 0%, rgba(10,8,5,0.95) 50%, rgba(212,175,55,0.15) 100%)", border: "1px solid rgba(212,175,55,0.3)" }}>
          <div className="w-12 h-12 mx-auto mb-6 animate-float rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #D4AF37, #F59E0B)" }}>
            <BookOpen size={22} className="text-gray-900" />
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-page mb-4">
            Begin Your Journey Today
          </h2>
          <p className="text-secondary-page mb-8 max-w-lg mx-auto">
            Join thousands of believers reading, studying, and growing in faith together.
          </p>
          <Link href="/auth/signup" className="btn-gold px-10 py-4 text-base mx-auto inline-flex">
            Create Free Account
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 py-8 px-6 text-center text-sm text-muted-page border-t border-page">
        <p>© 2025 Scripture. Built with love for the Body of Christ.</p>
      </footer>
    </div>
  );
}
