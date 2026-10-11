export const STORAGE_KEYS = {
  user: "focura-user",
  theme: "focura-theme",
  timer: "focura-timer",
  sessions: "focura-sessions",
  goals: "focura-goals",
} as const;

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function clearJson(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}
