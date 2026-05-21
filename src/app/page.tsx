"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";
import {
  BookOpen, Flame, Users, ArrowRight, Check,
  Highlighter, ListChecks, Sparkles, ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen size={16} className="text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">Scripture</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="btn-ghost text-sm px-4 py-2">Sign In</Link>
            <Link href="/auth/signup" className="btn-primary text-sm px-4 py-2">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-5 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-8">
          <Flame size={12} />
          Build a daily reading habit
        </div>
        <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground leading-tight mb-5">
          Read Scripture every day.<br />
          <span className="text-primary">Actually stick with it.</span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
          Structured reading plans, highlighting, notes, and progress tracking — everything you need to build a lasting Bible habit.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/auth/signup" className="btn-primary px-7 py-3 text-sm font-semibold">
            Start Your Reading Plan <ArrowRight size={15} />
          </Link>
          <Link href="/auth/login" className="btn-ghost px-7 py-3 text-sm">
            Sign in
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-4">Free to use · No credit card required</p>
      </section>

      {/* ── Product Preview ── */}
      <section className="max-w-6xl mx-auto px-5 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Bible Reader Preview */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-secondary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={13} className="text-primary" />
                <span className="text-xs font-semibold text-foreground">John 3 · NIV</span>
              </div>
              <div className="flex gap-1">
                <div className="w-5 h-5 rounded bg-muted" />
                <div className="w-5 h-5 rounded bg-muted" />
              </div>
            </div>
            <div className="p-4 space-y-2.5">
              <p className="text-sm text-foreground leading-relaxed">
                <span className="text-[10px] text-muted-foreground mr-1.5 font-mono">14</span>
                Just as Moses lifted up the snake in the wilderness, so the Son of Man must be lifted up,
              </p>
              <p className="text-sm leading-relaxed">
                <span className="text-[10px] text-muted-foreground mr-1.5 font-mono">15</span>
                <span className="bg-primary/20 text-foreground px-0.5 rounded">that everyone who believes may have eternal life in him.</span>
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                <span className="text-[10px] text-muted-foreground mr-1.5 font-mono">16</span>
                For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish
              </p>
              <div className="flex gap-1.5 pt-1">
                <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">Highlight</span>
                <span className="text-[10px] px-2 py-1 rounded-full bg-secondary text-muted-foreground">Note</span>
                <span className="text-[10px] px-2 py-1 rounded-full bg-secondary text-muted-foreground">Bookmark</span>
              </div>
            </div>
            <div className="px-4 py-2.5 bg-secondary border-t border-border">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Bible Reader</p>
            </div>
          </div>

          {/* Reading Plan Preview */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-secondary flex items-center gap-2">
              <ListChecks size={13} className="text-primary" />
              <span className="text-xs font-semibold text-foreground">Gospel Journey · Day 8/28</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span className="font-semibold text-primary">29%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "29%" }} />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-primary/8 border border-primary/20">
                <p className="text-xs font-semibold text-primary mb-0.5">Today · Day 8</p>
                <p className="text-sm font-medium text-foreground">Mark 6–7</p>
              </div>
              {[
                { day: 6, ref: "Mark 2–3", done: true },
                { day: 7, ref: "Mark 4–5", done: true },
                { day: 9, ref: "Mark 8–9", done: false },
              ].map((d) => (
                <div key={d.day} className={`flex items-center gap-2.5 py-1 ${!d.done ? "opacity-40" : ""}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${d.done ? "bg-green-500/20" : "bg-secondary"}`}>
                    {d.done && <Check size={10} className="text-green-500" />}
                  </div>
                  <span className="text-xs text-muted-foreground">Day {d.day} · {d.ref}</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 bg-secondary border-t border-border">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Reading Plans</p>
            </div>
          </div>

          {/* AI Insight Preview */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-secondary flex items-center gap-2">
              <Sparkles size={13} className="text-primary" />
              <span className="text-xs font-semibold text-foreground">AI Insight · John 3:16</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="p-3 rounded-lg bg-secondary">
                <p className="text-xs text-foreground leading-relaxed">
                  &ldquo;For God so loved the world&rdquo; — The Greek <em>agapē</em> (ἀγάπη) conveys unconditional, self-sacrificial love, distinct from friendship or romantic love.
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Related Verses</p>
                <div className="space-y-1.5">
                  {["Romans 5:8", "1 John 4:9–10", "Ephesians 2:4–5"].map((v) => (
                    <div key={v} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-xs text-primary">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-primary/8 border border-primary/20">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Note added: </span>
                  The scope of &quot;world&quot; shows God&apos;s love has no boundaries.
                </p>
              </div>
            </div>
            <div className="px-4 py-2.5 bg-secondary border-t border-border">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Annotations & AI</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="border-t border-border bg-secondary/40">
        <div className="max-w-5xl mx-auto px-5 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
              Three steps to a better Bible habit
            </h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Start reading in under a minute. No complicated setup.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: ListChecks,
                title: "Choose your reading plan",
                desc: "Pick from curated plans like 'Gospel Journey' or 'New Testament in 30 Days', or build a custom plan around the books you want to study.",
              },
              {
                step: "02",
                icon: Highlighter,
                title: "Read, highlight & take notes",
                desc: "Navigate any of 66 Bible books across multiple translations. Highlight verses, add personal notes, and bookmark passages to revisit.",
              },
              {
                step: "03",
                icon: Flame,
                title: "Track your streak & grow",
                desc: "Mark each day complete, watch your streak grow, and earn milestones. Your progress is always saved so you never lose your place.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <item.icon size={18} className="text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Step {item.step}</p>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto px-5 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
            Everything in one place
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: BookOpen, title: "7+ Translations", desc: "KJV, NIV, ESV, AMP, NKJV and more" },
            { icon: Flame, title: "Streak Tracking", desc: "Daily habits and milestone badges" },
            { icon: Users, title: "Study Groups", desc: "Read and discuss with others" },
            { icon: Sparkles, title: "AI Insights", desc: "Context, cross-references, and commentary" },
          ].map((f) => (
            <div key={f.title} className="card p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <f.icon size={18} className="text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="border-t border-border bg-secondary/40">
        <div className="max-w-5xl mx-auto px-5 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-3">What readers say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                quote: "I&apos;ve tried every Bible app out there. This is the only one where I actually finished a reading plan.",
                name: "Sarah M.",
                role: "35-day streak",
              },
              {
                quote: "The AI insights on passages I&apos;ve read a hundred times made me see them completely differently.",
                name: "James T.",
                role: "Seminary student",
              },
              {
                quote: "Our small group uses the shared annotation feature every week. It&apos;s completely changed how we discuss scripture.",
                name: "Pastor David K.",
                role: "Community leader",
              },
            ].map((t) => (
              <div key={t.name} className="card p-5">
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} className="w-3.5 h-3.5 text-primary fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-4"
                  dangerouslySetInnerHTML={{ __html: t.quote }} />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-3xl mx-auto px-5 py-20 text-center">
        <div className="card p-10">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-6">
            <BookOpen size={20} className="text-primary-foreground" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
            Start reading today
          </h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Pick a plan, open any book of the Bible, and build a habit that lasts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup" className="btn-primary px-7 py-3 text-sm font-semibold">
              Create Free Account <ArrowRight size={15} />
            </Link>
            <Link href="/auth/login" className="btn-ghost px-7 py-3 text-sm flex items-center gap-1.5">
              Already have an account <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
            {["Free forever", "No ads", "Works offline"].map(item => (
              <span key={item} className="flex items-center gap-1">
                <Check size={11} className="text-primary" /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8 px-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <BookOpen size={12} className="text-primary-foreground" />
          </div>
          <span className="font-display font-semibold text-sm text-foreground">Scripture</span>
        </div>
        <p className="text-xs text-muted-foreground">© 2025 Scripture. Built with love for the Body of Christ.</p>
      </footer>
    </div>
  );
}
