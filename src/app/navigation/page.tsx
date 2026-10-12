import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Focus,
  Home,
  Library,
  Users,
} from "lucide-react";

import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";

const destinations = [
  {
    title: "Dashboard",
    description: "Your daily plan and focus overview.",
    href: "/dashboard#dashboard",
    icon: Home,
  },
  {
    title: "Focus timer",
    description: "Start or continue a distraction-free session.",
    href: "/focus",
    icon: Focus,
  },
  {
    title: "Study sessions",
    description: "Plan, edit, and track your study blocks.",
    href: "/dashboard#sessions",
    icon: CheckCircle2,
  },
  {
    title: "Study materials",
    description: "Open your folders, notes, and resources.",
    href: "/dashboard#materials",
    icon: Library,
  },
  {
    title: "Analytics",
    description: "Review your weekly study progress.",
    href: "/dashboard#analytics",
    icon: BarChart3,
  },
  {
    title: "Study circle",
    description: "Manage friends, invites, scores, and shared links.",
    href: "/dashboard#friends",
    icon: Users,
  },
];

export default function NavigationPage() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--text-primary)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <header className="mt-10 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-primary)] text-lg font-bold text-white">F</span>
              <div>
                <p className="text-sm font-semibold tracking-[0.2em]">FOCURA</p>
                <p className="text-xs text-[var(--text-secondary)]">Workspace navigation</p>
              </div>
            </div>
            <h1 className="mt-8 text-4xl font-semibold tracking-tight sm:text-5xl">Where would you like to go?</h1>
            <p className="mt-3 text-base text-[var(--text-secondary)]">
              Jump directly to the tools and spaces you use to plan, focus, and learn.
            </p>
          </header>

          <nav aria-label="Workspace pages" className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map(({ title, description, href, icon: Icon }) => (
              <Link
                key={title}
                href={href}
                className="group rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] transition hover:-translate-y-1 hover:border-[var(--brand-primary)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                  <Icon size={20} />
                </span>
                <h2 className="mt-5 text-lg font-semibold">{title}</h2>
                <p className="mt-2 min-h-10 text-sm leading-5 text-[var(--text-secondary)]">{description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)]">
                  Open {title.toLowerCase()}
                  <BookOpen size={15} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </nav>

          <div className="mt-8">
            <Button asChild>
              <Link href="/dashboard">Return to dashboard</Link>
            </Button>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
