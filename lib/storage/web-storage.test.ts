import { describe, it, expect, beforeEach } from "vitest";
import { readJSON, remove, StorageKeys, writeJSON } from "./web-storage";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => (map.has(key) ? (map.get(key) as string) : null),
    setItem: (key, value) => {
      map.set(key, String(value));
    },
    removeItem: (key) => {
      map.delete(key);
    },
    key: (index) => Array.from(map.keys())[index] ?? null,
  };
}

beforeEach(() => {
  (globalThis as { window?: { localStorage: Storage; sessionStorage: Storage } }).window = {
    localStorage: memoryStorage(),
    sessionStorage: memoryStorage(),
  };
});

describe("web-storage", () => {
  it("returns the fallback when the key is unset", () => {
    expect(readJSON("local", "missing", { count: 0 })).toEqual({ count: 0 });
  });

  it("round-trips JSON values in localStorage", () => {
    writeJSON("local", "ui:test", { ids: ["a", "b"] });
    expect(readJSON<{ ids: string[] }>("local", "ui:test", { ids: [] })).toEqual({
      ids: ["a", "b"],
    });
  });

  it("round-trips in sessionStorage", () => {
    writeJSON("session", StorageKeys.cardDraft("c1"), "hello");
    expect(readJSON("session", StorageKeys.cardDraft("c1"), "")).toBe("hello");
  });

  it("falls back when the stored value is malformed", () => {
    window.localStorage.setItem("ui:bad", "{not json}");
    expect(readJSON("local", "ui:bad", { x: 1 })).toEqual({ x: 1 });
  });

  it("remove() clears a key", () => {
    writeJSON("local", "ui:gone", true);
    remove("local", "ui:gone");
    expect(readJSON("local", "ui:gone", "absent")).toBe("absent");
  });

  it("StorageKeys are board-scoped", () => {
    expect(StorageKeys.collapsedLists("b1")).toBe("ui:collapsed-lists:b1");
    expect(StorageKeys.filters("b1")).toBe("ui:filters:b1");
  });
});
