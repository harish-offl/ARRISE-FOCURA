"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  FilePlus2,
  Flame,
  Folder,
  FolderOpen,
  Focus,
  Home,
  Library,
  Link2,
  Moon,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Sun,
  Target,
  Trash2,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { loadMaterialFile, removeMaterialFile, saveMaterialFile } from "@/lib/material-files";
import { createFriendInvite, EMPTY_DASHBOARD, loadDashboard, loadFriendInvites, saveDashboard, subscribeDashboard, subscribeFriendInvites } from "@/lib/focura-data";
import { useTheme } from "@/components/theme-provider";
import type { FocusRecord, FriendInvite, LibraryMaterial, MaterialFolder, StudySession } from "@/lib/focura-types";

export default function FocuraApp() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [focusRecords, setFocusRecords] = useState<FocusRecord[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [friendInvites, setFriendInvites] = useState<FriendInvite[]>([]);
  const [folders, setFolders] = useState<MaterialFolder[]>([]);
  const [libraryMaterials, setLibraryMaterials] = useState<LibraryMaterial[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loadedDataKey, setLoadedDataKey] = useState<string | null>(null);
  const [storageError, setStorageError] = useState("");
  const [materialError, setMaterialError] = useState("");
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [sessionDraft, setSessionDraft] = useState("");
  const [sessionMinutes, setSessionMinutes] = useState(25);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [friendEmail, setFriendEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteNotice, setInviteNotice] = useState("");
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [folderNameDraft, setFolderNameDraft] = useState("");
  const [libraryTitleDraft, setLibraryTitleDraft] = useState("");
  const [libraryUrlDraft, setLibraryUrlDraft] = useState("");
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showLibraryMaterialModal, setShowLibraryMaterialModal] = useState(false);
  const [materialSearch, setMaterialSearch] = useState("");
  const skipRemoteSave = useRef(false);
  const accountId = user?.id ?? null;

  const focusScore = useMemo(() => {
    if (focusRecords.length === 0) return 0;
    const completionRate = (sessions.filter((session) => session.status === "Completed").length / Math.max(sessions.length, 1)) * 100;
    return Math.round(Math.min(100, completionRate));
  }, [focusRecords.length, sessions]);

  const weeklyData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const dayKey = date.toLocaleDateString("en-CA");
      return {
        day: date.toLocaleDateString(undefined, { weekday: "short" }),
        minutes: focusRecords
          .filter((record) => new Date(record.completedAt).toLocaleDateString("en-CA") === dayKey)
          .reduce((total, record) => total + record.minutes, 0),
      };
    });
  }, [focusRecords]);

  const todayFocusMinutes = useMemo(() => {
    const todayKey = new Date().toLocaleDateString("en-CA");
    return focusRecords
      .filter((record) => new Date(record.completedAt).toLocaleDateString("en-CA") === todayKey)
      .reduce((total, record) => total + record.minutes, 0);
  }, [focusRecords]);

  const completedToday = useMemo(() => {
    const todayKey = new Date().toLocaleDateString("en-CA");
    return sessions.filter((session) => session.status === "Completed" && session.completedAt &&
      new Date(session.completedAt).toLocaleDateString("en-CA") === todayKey).length;
  }, [sessions]);

  const todaySessionCount = useMemo(() => {
    const todayKey = new Date().toLocaleDateString("en-CA");
    return sessions.filter((session) => !session.createdAt ||
      new Date(session.createdAt).toLocaleDateString("en-CA") === todayKey).length;
  }, [sessions]);

  const currentStreak = useMemo(() => {
    const focusDays = new Set(focusRecords.map((record) => new Date(record.completedAt).toLocaleDateString("en-CA")));
    let streak = 0;
    const day = new Date();
    if (!focusDays.has(day.toLocaleDateString("en-CA"))) day.setDate(day.getDate() - 1);
    while (focusDays.has(day.toLocaleDateString("en-CA"))) {
      streak += 1;
      day.setDate(day.getDate() - 1);
    }
    return streak;
  }, [focusRecords]);

  const achievements = useMemo(() => {
    const earned: Array<{ icon: typeof Trophy; label: string }> = [];
    if (focusRecords.length > 0) earned.push({ icon: Focus, label: "First focus block" });
    if (focusRecords.length >= 5) earned.push({ icon: Flame, label: "Five sessions focused" });
    if (sessions.some((session) => session.status === "Completed")) earned.push({ icon: CheckCircle2, label: "Plan completed" });
    return earned;
  }, [focusRecords.length, sessions]);

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

  const weekFocusMinutes = useMemo(
    () => weeklyData.reduce((total, day) => total + day.minutes, 0),
    [weeklyData],
  );

  useEffect(() => {
    if (!accountId || !user?.email) return;

    let active = true;
    let unsubscribeDashboard = () => {};
    let unsubscribeInvites = () => {};

    void (async () => {
      try {
        const snapshot = await loadDashboard(accountId);
        if (!active) return;

        skipRemoteSave.current = true;
        setSessions(snapshot.sessions);
        setFolders(snapshot.folders);
        setLibraryMaterials(snapshot.libraryMaterials);
        setFocusRecords(snapshot.focusRecords);
        if (snapshot.isDark !== undefined && snapshot.isDark !== (theme === "dark")) {
          setTheme(snapshot.isDark ? "dark" : "light");
        }
        setLoadedDataKey(accountId);
        setStorageError("");
        unsubscribeDashboard = subscribeDashboard(accountId, (nextSnapshot) => {
          if (!active) return;
          skipRemoteSave.current = true;
          setSessions(nextSnapshot.sessions);
          setFolders(nextSnapshot.folders);
          setLibraryMaterials(nextSnapshot.libraryMaterials);
          setFocusRecords(nextSnapshot.focusRecords);
          if (nextSnapshot.isDark !== undefined && nextSnapshot.isDark !== (theme === "dark")) {
            setTheme(nextSnapshot.isDark ? "dark" : "light");
          }
        });

        const refreshInvites = async () => {
          try {
            const invites = await loadFriendInvites(accountId, user.email);
            if (active) setFriendInvites(invites);
          } catch (error) {
            console.error("Unable to load FOCURA friend invitations.", error);
            if (active) setStorageError("Friend invitations could not be loaded. Refresh the page to retry.");
          }
        };
        await refreshInvites();
        if (active) unsubscribeInvites = subscribeFriendInvites(accountId, () => void refreshInvites());
      } catch (error) {
        console.error("Unable to load FOCURA account data.", error);
        if (active) setStorageError("Your account data could not be loaded from Supabase. Check the database setup and try again.");
      }
    })();

    return () => {
      active = false;
      unsubscribeDashboard();
      unsubscribeInvites();
    };
  }, [accountId, user?.email]);

  useEffect(() => {
    if (!accountId || loadedDataKey !== accountId) return;
    if (skipRemoteSave.current) {
      skipRemoteSave.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveDashboard(accountId, { sessions, folders, libraryMaterials, focusRecords, isDark: theme === "dark" })
        .then(() => setStorageError(""))
        .catch((error: unknown) => {
          console.error("Unable to save FOCURA data to Supabase.", error);
          setStorageError("Your changes could not be synced. Check your connection and Supabase setup.");
        });
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [accountId, focusRecords, folders, theme, libraryMaterials, loadedDataKey, sessions]);

  useEffect(() => {
    if (!isRunning || !endTime) return;

    const tick = () => {
      const remainingSeconds = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0) {
        setFocusRecords((current) => [
          { id: Date.now(), minutes: selectedMinutes, completedAt: new Date().toISOString() },
          ...current,
        ]);
        if (activeSessionId !== null) {
          setSessions((current) => current.map((session) =>
            session.id === activeSessionId
              ? { ...session, status: "Completed", completedAt: new Date().toISOString() }
              : session,
          ));
        }
        setActiveSessionId(null);
        setIsRunning(false);
        setEndTime(null);
        setTimeLeft(0);
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [activeSessionId, endTime, isRunning, selectedMinutes]);

  const startFocus = (minutes = selectedMinutes, sessionId: number | null = null) => {
    if (isRunning) return;

    const nextTotal = sessionId === null && timeLeft > 0 ? timeLeft : minutes * 60;
    setSelectedMinutes(minutes);
    setTimeLeft(nextTotal);
    setActiveSessionId(sessionId);
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
    setActiveSessionId(null);
    setTimeLeft(selectedMinutes * 60);
  };

  const handleDurationSelect = (minutes: number) => {
    if (isRunning) return;
    setSelectedMinutes(minutes);
    setTimeLeft(minutes * 60);
    setEndTime(null);
  };

  const deleteSession = (sessionId: number) => {
    if (activeSessionId === sessionId) resetFocus();
    setSessions((current) => current.filter((session) => session.id !== sessionId));
  };

  const startPlannedSession = (session: StudySession) => {
    startFocus(session.minutes, session.id);
    document.getElementById("focus-timer")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const markSessionComplete = (session: StudySession) => {
    setSessions((current) => current.map((item) =>
      item.id === session.id
        ? {
            ...item,
            status: item.status === "Completed" ? "Planned" : "Completed",
            completedAt: item.status === "Completed" ? undefined : new Date().toISOString(),
          }
        : item,
    ));
  };

  const goToFocus = () => {
    document.getElementById("focus-timer")?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (!isRunning) startFocus();
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/auth");
    } catch (error) {
      console.error("Unable to sign out of FOCURA.", error);
      setStorageError("You could not be signed out. Please try again.");
    }
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

    const item: StudySession = {
      id: editingSessionId ?? Date.now(),
      title: trimmedTitle,
      minutes: sessionMinutes,
      status: "Planned",
      createdAt: editingSessionId === null
        ? new Date().toISOString()
        : sessions.find((session) => session.id === editingSessionId)?.createdAt ?? new Date().toISOString(),
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

  const handleInviteFriend = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedEmail = friendEmail.trim();
    if (!trimmedEmail || !user) return;

    setInviteError("");
    setIsCreatingInvite(true);
    try {
      const invite = await createFriendInvite(user.id, user.name, trimmedEmail.toLowerCase());
      const parameters = new URLSearchParams({
        invite: invite.invite_token,
        from: user.name,
        email: trimmedEmail,
      });
      setInviteLink(`${window.location.origin}/auth?${parameters.toString()}`);
      setInviteNotice("Invitation saved. Copy the link to share it.");
      setFriendInvites((current) => [invite, ...current.filter((item) => item.id !== invite.id)]);
    } catch (error) {
      console.error("Unable to create the FOCURA friend invitation.", error);
      setInviteError("Invitation could not be saved. Check your connection and Supabase setup, then try again.");
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteNotice("Invite link copied. Send it to your friend to sign up.");
      setInviteError("");
    } catch (error) {
      console.error("Unable to copy the FOCURA invitation link.", error);
      setInviteError("The link could not be copied. Select and copy it from the field below.");
    }
  };

  const handleCreateFolder = (event: FormEvent) => {
    event.preventDefault();
    const name = folderNameDraft.trim();
    if (!name) return;

    const folder: MaterialFolder = {
      id: `folder-${Date.now()}`,
      name,
      color: ["#8b83e6", "#5ca5dc", "#e3a16b", "#70a78a", "#d1778f"][folders.length % 5],
    };
    setFolders((current) => [...current, folder]);
    setSelectedFolderId(folder.id);
    setFolderNameDraft("");
    setShowFolderModal(false);
  };

  const handleAddLibraryLink = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFolderId) return;

    const title = libraryTitleDraft.trim();
    const url = libraryUrlDraft.trim();
    try {
      const parsedUrl = new URL(url);
      if (!title || !["http:", "https:"].includes(parsedUrl.protocol)) {
        setMaterialError("Enter a title and a valid http or https link.");
        return;
      }
    } catch {
      setMaterialError("Enter a valid http or https link.");
      return;
    }

    setLibraryMaterials((current) => [
      { id: Date.now(), folderId: selectedFolderId, title, url, kind: "link", addedAt: new Date().toISOString() },
      ...current,
    ]);
    setLibraryTitleDraft("");
    setLibraryUrlDraft("");
    setMaterialError("");
    setShowLibraryMaterialModal(false);
  };

  const handleUploadLibraryMaterial = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFolderId) return;

    const form = event.currentTarget;
    const input = form.elements.namedItem("library-file");
    const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined;
    const title = libraryTitleDraft.trim() || file?.name || "";

    if (!file) {
      setMaterialError("Choose a file to upload.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMaterialError("Files must be 10 MB or smaller.");
      return;
    }

    const material: LibraryMaterial = {
      id: Date.now(),
      folderId: selectedFolderId,
      title,
      kind: "file",
      fileName: file.name,
      fileType: file.type,
      addedAt: new Date().toISOString(),
    };

    try {
      if (!user) throw new Error("Sign in before uploading a study material.");
      const storagePath = await saveMaterialFile(user.id, file);
      setLibraryMaterials((current) => [{ ...material, storagePath }, ...current]);
      setLibraryTitleDraft("");
      setMaterialError("");
      setShowLibraryMaterialModal(false);
      form.reset();
    } catch (error) {
      console.error("Unable to save uploaded study material.", error);
      setMaterialError("Could not upload the file to your account. Check your connection and storage setup, then try again.");
    }
  };

  const handleOpenLibraryMaterial = async (material: LibraryMaterial) => {
    if (material.kind === "link" && material.url) {
      window.open(material.url, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      if (!material.storagePath) throw new Error("This upload is missing its cloud storage path.");
      const file = await loadMaterialFile(material.storagePath);

      const objectUrl = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = material.fileName ?? material.title;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
      setMaterialError("");
    } catch (error) {
      console.error("Unable to open uploaded study material.", error);
      setMaterialError("Could not open this file. Try again.");
    }
  };

  const handleDeleteLibraryMaterial = async (material: LibraryMaterial) => {
    if (material.kind === "file") {
      try {
        if (!material.storagePath) throw new Error("This upload is missing its cloud storage path.");
        await removeMaterialFile(material.storagePath);
      } catch (error) {
        console.error("Unable to delete uploaded study material.", error);
        setMaterialError("Could not remove this file. Try again.");
        return;
      }
    }

    setLibraryMaterials((current) => current.filter((item) => item.id !== material.id));
    setMaterialError("");
  };

  const visibleMaterials = libraryMaterials.filter((material) => {
    const matchesFolder = selectedFolderId ? material.folderId === selectedFolderId : true;
    const matchesSearch = material.title.toLowerCase().includes(materialSearch.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] transition-colors duration-200 lg:pl-64">
        {showFolderModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold tracking-tight">Create folder</h3>
                <button type="button" onClick={() => setShowFolderModal(false)} className="text-sm text-[var(--text-secondary)]">Close</button>
              </div>
              <form onSubmit={handleCreateFolder} className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Folder name</span>
                  <input
                    autoFocus
                    value={folderNameDraft}
                    onChange={(event) => setFolderNameDraft(event.target.value)}
                    placeholder="e.g. Biology revision"
                    required
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-3 text-sm outline-none"
                  />
                </label>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="secondary" onClick={() => setShowFolderModal(false)}>Cancel</Button>
                  <Button type="submit">Create folder</Button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {showLibraryMaterialModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold tracking-tight">Add study material</h3>
                <button type="button" onClick={() => setShowLibraryMaterialModal(false)} className="text-sm text-[var(--text-secondary)]">Close</button>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Add a web link or upload a file to “{folders.find((folder) => folder.id === selectedFolderId)?.name ?? "your folder"}”.
              </p>
              <form onSubmit={handleAddLibraryLink} className="mt-5 space-y-3">
                <h4 className="font-medium">Add a link</h4>
                <input
                  value={libraryTitleDraft}
                  onChange={(event) => setLibraryTitleDraft(event.target.value)}
                  placeholder="Material title"
                  required
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-3 text-sm outline-none"
                />
                <input
                  type="url"
                  value={libraryUrlDraft}
                  onChange={(event) => setLibraryUrlDraft(event.target.value)}
                  placeholder="https://..."
                  required
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-3 text-sm outline-none"
                />
                <Button type="submit" className="w-full">Add link</Button>
              </form>
              <div className="my-5 border-t border-[var(--border)]" />
              <form onSubmit={handleUploadLibraryMaterial} className="space-y-3">
                <h4 className="font-medium">Upload a file</h4>
                <input
                  value={libraryTitleDraft}
                  onChange={(event) => setLibraryTitleDraft(event.target.value)}
                  placeholder="Optional display title"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-3 text-sm outline-none"
                />
                <input
                  name="library-file"
                  type="file"
                  required
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-3 text-sm"
                />
                <p className="text-xs text-[var(--text-secondary)]">Files up to 10 MB are saved in this browser only.</p>
                <Button type="submit" variant="secondary" className="w-full">Upload to folder</Button>
              </form>
              {materialError ? <p role="alert" className="mt-3 text-sm text-red-600">{materialError}</p> : null}
            </div>
          </div>
        ) : null}

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
                <button type="button" onClick={() => {
                  setShowInviteModal(false);
                  setInviteLink("");
                  setInviteError("");
                  setInviteNotice("");
                  setFriendEmail("");
                }} className="text-sm text-[var(--text-secondary)]">Close</button>
              </div>

              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                Create a personal signup link you can send through email, messaging apps, or any other channel.
              </p>
              {!inviteLink ? <form onSubmit={handleInviteFriend} className="mt-5 space-y-4">
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
                  <Button type="submit" disabled={isCreatingInvite}>{isCreatingInvite ? "Saving invite..." : "Create invite link"}</Button>
                </div>
                {inviteError ? <p role="alert" className="text-sm text-red-600">{inviteError}</p> : null}
              </form> : (
                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Share this signup link</span>
                    <input readOnly value={inviteLink} onFocus={(event) => event.currentTarget.select()} className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none" />
                  </label>
                  {inviteNotice ? <p role="status" className="text-sm text-emerald-700">{inviteNotice}</p> : null}
                  {inviteError ? <p role="alert" className="text-sm text-red-600">{inviteError}</p> : null}
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={() => {
                      setInviteLink("");
                      setInviteNotice("");
                      setFriendEmail("");
                    }}>Create another</Button>
                    <Button type="button" onClick={() => void copyInviteLink()}>Copy link</Button>
                  </div>
                  <p className="text-xs leading-5 text-[var(--text-secondary)]">
                    Your invitation and its status are saved to your account and update when your friend accepts.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[var(--border)] bg-[var(--surface-elevated)] px-5 py-6 lg:flex">
          <Link href="/navigation" className="mb-8 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-lg font-bold text-white">F</span>
            <span>
              <span className="block text-lg font-semibold tracking-tight">FOCURA</span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Own Your Focus</span>
            </span>
          </Link>

          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">Workspace</p>
          <nav className="space-y-1">
            <Link href="/navigation" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface)] hover:text-[var(--text-primary)]">
              <ArrowRight size={17} />
              Navigation
            </Link>
            {[
              { label: "Dashboard", href: "#dashboard", icon: Home },
              { label: "Study sessions", href: "#sessions", icon: CheckCircle2 },
              { label: "Materials", href: "#materials", icon: Library },
              { label: "Analytics", href: "#analytics", icon: BarChart3 },
              { label: "Study circle", href: "#friends", icon: Users },
            ].map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
              >
                <Icon size={17} />
                {label}
              </a>
            ))}
          </nav>

          <div className="mt-8 flex items-center justify-between px-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">Folders</p>
            <button
              type="button"
              onClick={() => setShowFolderModal(true)}
              aria-label="Create folder"
              className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
            >
              <Plus size={16} />
            </button>
          </div>
          <nav className="mt-2 space-y-1">
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => {
                  setSelectedFolderId(folder.id);
                  document.getElementById("materials")?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  selectedFolderId === folder.id
                    ? "bg-[var(--surface)] font-medium text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Folder size={17} fill={folder.color} color={folder.color} />
                <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                <span className="text-xs">{libraryMaterials.filter((item) => item.folderId === folder.id).length}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-sm font-medium">Keep your study resources close</p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Organize notes and useful links into folders for quick access.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedFolderId(folders[0]?.id ?? null);
                setShowFolderModal(folders.length === 0);
                if (folders.length > 0) setShowLibraryMaterialModal(true);
              }}
              className="mt-3 text-xs font-semibold text-[var(--brand-primary)] hover:underline"
            >
              Add study material
            </button>
          </div>
        </aside>

        <div className="flex gap-2 overflow-x-auto border-b border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2 lg:hidden">
          {[
            { label: "More", href: "/navigation", icon: ArrowRight },
            { label: "Home", href: "#dashboard", icon: Home },
            { label: "Sessions", href: "#sessions", icon: CheckCircle2 },
            { label: "Materials", href: "#materials", icon: Library },
            { label: "Friends", href: "#friends", icon: Users },
          ].map(({ label, href, icon: Icon }) => (
            <a key={label} href={href} className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">
              <Icon size={14} /> {label}
            </a>
          ))}
        </div>

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
              <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === "dark" ? <Sun size={18} className="text-[var(--brand-primary)]" /> : <Moon size={18} />}
              </Button>
              <span className="hidden max-w-32 truncate text-sm text-[var(--text-secondary)] sm:block">{user?.name ?? "Student"}</span>
              <Button variant="secondary" onClick={handleLogout}>Log out</Button>
              <Button onClick={goToFocus}>{isRunning ? "Resume Focus" : "Start Focus"}</Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          <div className={`mb-6 rounded-2xl border p-4 text-sm ${loadedDataKey === accountId && accountId ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
            {loadedDataKey === accountId && accountId
              ? "Connected. Your plans, focus history, folders, and study links sync to your account and update in real time across signed-in devices."
              : "Connecting to your Supabase account to load live study data..."}
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
                  {sessions.filter((session) => session.status === "Planned").length} plans today
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button className="gap-2" onClick={goToFocus}>
                  <Play size={16} /> Start timer
                </Button>
                <Button variant="secondary" className="gap-2" onClick={() => setShowSessionModal(true)}>
                  <Target size={16} /> Set goals
                </Button>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  { icon: Clock3, label: "Focus time today", value: `${Math.floor(todayFocusMinutes / 60)}h ${String(todayFocusMinutes % 60).padStart(2, "0")}m` },
                  { icon: CheckCircle2, label: "Completed today", value: `${completedToday} / ${todaySessionCount}` },
                  { icon: Zap, label: "Streak", value: `${currentStreak} ${currentStreak === 1 ? "day" : "days"}` },
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
              id="focus-timer"
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
                  <Button className="flex-1" onClick={isRunning ? pauseFocus : () => startFocus()}>
                    {isRunning ? "Pause" : "Start focus"}
                  </Button>
                  <Button variant="secondary" className="flex-1" onClick={resetFocus}>
                    Reset
                  </Button>
                </div>
              </div>
            </motion.aside>
          </section>

          <section id="materials" className="mt-8 scroll-mt-24 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Study library</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">My materials</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Keep notes, files, and useful links organized by subject.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" className="gap-2" onClick={() => setShowFolderModal(true)}>
                  <FolderOpen size={16} /> New folder
                </Button>
                <Button className="gap-2" onClick={() => {
                  if (!selectedFolderId && folders.length > 0) setSelectedFolderId(folders[0].id);
                  if (folders.length === 0) setShowFolderModal(true);
                  else setShowLibraryMaterialModal(true);
                }}>
                  <FilePlus2 size={16} /> Add material
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {folders.map((folder) => {
                const folderMaterials = libraryMaterials.filter((material) => material.folderId === folder.id);
                const selected = selectedFolderId === folder.id;
                return (
                  <button
                    key={folder.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedFolderId(selected ? null : folder.id)}
                    className={`relative overflow-hidden rounded-2xl border p-4 text-left ${
                      selected ? "border-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/15" : "border-[var(--border)]"
                    }`}
                    style={{ backgroundColor: `${folder.color}10` }}
                  >
                    <div className="flex h-28 items-center justify-center" aria-hidden="true">
                      <Image
                        src="/glossy-golden-folder-icon.png"
                        alt=""
                        width={160}
                        height={112}
                        className="h-28 w-40 object-contain"
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="truncate font-medium">{folder.name}</span>
                      <span className="rounded-full bg-[var(--surface-elevated)]/80 px-2.5 py-1 text-xs text-[var(--text-secondary)]">
                        {folderMaterials.length} {folderMaterials.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                    <span className="mt-1 block text-xs text-[var(--text-secondary)]">
                      {selected ? "Selected" : "Click to view materials"}
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setShowFolderModal(true)}
                className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-center text-[var(--text-secondary)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)]"><Plus size={18} /></span>
                <span className="mt-3 text-sm font-medium">Create a folder</span>
              </button>
            </div>

            <div className="mt-8 border-t border-[var(--border)] pt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedFolderId ? folders.find((folder) => folder.id === selectedFolderId)?.name ?? "Folder materials" : "All materials"}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">Select a folder above to filter your study materials.</p>
                </div>
                <label className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2">
                  <Search size={15} className="text-[var(--text-secondary)]" />
                  <input
                    value={materialSearch}
                    onChange={(event) => setMaterialSearch(event.target.value)}
                    placeholder="Search materials"
                    className="w-40 bg-transparent text-sm outline-none placeholder:text-[var(--text-secondary)]"
                  />
                </label>
              </div>
              {materialError ? <p role="alert" className="mt-3 text-sm text-red-600">{materialError}</p> : null}
              {visibleMaterials.length > 0 ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {visibleMaterials.map((material) => (
                    <div key={material.id} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                        {material.kind === "link" ? <Link2 size={18} /> : <BookOpen size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{material.title}</div>
                        <div className="truncate text-xs text-[var(--text-secondary)]">
                          {material.kind === "link" ? material.url : material.fileName}
                        </div>
                      </div>
                      <button type="button" onClick={() => void handleOpenLibraryMaterial(material)} className="shrink-0 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface)]">
                        {material.kind === "link" ? "Open" : "Download"}
                      </button>
                      <button type="button" onClick={() => void handleDeleteLibraryMaterial(material)} aria-label={`Remove ${material.title}`} className="shrink-0 rounded-full p-2 text-[var(--text-secondary)] hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-elevated)] p-6 text-sm text-[var(--text-secondary)]">
                  {materialSearch ? "No materials match your search." : "No study materials here yet. Add a link or upload a file to get started."}
                </div>
              )}
            </div>
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
                    <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]">
                          <Target size={18} />
                        </div>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-[var(--text-secondary)]">{task.minutes} min focus · {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "Today"}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => markSessionComplete(task)}
                          className="rounded-full border border-[var(--border)] px-2 py-1 text-xs font-medium text-[var(--text-primary)]"
                        >
                          {task.status === "Completed" ? "Undo" : "Complete"}
                        </button>
                        {task.status === "Planned" ? (
                          <button
                            type="button"
                            onClick={() => startPlannedSession(task)}
                            className="rounded-full border border-[var(--brand-primary)] px-2 py-1 text-xs font-medium text-[var(--brand-primary)]"
                          >
                            Start
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => openSessionModal(task)}
                          className="rounded-full border border-[var(--border)] px-2 py-1 text-xs font-medium text-[var(--text-primary)]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSession(task.id)}
                          aria-label={`Delete ${task.title}`}
                          className="rounded-full p-1.5 text-[var(--text-secondary)] hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={15} />
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
                  <span>Distraction block list</span>
                  <span className="font-medium text-[var(--text-primary)]">Not configured</span>
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
                  {Math.floor(weekFocusMinutes / 60)}h {String(weekFocusMinutes % 60).padStart(2, "0")}m this week
                </div>
              </div>

              <div className="mt-6 h-64 w-full">
                {focusRecords.length > 0 ? (
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
                {friendInvites.length > 0 ? (
                  friendInvites.map((invite) => {
                    const sentByMe = invite.inviter_id === accountId;
                    return (
                      <div key={invite.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 text-sm font-semibold text-[var(--brand-primary)]">
                            {(sentByMe ? invite.invitee_email : invite.inviter_name).slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {sentByMe ? invite.invitee_email : invite.inviter_name}
                            </div>
                            <div className="text-sm text-[var(--text-secondary)]">
                              {sentByMe ? "Sent invite" : "Invited you"} · {new Date(invite.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${invite.status === "accepted" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                          {invite.status === "accepted" ? "Connected" : "Pending"}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-[var(--text-secondary)]">
                    No friends or invitations yet. Invite a friend to connect your study circle.
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
                  <div className="mt-2 text-sm text-[var(--text-secondary)]">Earned from your activity</div>
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
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                  {focusRecords.length === 0
                    ? "Complete your first focus block to unlock a milestone."
                    : `${focusRecords.length} focus ${focusRecords.length === 1 ? "session" : "sessions"} completed. Keep building your streak.`}
                </h3>
              </div>
              <Button className="gap-2" onClick={goToFocus}>
                Continue <ArrowRight size={16} />
              </Button>
            </div>
          </section>
        </main>
    </div>
  );
}
