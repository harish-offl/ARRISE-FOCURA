export type AuthUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type AuthSession = {
  user: AuthUser;
  isAuthenticated: true;
  rememberMe: boolean;
  expiresAt: number;
};

export const AUTH_STORAGE_KEY = "focura-auth-session";
export const AUTH_COOKIE = "focura_session";

export function parseAuthCookie(cookieHeader?: string | null): AuthSession | null {
  if (!cookieHeader) return null;

  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE}=`));

  if (!match) return null;

  try {
    const encoded = decodeURIComponent(match.slice(AUTH_COOKIE.length + 1));
    return JSON.parse(atob(encoded)) as AuthSession;
  } catch {
    return null;
  }
}

export function setAuthCookie(session: AuthSession) {
  if (typeof document === "undefined") return;

  const encoded = btoa(JSON.stringify(session));
  const maxAge = session.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 12;
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(encoded)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    return session.isAuthenticated && session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export function saveStoredSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
