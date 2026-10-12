"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const router = useRouter();
  const { isAuthenticated, login, isLoading } = useAuth();

  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [invitedBy, setInvitedBy] = useState("");

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (!params.has("invite")) return;

      setInvitedBy(params.get("from")?.trim() || "a FOCURA student");
      setEmail(params.get("email")?.trim() || "");
      setMode("signup");
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const passwordStrength = useMemo(() => {
    if (!password) return { label: "No password", color: "bg-[var(--border)]" };
    if (password.length < 8) return { label: "Weak", color: "bg-red-500" };
    if (password.length < 12) return { label: "Good", color: "bg-yellow-500" };
    return { label: "Strong", color: "bg-green-600" };
  }, [password]);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (mode === "signup") {
      if (!name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const user = {
        id: crypto.randomUUID(),
        email: email.trim(),
        name: name.trim() || email.split("@")[0],
        createdAt: new Date().toISOString(),
      };

      login(user, rememberMe);
      router.replace("/dashboard");
      setIsSubmitting(false);
    }, 600);
  };

  const handleReset = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!validateEmail(email)) {
      setError("Enter a valid email to reset your password.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setResetSent(true);
      setIsSubmitting(false);
    }, 500);
  };

  if (isLoading || isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-primary)] text-xl font-bold text-white">F</div>
            <div>
              <div className="text-2xl font-semibold tracking-tight">FOCURA</div>
              <div className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Focus. Discipline. Progress.</div>
            </div>
          </div>

          <div className="mt-10 max-w-md">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Study smarter</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Build your best study routine.</h1>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">
              Track deep work, block distractions, and stay consistent with a focus system built for students.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {[
              "Focus timer with distraction blocking",
              "Weekly analytics to improve consistency",
              "Study accountability with your circle",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
                <ShieldCheck className="h-5 w-5 text-[var(--brand-primary)]" />
                <span className="text-sm text-[var(--text-primary)]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-[var(--shadow)] sm:p-8">
          <div className="flex items-center justify-between gap-3 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
            <button
              type="button"
              onClick={() => {
                setError("");
                setMode("login");
              }}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === "login" ? "bg-[var(--brand-primary)] text-white" : "text-[var(--text-secondary)]"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => {
                setError("");
                setMode("signup");
              }}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === "signup" ? "bg-[var(--brand-primary)] text-white" : "text-[var(--text-secondary)]"
              }`}
            >
              Sign up
            </button>
          </div>

          {invitedBy ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              You were invited to FOCURA by <span className="font-semibold">{invitedBy}</span>. Create an account to get started.
            </div>
          ) : null}

          {mode === "reset" ? (
            <form className="mt-8 space-y-4" onSubmit={handleReset}>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Reset your password</h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Enter your email and we will send you a secure reset link.
                </p>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm text-[var(--text-secondary)]">Email</span>
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                  <Mail className="h-4 w-4 text-[var(--text-secondary)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full bg-transparent text-[var(--text-primary)] outline-none"
                    placeholder="student@focura.app"
                  />
                </div>
              </label>

              {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div> : null}
              {resetSent ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  If an account exists, a reset email has been sent.
                </div>
              ) : null}

              <div className="flex gap-3">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setMode("login")}>
                  Back to login
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send reset link"}
                </Button>
              </div>
            </form>
          ) : (
            <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
              {mode === "signup" ? (
                <label className="block">
                  <span className="mb-2 block text-sm text-[var(--text-secondary)]">Full name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-primary)]"
                    placeholder="Your name"
                  />
                </label>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-sm text-[var(--text-secondary)]">Email</span>
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                  <Mail className="h-4 w-4 text-[var(--text-secondary)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full bg-transparent text-[var(--text-primary)] outline-none"
                    placeholder="student@focura.app"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-[var(--text-secondary)]">Password</span>
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                  <LockKeyhole className="h-4 w-4 text-[var(--text-secondary)]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full bg-transparent text-[var(--text-primary)] outline-none"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-[var(--text-secondary)]">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {mode === "signup" ? (
                  <div className="mt-3 space-y-2">
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                      <div className={`h-full rounded-full ${passwordStrength.color}`} style={{ width: password ? (password.length < 8 ? "40%" : password.length < 12 ? "70%" : "100%") : "0%" }} />
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">Password strength: {passwordStrength.label}</div>
                  </div>
                ) : null}
              </label>

              {mode === "signup" ? (
                <label className="block">
                  <span className="mb-2 block text-sm text-[var(--text-secondary)]">Confirm password</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                    <LockKeyhole className="h-4 w-4 text-[var(--text-secondary)]" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="w-full bg-transparent text-[var(--text-primary)] outline-none"
                      placeholder="Repeat password"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="text-[var(--text-secondary)]">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
              ) : null}

              {mode === "login" ? (
                <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="accent-[var(--brand-primary)]" checked={rememberMe} onChange={() => setRememberMe((value) => !value)} />
                    Remember me
                  </label>
                  <button type="button" onClick={() => setMode("reset")} className="text-[var(--brand-primary)] hover:underline">
                    Forgot password?
                  </button>
                </div>
              ) : (
                <div className="text-sm text-[var(--text-secondary)]">
                  By creating an account, you agree to our <Link href="/terms" className="text-[var(--brand-primary)] hover:underline">Terms</Link> and <Link href="/privacy" className="text-[var(--brand-primary)] hover:underline">Privacy Policy</Link>.
                </div>
              )}

              {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div> : null}

              <Button type="submit" className="mt-2 w-full gap-2" disabled={isSubmitting}>
                {isSubmitting ? (mode === "login" ? "Signing in..." : mode === "signup" ? "Creating account..." : "Sending...") : mode === "login" ? "Log in to FOCURA" : mode === "signup" ? "Create account" : "Send reset link"}
                {!isSubmitting ? <ArrowRight size={16} /> : null}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
