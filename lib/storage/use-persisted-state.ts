"use client";

import { useEffect, useState } from "react";
import { readJSON, writeJSON } from "./web-storage";

/**
 * useState backed by localStorage / sessionStorage. SSR-safe: starts with the
 * provided fallback on the server, hydrates from storage in an effect, then
 * mirrors every change back out.
 */
export function usePersistedState<T>(
  area: "local" | "session",
  key: string,
  fallback: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(readJSON(area, key, fallback));
    setHydrated(true);
    // We deliberately read once on mount per (area, key); fallback identity
    // changes are ignored.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, key]);

  useEffect(() => {
    if (!hydrated) return;
    writeJSON(area, key, value);
  }, [area, key, value, hydrated]);

  return [value, setValue];
}
