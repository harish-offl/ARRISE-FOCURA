"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  clearAuthCookie,
  clearStoredSession,
  getStoredSession,
  saveStoredSession,
  setAuthCookie,
  type AuthSession,
  type AuthUser,
} from "@/lib/auth-session";

const AuthContext = createContext<{
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: AuthUser, rememberMe?: boolean) => void;
  logout: () => void;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const current = getStoredSession();
    setSession(current);
    setIsLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.isAuthenticated),
      isLoading,
      login: (user: AuthUser, rememberMe = false) => {
        const nextSession: AuthSession = {
          user,
          isAuthenticated: true,
          rememberMe,
          expiresAt: Date.now() + (rememberMe ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 12),
        };

        setSession(nextSession);
        saveStoredSession(nextSession);
        setAuthCookie(nextSession);
      },
      logout: () => {
        setSession(null);
        clearStoredSession();
        clearAuthCookie();
      },
    }),
    [isLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
