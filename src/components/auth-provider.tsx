"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AuthUser } from "@/lib/auth-session";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, inviteToken?: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? "",
    name: typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : user.email?.split("@")[0] ?? "Student",
    createdAt: user.created_at,
  };
}

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured. Add the project URL and anon key to the environment.");
  return supabase;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;
    const client = supabase;
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ? mapUser(session.user) : null);
    });

    void client.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.error("Unable to restore the Supabase session.", error);
        setUser(null);
      } else {
        setUser(data.session?.user ? mapUser(data.session.user) : null);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: user !== null,
    isLoading,
    isSupabaseConfigured,
    login: async (email, password) => {
      const { error } = await requireSupabase().auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signUp: async (name, email, password, inviteToken) => {
      const { data, error } = await requireSupabase().auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            ...(inviteToken ? { friend_invite_token: inviteToken } : {}),
          },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) throw error;
      return data.session !== null;
    },
    resetPassword: async (email) => {
      const { error } = await requireSupabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      if (error) throw error;
    },
    logout: async () => {
      const { error } = await requireSupabase().auth.signOut();
      if (error) throw error;
    },
  }), [isLoading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
