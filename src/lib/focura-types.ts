export type StudySession = {
  id: number;
  title: string;
  minutes: number;
  status: "Planned" | "Completed";
  createdAt?: string;
  completedAt?: string;
};

export type FocusRecord = {
  id: number;
  minutes: number;
  completedAt: string;
};

export type MaterialFolder = {
  id: string;
  name: string;
  color: string;
};

export type LibraryMaterial = {
  id: number;
  folderId: string;
  title: string;
  kind: "link" | "file";
  url?: string;
  fileName?: string;
  fileType?: string;
  storagePath?: string;
  addedAt: string;
};

export type DashboardSnapshot = {
  sessions: StudySession[];
  folders: MaterialFolder[];
  libraryMaterials: LibraryMaterial[];
  focusRecords: FocusRecord[];
  isDark: boolean;
};

export type FocusModeState = {
  selectedMinutes: number;
  remainingSeconds: number;
  isRunning: boolean;
  isCompleted: boolean;
  endTime: number | null;
  startedAt: number | null;
  taskTitle: string;
  goal: string;
};

export type FriendInvite = {
  id: string;
  inviter_id: string;
  inviter_name: string;
  invitee_email: string;
  invitee_id: string | null;
  invite_token: string;
  status: "pending" | "accepted";
  created_at: string;
};
