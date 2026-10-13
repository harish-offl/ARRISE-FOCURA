import { supabase } from "@/lib/supabase";
import type { DashboardSnapshot, FocusModeState, FriendInvite } from "@/lib/focura-types";

export const EMPTY_DASHBOARD: DashboardSnapshot = {
  sessions: [],
  folders: [],
  libraryMaterials: [],
  focusRecords: [],
  isDark: false,
};

function requireSupabase() {
  if (!supabase) {
    throw new Error("Connect Supabase to load or save your FOCURA data.");
  }
  return supabase;
}

function parseSnapshot(value: unknown): DashboardSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY_DASHBOARD;

  const snapshot = value as Partial<DashboardSnapshot>;
  return {
    sessions: Array.isArray(snapshot.sessions) ? snapshot.sessions : [],
    folders: Array.isArray(snapshot.folders) ? snapshot.folders : [],
    libraryMaterials: Array.isArray(snapshot.libraryMaterials) ? snapshot.libraryMaterials : [],
    focusRecords: Array.isArray(snapshot.focusRecords) ? snapshot.focusRecords : [],
    isDark: snapshot.isDark === true,
  };
}

export async function loadDashboard(userId: string): Promise<DashboardSnapshot> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("focura_user_data")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return parseSnapshot(data?.data);
}

export async function saveDashboard(userId: string, snapshot: DashboardSnapshot): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from("focura_user_data").upsert(
    { user_id: userId, data: snapshot, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );

  if (error) throw error;
}

export function subscribeDashboard(
  userId: string,
  onChange: (snapshot: DashboardSnapshot) => void,
) {
  const client = requireSupabase();
  const channel = client
    .channel(`focura-data:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "focura_user_data",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.eventType === "DELETE") {
          onChange(EMPTY_DASHBOARD);
          return;
        }
        onChange(parseSnapshot(payload.new.data));
      },
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}

export async function loadFocusMode(userId: string): Promise<FocusModeState | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("focura_focus_state")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data?.data as FocusModeState | null) ?? null;
}

export async function saveFocusMode(userId: string, state: FocusModeState): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from("focura_focus_state").upsert(
    { user_id: userId, data: state, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );

  if (error) throw error;
}

export function subscribeFocusMode(userId: string, onChange: (state: FocusModeState | null) => void) {
  const client = requireSupabase();
  const channel = client
    .channel(`focura-focus:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "focura_focus_state",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.eventType === "DELETE") {
          onChange(null);
          return;
        }
        onChange(payload.new.data as FocusModeState);
      },
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}

export async function createFriendInvite(
  inviterId: string,
  inviterName: string,
  inviteeEmail: string,
): Promise<FriendInvite> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("focura_friend_invites")
    .insert({
      inviter_id: inviterId,
      inviter_name: inviterName,
      invitee_email: inviteeEmail,
    })
    .select("id, inviter_id, inviter_name, invitee_email, invitee_id, invite_token, status, created_at")
    .single();

  if (error) throw error;
  return data as FriendInvite;
}

export async function loadFriendInvites(userId: string, email: string): Promise<FriendInvite[]> {
  const client = requireSupabase();
  const [sent, received] = await Promise.all([
    client
      .from("focura_friend_invites")
      .select("id, inviter_id, inviter_name, invitee_email, invitee_id, invite_token, status, created_at")
      .eq("inviter_id", userId),
    client
      .from("focura_friend_invites")
      .select("id, inviter_id, inviter_name, invitee_email, invitee_id, invite_token, status, created_at")
      .eq("invitee_email", email.toLowerCase()),
  ]);

  if (sent.error) throw sent.error;
  if (received.error) throw received.error;

  const unique = new Map<string, FriendInvite>();
  for (const invite of [...sent.data, ...received.data]) {
    unique.set(invite.id, invite as FriendInvite);
  }
  return [...unique.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function subscribeFriendInvites(
  userId: string,
  onChange: () => void,
) {
  const client = requireSupabase();
  const channel = client
    .channel(`focura-invites:${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "focura_friend_invites" },
      onChange,
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
