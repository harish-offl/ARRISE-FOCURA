"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlarmClockCheck, Pause, Play, RotateCcw, SkipForward, Volume2, VolumeX } from "lucide-react";

import { formatTime } from "@/lib/auth-session";
import { useAuth } from "@/components/auth-provider";
import { loadFocusMode, saveFocusMode, subscribeFocusMode } from "@/lib/focura-data";
import type { FocusModeState } from "@/lib/focura-types";

const defaultState: FocusModeState = {
  selectedMinutes: 25,
  remainingSeconds: 25 * 60,
  isRunning: false,
  isCompleted: false,
  endTime: null,
  startedAt: null,
  taskTitle: "Your next study block",
  goal: "Set a clear objective before starting.",
};

export function FocusMode() {
  const { user } = useAuth();
  const [state, setState] = useState<FocusModeState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [dataError, setDataError] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const latestState = useRef(state);
  const skipRemoteSave = useRef(false);

  useEffect(() => {
    latestState.current = state;
  }, [state]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    let unsubscribe = () => {};

    void loadFocusMode(user.id).then((remoteState) => {
      if (!active) return;
      skipRemoteSave.current = true;
      if (remoteState) setState(remoteState);
      setIsLoaded(true);
      setDataError("");
      unsubscribe = subscribeFocusMode(user.id, (nextState) => {
        if (!active || !nextState) return;
        skipRemoteSave.current = true;
        setState(nextState);
      });
    }).catch((error: unknown) => {
      console.error("Unable to load the FOCURA focus timer.", error);
      if (active) {
        setDataError("Your focus timer could not be loaded from your account.");
        setIsLoaded(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (!user || !isLoaded) return;
    if (skipRemoteSave.current) {
      skipRemoteSave.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveFocusMode(user.id, latestState.current)
        .then(() => setDataError(""))
        .catch((error: unknown) => {
          console.error("Unable to sync the FOCURA focus timer.", error);
          setDataError("Your focus timer could not be synced. Check your connection and retry.");
        });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [isLoaded, state.endTime, state.isCompleted, state.isRunning, state.selectedMinutes, state.startedAt, state.taskTitle, state.goal, user]);

  useEffect(() => {
    if (!isLoaded || !state.isRunning || state.isCompleted || !state.endTime) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((state.endTime! - Date.now()) / 1000));

      if (remaining <= 0) {
        setState((current) => ({
          ...current,
          remainingSeconds: 0,
          isRunning: false,
          isCompleted: true,
          endTime: null,
        }));
        return;
      }

      setState((current) => ({
        ...current,
        remainingSeconds: remaining,
      }));
    }, 250);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLoaded, state.endTime, state.isCompleted, state.isRunning]);

  const displayTime = useMemo(() => formatTime(state.remainingSeconds), [state.remainingSeconds]);

  const startFocus = () => {
    const nextRemaining = state.remainingSeconds || state.selectedMinutes * 60;
    const nextEnd = Date.now() + nextRemaining * 1000;

    setState((current) => ({
      ...current,
      remainingSeconds: nextRemaining,
      isRunning: true,
      isCompleted: false,
      endTime: nextEnd,
      startedAt: Date.now(),
    }));
  };

  const pauseFocus = () => {
    if (!state.endTime) return;

    const remaining = Math.max(0, Math.ceil((state.endTime - Date.now()) / 1000));

    setState((current) => ({
      ...current,
      remainingSeconds: remaining,
      isRunning: false,
      endTime: null,
    }));
  };

  const resumeFocus = () => {
    if (state.remainingSeconds <= 0) {
      setState((current) => ({
        ...current,
        remainingSeconds: current.selectedMinutes * 60,
        isRunning: true,
        isCompleted: false,
        endTime: Date.now() + current.selectedMinutes * 60 * 1000,
      }));
      return;
    }

    setState((current) => ({
      ...current,
      isRunning: true,
      isCompleted: false,
      endTime: Date.now() + current.remainingSeconds * 1000,
    }));
  };

  const resetFocus = () => {
    setState((current) => ({
      ...current,
      remainingSeconds: current.selectedMinutes * 60,
      isRunning: false,
      isCompleted: false,
      endTime: null,
    }));
  };

  const setDuration = (minutes: number) => {
    setState((current) => ({
      ...current,
      selectedMinutes: minutes,
      remainingSeconds: current.isRunning || current.isCompleted ? current.remainingSeconds : minutes * 60,
      endTime: current.isRunning ? current.endTime : null,
    }));
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-sm text-[var(--text-secondary)]">
        Loading your focus timer...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 text-[var(--text-primary)] sm:p-6">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-8">
        {dataError ? <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{dataError}</div> : null}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Focus mode</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Zero distraction. Full attention.</h1>
          </div>

          <button
            type="button"
            onClick={() => setShowExit((value) => !value)}
            className="rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-primary)]"
          >
            Exit focus
          </button>
        </div>

        <div className="mt-8 rounded-[30px] border border-[var(--border)] bg-[var(--surface-elevated)] p-5 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col items-center justify-center rounded-[28px] border border-[var(--border)] bg-[var(--background)] p-6">
              <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                <AlarmClockCheck className="h-4 w-4 text-[var(--brand-primary)]" />
                {state.isRunning ? "Session active" : state.isCompleted ? "Completed" : "Ready to begin"}
              </div>

              <div className="mt-8 text-6xl font-semibold tracking-[-0.08em] sm:text-8xl">
                {displayTime}
              </div>

              <div className="mt-5 text-center">
                <div className="text-xl font-medium">{state.taskTitle}</div>
                <div className="mt-2 text-sm text-[var(--text-secondary)]">{state.goal}</div>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                {!state.isRunning ? (
                  <button
                    type="button"
                    onClick={state.isCompleted ? resetFocus : startFocus}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-medium text-white"
                  >
                    <Play size={16} />
                    {state.isCompleted ? "Restart" : "Start"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={pauseFocus}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-medium text-white"
                  >
                    <Pause size={16} /> Pause
                  </button>
                )}

                {state.isRunning || (!state.isRunning && state.remainingSeconds !== state.selectedMinutes * 60) ? (
                  <button
                    type="button"
                    onClick={resumeFocus}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--text-primary)]"
                  >
                    <SkipForward size={16} /> Resume
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={resetFocus}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--text-primary)]"
                >
                  <RotateCcw size={16} /> Reset
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Duration</div>
                <div className="mt-4 flex gap-2">
                  {[25, 50, 90].map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => setDuration(minutes)}
                      className={`flex-1 rounded-full px-3 py-2 text-sm font-medium ${
                        state.selectedMinutes === minutes
                          ? "bg-[var(--brand-primary)] text-white"
                          : "border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)]"
                      }`}
                    >
                      {minutes}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Ambient sound</div>
                  <button
                    type="button"
                    onClick={() => setIsMuted((value) => !value)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-elevated)]"
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                </div>
                <div className="mt-4 text-sm text-[var(--text-secondary)]">
                  {isMuted ? "Muted for a quieter session." : "Soft ambient audio is available."}
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Session summary</div>
                <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
                  <div className="flex items-center justify-between">
                    <span>Goal</span>
                    <span className="font-medium text-[var(--text-primary)]">{state.goal}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {state.isRunning ? "Running" : state.isCompleted ? "Completed" : "Paused"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Remaining</span>
                    <span className="font-medium text-[var(--text-primary)]">{displayTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showExit ? (
          <div className="mt-6 rounded-[24px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-sm text-[var(--text-secondary)]">
            Focus mode will keep your timer running if you navigate elsewhere inside FOCURA. Exit only when you are ready to return to the dashboard.
          </div>
        ) : null}
      </div>
    </div>
  );
}
