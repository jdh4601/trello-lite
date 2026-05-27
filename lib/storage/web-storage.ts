/**
 * Typed wrappers around localStorage / sessionStorage with SSR guards and
 * JSON serialization. Throws are swallowed (private mode, quota, etc.).
 */

type Area = "local" | "session";

function pickArea(area: Area): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return area === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readJSON<T>(area: Area, key: string, fallback: T): T {
  const storage = pickArea(area);
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(area: Area, key: string, value: T): void {
  const storage = pickArea(area);
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / disabled — silently ignore */
  }
}

export function remove(area: Area, key: string): void {
  const storage = pickArea(area);
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const StorageKeys = {
  collapsedLists: (boardId: string) => `ui:collapsed-lists:${boardId}`,
  filters: (boardId: string) => `ui:filters:${boardId}`,
  theme: "ui:theme",
  cardDraft: (cardId: string) => `draft:card:${cardId}`,
} as const;
