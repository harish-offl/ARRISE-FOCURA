"use client";

import Link from "next/link";
import { ArrowRight, Brain, ChartColumn, Clock3, MoonStar, ShieldCheck, Sparkles, Target } from "lucide-react";


const features = [
  { icon: Clock3, title: "Deep work timer", description: "Track focused study blocks with a distraction-safe session flow." },
  { icon: ChartColumn, title: "Progress analytics", description: "Understand your weekly consistency and identify your best study windows." },
  { icon: ShieldCheck, title: "Distraction shield", description: "Keep your attention protected with a curated focus environment." },
  { icon: Brain, title: "Smarter habits", description: "Build routines that turn intention into measurable study momentum." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-primary)] text-lg font-bold text-white">F</div>
          <div>
            <div className="text-2xl font-semibold tracking-tight">FOCURA</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Own Your Focus</div>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-[var(--text-secondary)] md:flex">
          <a href="#features" className="transition hover:text-[var(--text-primary)]">Features</a>
          <a href="#why" className="transition hover:text-[var(--text-primary)]">Why FOCURA</a>
          <a href="#pricing" className="transition hover:text-[var(--text-primary)]">Pricing</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-elevated)]"
          >
            Log in
          </Link>
          <Link
            href="/auth"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--brand-primary)] px-5 text-sm font-medium text-white transition hover:bg-[var(--brand-primary-hover)]"
          >
            Start free
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:pb-20 lg:pt-16">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              <Sparkles className="h-4 w-4 text-[var(--brand-primary)]" />
              Less Scrolling. More Progress.
            </div>

            <h1 className="mt-6 max-w-xl text-5xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-6xl">
              Own your focus.<br />Build your future.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-[var(--text-secondary)]">
              FOCURA helps students turn study time into deep, consistent progress with a calm productivity workflow built for learning.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--brand-primary-hover)]"
              >
                Get started
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-elevated)]"
              >
                Open dashboard
              </Link>
            </div>

            <div className="mt-8 grid max-w-xl gap-5 sm:grid-cols-3">
              {[
                { value: "Ready", label: "status" },
                { value: "Fresh", label: "routine" },
                { value: "Open", label: "plan" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-2xl font-semibold tracking-tight">{stat.value}</div>
                  <div className="mt-1 text-sm text-[var(--text-secondary)]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-[var(--shadow)]">
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Focus timer</p>
                  <h2 className="mt-2 text-4xl font-semibold tracking-tight">Ready</h2>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]">
                  <Target size={24} />
                </div>
              </div>

              <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-[var(--surface-elevated)]">
                <div className="h-full w-[0%] rounded-full bg-[var(--brand-primary)]" />
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Deep work", value: "0 blocks" },
                  { label: "Tasks", value: "0 set" },
                  { label: "Goals", value: "Ready" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">{item.label}</div>
                    <div className="mt-2 text-xl font-semibold tracking-tight">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-[var(--border)] bg-[var(--surface)] py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Built for focused students</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight">Everything you need to stay in flow.</h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {features.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                    <Icon size={22} />
                  </div>
                  <div className="mt-5 text-xl font-semibold">{title}</div>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="why" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Why students use FOCURA</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight">Focus is a skill — build it with structure.</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                { icon: MoonStar, title: "Study routines", text: "Visualize your habits and commit to a sustainable rhythm." },
                { icon: ChartColumn, title: "Real insights", text: "See how your time translates into meaningful academic momentum." },
                { icon: ShieldCheck, title: "Less distraction", text: "Protect your attention from the apps and patterns that steal it." },
                { icon: Target, title: "Daily clarity", text: "Know exactly what deserves your energy each time you sit down to study." },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-primary)] text-white">
                    <Icon size={20} />
                  </div>
                  <div className="mt-5 text-lg font-semibold">{title}</div>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="border-t border-[var(--border)] bg-[var(--surface)] py-20">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Simple pricing</p>
            <h3 className="mt-3 text-4xl font-semibold tracking-tight">Start free. Stay focused.</h3>
            <div className="mt-8 rounded-[32px] border border-[var(--border)] bg-[var(--surface-elevated)] p-8">
              <div className="text-5xl font-semibold tracking-tight">$0</div>
              <div className="mt-3 text-[var(--text-secondary)]">for students who want structure without friction</div>
              <div className="mt-6 flex justify-center">
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--brand-primary-hover)]"
                >
                  Start your free plan
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
