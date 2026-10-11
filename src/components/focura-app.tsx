"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  Focus,
  Moon,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";

const weeklyData: Array<{ day: string; minutes: number }> = [];

const achievements: Array<{ icon: typeof Trophy; label: string }> = [];

type StudySession = {
  id: number;
  title: string;
  minutes: number;
  status: string;
};

type ExamScore = {
  id: number;
  exam: string;
  score: number;
  outOf: number;
  date: string;
};

type StudyMaterial = {
  id: number;
  title: string;
  url: string;
};

type FriendProfile = {
  id: number;
  name: string;
  email: string;
  scores: ExamScore[];
  materials: StudyMaterial[];
};

export default function FocuraApp() {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [loadedDataKey, setLoadedDataKey] = useState<string | null>(null);
  const [storageError, setStorageError] = useState("");
  const [scoreError, setScoreError] = useState("");
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendProfile | null>(null);
  const [sessionDraft, setSessionDraft] = useState("");
  const [sessionMinutes, setSessionMinutes] = useState(25);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [friendName, setFriendName] = useState("");
  const [friendEmail, setFriendEmail] = useState("");
  const [examName, setExamName] = useState("");
  const [examScore, setExamScore] = useState("");
  const [examOutOf, setExamOutOf] = useState("100");
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialUrl, setMaterialUrl] = useState("");

  const savedDataKey = `focura-dashboard:${user?.id ?? "guest"}`;

  const focusScore = useMemo(() => 0, []);

  const displayTime = useMemo(() => {
    const safe = Math.max(0, timeLeft);
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [timeLeft]);

  const timerProgress = useMemo(() => {
    const totalSeconds = Math.max(selectedMinutes * 60, 1);
    return Math.max(0, Math.min(100, ((totalSeconds - timeLeft) / totalSeconds) * 100));
  }, [selectedMinutes, timeLeft]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const storedData = window.localStorage.getItem(savedDataKey);
        if (storedData) {
          const parsedData = JSON.parse(storedData) as {
            sessions?: StudySession[];
            friends?: FriendProfile[];
          };
          setSessions(parsedData.sessions ?? []);
          setFriends(parsedData.friends ?? []);
        } else {
          setSessions([]);
          setFriends([]);
        }
        setStorageError("");
      } catch (error) {
        console.error("Unable to load saved FOCURA dashboard data.", error);
        setStorageError("Saved plans and study-circle data could not be loaded from this browser.");
      } finally {
        setLoadedDataKey(savedDataKey);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [savedDataKey]);

  useEffect(() => {
    if (loadedDataKey !== savedDataKey) return;

    try {
      window.localStorage.setItem(savedDataKey, JSON.stringify({ sessions, friends }));
    } catch (error) {
      console.error("Unable to save FOCURA dashboard data.", error);
      window.setTimeout(() => {
        setStorageError("Your changes could not be saved in this browser. Check available storage and try again.");
      }, 0);
    }
  }, [friends, loadedDataKey, savedDataKey, sessions]);

  useEffect(() => {
    if (!isRunning || !endTime) return;

    const tick = () => {
      const remainingSeconds = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0) {
        setIsRunning(false);
        setEndTime(null);
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [endTime, isRunning]);

  const startFocus = () => {
    if (isRunning) return;

    const nextTotal = timeLeft > 0 ? timeLeft : selectedMinutes * 60;
    setTimeLeft(nextTotal);
    setEndTime(Date.now() + nextTotal * 1000);
    setIsRunning(true);
  };

  const pauseFocus = () => {
    if (!isRunning || !endTime) return;

    const remainingSeconds = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    setTimeLeft(remainingSeconds);
    setEndTime(null);
    setIsRunning(false);
  };

  const resetFocus = () => {
    setIsRunning(false);
    setEndTime(null);
    setTimeLeft(selectedMinutes * 60);
  };

  const handleDurationSelect = (minutes: number) => {
    if (isRunning) return;
    setSelectedMinutes(minutes);
    setTimeLeft(minutes * 60);
    setEndTime(null);
  };

  const openSessionModal = (session?: StudySession) => {
    if (session) {
      setEditingSessionId(session.id);
      setSessionDraft(session.title);
      setSessionMinutes(session.minutes);
    } else {
      setEditingSessionId(null);
      setSessionDraft("");
      setSessionMinutes(25);
    }

    setShowSessionModal(true);
  };

  const handleAddSession = (event: FormEvent) => {
    event.preventDefault();

    const trimmedTitle = sessionDraft.trim();
    if (!trimmedTitle) return;

    const item = {
      id: editingSessionId ?? Date.now(),
      title: trimmedTitle,
      minutes: sessionMinutes,
      status: "Planned",
    };

    setSessions((current) => {
      if (editingSessionId !== null) {
        return current.map((session) => (session.id === editingSessionId ? item : session));
      }

      return [item, ...current];
    });

    setSessionDraft("");
    setSessionMinutes(25);
    setEditingSessionId(null);
    setShowSessionModal(false);
  };

  const handleCloseSessionModal = () => {
    setShowSessionModal(false);
    setEditingSessionId(null);
    setSessionDraft("");
    setSessionMinutes(25);
  };

  const handleInviteFriend = (event: FormEvent) => {
    event.preventDefault();

    const trimmedName = friendName.trim();
    const trimmedEmail = friendEmail.trim();
    if (!trimmedName || !trimmedEmail) return;

    setFriends((current) => [
      {
        id: Date.now(),
        name: trimmedName,
        email: trimmedEmail,
        scores: [],
        materials: [],
      },
      ...current,
    ]);

    const inviteUrl = `${window.location.origin}/auth?invite=${encodeURIComponent(trimmedEmail)}`;
    window.open(
      `mailto:${encodeURIComponent(trimmedEmail)}?subject=${encodeURIComponent("Join my FOCURA study circle")}&body=${encodeURIComponent(`Hi ${trimmedName},\n\nJoin me on FOCURA so we can study together: ${inviteUrl}`)}`,
      "_blank",
      "noopener,noreferrer",
    );

    setFriendName("");
    setFriendEmail("");
    setShowInviteModal(false);
  };

  const openFriendDetails = (friend: FriendProfile) => {
    setSelectedFriend(friend);
    setShowFriendModal(true);
    setExamName("");
    setExamScore("");
    setExamOutOf("100");
    setScoreError("");
    setMaterialTitle("");
    setMaterialUrl("");
  };

  const handleAddScore = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFriend) return;

    const score = Number(examScore);
    const outOf = Number(examOutOf);
    const exam = examName.trim();
    if (!exam || !Number.isFinite(score) || !Number.isFinite(outOf) || outOf <= 0 || score < 0) {
      setScoreError("Enter a valid exam name and score.");
      return;
    }
    if (score > outOf) {
      setScoreError("Score cannot be higher than the maximum score.");
      return;
    }

    const updatedFriend = {
      ...selectedFriend,
      scores: [{ id: Date.now(), exam, score, outOf, date: new Date().toISOString().slice(0, 10) }, ...selectedFriend.scores],
    };
    setSelectedFriend(updatedFriend);
    setFriends((current) => current.map((friend) => (friend.id === updatedFriend.id ? updatedFriend : friend)));
    setExamName("");
    setExamScore("");
    setExamOutOf("100");
    setScoreError("");
  };

  const handleAddMaterial = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFriend) return;

    const title = materialTitle.trim();
    const url = materialUrl.trim();
    try {
      const parsedUrl = new URL(url);
      if (!title || !["http:", "https:"].includes(parsedUrl.protocol)) return;
    } catch {
      return;
    }

    const updatedFriend = {
      ...selectedFriend,
      materials: [{ id: Date.now(), title, url }, ...selectedFriend.materials],
    };
    setSelectedFriend(updatedFriend);
    setFriends((current) => current.map((friend) => (friend.id === updatedFriend.id ? updatedFriend : friend)));
    setMaterialTitle("");
    setMaterialUrl("");
  };

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] transition-colors duration-200">
        {showSessionModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold tracking-tight">
                  {editingSessionId !== null ? "Edit study plan" : "Plan session"}
                </h3>
                <button type="button" onClick={handleCloseSessionModal} className="text-sm text-[var(--text-secondary)]">Close</button>
              </div>

              <form onSubmit={handleAddSession} className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Session title</label>
                  <input
                    value={sessionDraft}
                    onChange={(event) => setSessionDraft(event.target.value)}
                    placeholder="Deep work, revision, reading..."
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none ring-0 placeholder:text-[var(--text-secondary)]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Focus length</label>
                  <select
                    value={sessionMinutes}
                    onChange={(event) => setSessionMinutes(Number(event.target.value))}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none"
                  >
                    {[15, 25, 45, 60, 90].map((minutes) => (
                      <option key={minutes} value={minutes}>{minutes} minutes</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={handleCloseSessionModal}>Cancel</Button>
                  <Button type="submit">{editingSessionId !== null ? "Update plan" : "Save plan"}</Button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {showInviteModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold tracking-tight">Invite friend</h3>
                <button type="button" onClick={() => setShowInviteModal(false)} className="text-sm text-[var(--text-secondary)]">Close</button>
              </div>

              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                This creates a pending invite on this browser and opens your email app with an invitation draft. Your friend must create an account before the two of you can share live data.
              </p>
              <form onSubmit={handleInviteFriend} className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Friend name</label>
                  <input
                    value={friendName}
                    onChange={(event) => setFriendName(event.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none ring-0 placeholder:text-[var(--text-secondary)]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Email</label>
                  <input
                    type="email"
                    value={friendEmail}
                    onChange={(event) => setFriendEmail(event.target.value)}
                    placeholder="alex@email.com"
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none ring-0 placeholder:text-[var(--text-secondary)]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setShowInviteModal(false)}>Cancel</Button>
                  <Button type="submit">Send invite</Button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {showFriendModal && selectedFriend ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold tracking-tight">{selectedFriend.name}</h3>
                <button type="button" onClick={() => setShowFriendModal(false)} className="text-sm text-[var(--text-secondary)]">Close</button>
              </div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{selectedFriend.email} · Invite pending</p>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                  <h4 className="font-semibold">Exam scores</h4>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">Add score details you and your friend agree to track.</p>
                  {selectedFriend.scores.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {selectedFriend.scores.map((score) => (
                        <div key={score.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                          <div>
                            <div className="font-medium">{score.exam}</div>
                            <div className="text-xs text-[var(--text-secondary)]">{score.date}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{score.score} / {score.outOf}</div>
                            <div className="text-xs text-[var(--text-secondary)]">{Math.round((score.score / score.outOf) * 100)}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-secondary)]">
                      No exam scores have been added.
                    </div>
                  )}
                  <form onSubmit={handleAddScore} className="mt-4 grid gap-3 sm:grid-cols-4">
                    <input aria-label="Exam name" value={examName} onChange={(event) => setExamName(event.target.value)} placeholder="Exam name" required className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm" />
                    <input aria-label="Score" type="number" min="0" step="any" value={examScore} onChange={(event) => setExamScore(event.target.value)} placeholder="Score" required className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm" />
                    <input aria-label="Maximum score" type="number" min="0.01" step="any" value={examOutOf} onChange={(event) => setExamOutOf(event.target.value)} placeholder="Out of" required className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm" />
                    <Button type="submit">Add score</Button>
                  </form>
                  {scoreError ? <p role="alert" className="mt-2 text-sm text-red-600">{scoreError}</p> : null}
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                  <h4 className="font-semibold">Study materials</h4>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">Share links to notes, documents, or learning resources.</p>
                  <div className="mt-3 space-y-2 text-sm text-[var(--text-primary)]">
                    {selectedFriend.materials.length > 0 ? (
                      selectedFriend.materials.map((material) => (
                        <div key={material.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                          <a href={material.url} target="_blank" rel="noreferrer" className="font-medium text-[var(--brand-primary)] hover:underline">{material.title}</a>
                          <div className="break-all text-xs text-[var(--text-secondary)]">{material.url}</div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text-secondary)]">
                        No materials shared yet.
                      </div>
                    )}
                  </div>
                  <form onSubmit={handleAddMaterial} className="mt-4 grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
                    <input aria-label="Material title" value={materialTitle} onChange={(event) => setMaterialTitle(event.target.value)} placeholder="Material title" required className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm" />
                    <input aria-label="Material link" type="url" value={materialUrl} onChange={(event) => setMaterialUrl(event.target.value)} placeholder="https://..." required className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm" />
                    <Button type="submit">Add link</Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--navigation-background)]/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-lg font-bold text-white">
                F
              </div>
              <div>
                <div className="text-xl font-semibold tracking-tight">FOCURA</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                  Own Your Focus
                </div>
              </div>
            </div>

            <nav className="hidden items-center gap-6 text-sm text-[var(--text-secondary)] md:flex">
              <a href="#dashboard" className="transition hover:text-[var(--text-primary)]">Dashboard</a>
              <a href="#sessions" className="transition hover:text-[var(--text-primary)]">Sessions</a>
              <a href="#friends" className="transition hover:text-[var(--text-primary)]">Friends</a>
              <a href="#analytics" className="transition hover:text-[var(--text-primary)]">Analytics</a>
            </nav>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setIsDark((value) => !value)} aria-label="Toggle theme">
                {isDark ? <SunIcon /> : <Moon size={18} />}
              </Button>
              <Button variant="secondary">Log in</Button>
              <Button>Start Focus</Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text-secondary)]">
            Plans, pending invitations, score records, and material links are saved only in this browser for your account. They are not yet synced or visible to friends; connect a Supabase project to enable real shared accounts and data.
          </div>
          {storageError ? (
            <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {storageError}
            </div>
          ) : null}
          <section id="dashboard" className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-7"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                    Today&apos;s plan
                  </p>
                  <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                    Start with one clear study block.
                  </h1>
                </div>
                <div className="hidden rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] sm:block">
                  No goals yet
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button className="gap-2" onClick={startFocus}>
                  <Play size={16} /> Start timer
                </Button>
                <Button variant="secondary" className="gap-2" onClick={() => setShowSessionModal(true)}>
                  <Target size={16} /> Set goals
                </Button>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  { icon: Clock3, label: "Focus time", value: "0h 00m" },
                  { icon: CheckCircle2, label: "Completed", value: "0 / 0" },
                  { icon: Zap, label: "Streak", value: "0 days" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
                      <Icon className="h-4 w-4 text-[var(--brand-primary)]" />
                    </div>
                    <div className="mt-5 text-2xl font-semibold tracking-tight">{value}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-[var(--shadow)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Focus timer</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight">{displayTime}</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]">
                  <Focus size={22} />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface)]">
                  <div className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-300" style={{ width: `${timerProgress}%` }} />
                </div>

                <div className="flex items-center gap-2">
                  {[25, 50, 90].map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => handleDurationSelect(minutes)}
                      className={`flex-1 rounded-full border px-3 py-2 text-sm font-medium transition ${
                        selectedMinutes === minutes
                          ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                      }`}
                    >
                      {minutes}m
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1" onClick={isRunning ? pauseFocus : startFocus}>
                    {isRunning ? "Pause" : "Start focus"}
                  </Button>
                  <Button variant="secondary" className="flex-1" onClick={resetFocus}>
                    Reset
                  </Button>
                </div>
              </div>
            </motion.aside>
          </section>

          <section id="sessions" className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Sessions</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight">Today&apos;s study flow</h3>
                </div>
                <Button variant="secondary" className="gap-2" onClick={() => openSessionModal()}>
                  <BookOpen size={16} /> Plan session
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                {sessions.length > 0 ? (
                  sessions.map((task) => (
                    <div key={task.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]">
                          <Target size={18} />
                        </div>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-[var(--text-secondary)]">{task.minutes} min focus</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openSessionModal(task)}
                          className="rounded-full border border-[var(--border)] px-2 py-1 text-xs font-medium text-[var(--text-primary)]"
                        >
                          Edit
                        </button>
                        <div className="rounded-full bg-[var(--brand-primary)]/10 px-3 py-1 text-xs font-medium text-[var(--brand-primary)]">
                          {task.status}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-elevated)] p-6 text-sm text-[var(--text-secondary)]">
                    No study sessions scheduled yet. Add your first task to begin.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-[var(--shadow)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Momentum</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight">Distraction shield</h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <ShieldCheck size={18} />
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                  <span>Focus score</span>
                  <span className="font-semibold text-[var(--text-primary)]">{focusScore}%</span>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--surface-elevated)]">
                  <div className="h-full rounded-full bg-[var(--brand-primary)]" style={{ width: `${focusScore}%` }} />
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span>Website blockers active</span>
                  <span className="font-medium text-[var(--text-primary)]">0 sites</span>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  "Set your first distraction block when you are ready.",
                  "Focus mode will appear once your session begins.",
                  "Create your first goal to start building momentum.",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-[var(--brand-primary)]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="analytics" className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Analytics</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight">Weekly focus trend</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <BarChart3 size={16} className="text-[var(--brand-primary)]" />
                  9.4h this week
                </div>
              </div>

              <div className="mt-6 h-64 w-full">
                {weeklyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="focusFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FF0000" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="#FF0000" stopOpacity={0.04} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                      <Area type="monotone" dataKey="minutes" stroke="#FF0000" strokeWidth={3} fill="url(#focusFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[var(--border)] text-sm text-[var(--text-secondary)]">
                    Start your first focus session to see your progress chart.
                  </div>
                )}
              </div>
            </div>

            <div id="friends" className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-[var(--shadow)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Study circle</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight">Friends</h3>
                </div>
                <Button variant="secondary" size="sm" className="gap-2" onClick={() => setShowInviteModal(true)}>
                  <Users size={14} /> Invite
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                {friends.length > 0 ? (
                  friends.map((buddy) => (
                    <div key={buddy.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                      <button type="button" onClick={() => openFriendDetails(buddy)} className="flex flex-1 items-center justify-between gap-3 text-left">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 text-sm font-semibold text-[var(--brand-primary)]">
                            {buddy.name.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium">{buddy.name}</div>
                            <div className="text-sm text-[var(--text-secondary)]">{buddy.email} · Invite pending</div>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          {buddy.scores.length} score{buddy.scores.length === 1 ? "" : "s"} · {buddy.materials.length} link{buddy.materials.length === 1 ? "" : "s"}
                        </div>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-[var(--text-secondary)]">
                    Your study circle is empty. Invite a friend when you are ready.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 md:grid-cols-3">
            {achievements.length > 0 ? (
              achievements.map(({ icon: Icon, label }) => (
                <div key={label} className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-white">
                    <Icon size={20} />
                  </div>
                  <div className="mt-5 text-lg font-semibold">{label}</div>
                  <div className="mt-2 text-sm text-[var(--text-secondary)]">Unlocked this week</div>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-[var(--text-secondary)]">
                Complete your first study session to unlock your first achievement.
              </div>
            )}
          </section>

          <section className="mt-8 rounded-[28px] border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-[var(--shadow)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Next milestone</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Your first focus block will unlock the next milestone.</h3>
              </div>
              <Button className="gap-2">
                Continue <ArrowRight size={16} />
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function SunIcon() {
  return <Sparkles size={18} className="text-[var(--text-primary)]" />;
}
