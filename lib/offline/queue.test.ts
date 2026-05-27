/**
 * @vitest-environment jsdom
 */
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enqueue, flush, pendingCount } from "./queue";
import { getDB } from "./db";

beforeEach(async () => {
  const db = getDB();
  if (db) await db.pendingOps.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockFetch(impl: (input: RequestInfo, init?: RequestInit) => Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

describe("offline queue", () => {
  it("enqueues and flushes a successful mutation", async () => {
    await enqueue({
      type: "card:update",
      method: "PATCH",
      path: "/api/cards/c1",
      body: { title: "x" },
    });
    expect(await pendingCount()).toBe(1);

    mockFetch(async () => new Response(JSON.stringify({ data: {} }), { status: 200 }));
    const result = await flush();

    expect(result.succeeded).toBe(1);
    expect(await pendingCount()).toBe(0);
  });

  it("drops the op and reports a conflict on 409", async () => {
    await enqueue({
      type: "card:update",
      method: "PATCH",
      path: "/api/cards/c1",
      body: { title: "x" },
    });
    mockFetch(async () => new Response(null, { status: 409 }));

    const result = await flush();
    expect(result.conflicts).toBe(1);
    expect(await pendingCount()).toBe(0);
  });

  it("retries up to MAX_RETRIES on network failure then drops the op", async () => {
    await enqueue({
      type: "card:create",
      method: "POST",
      path: "/api/cards",
      body: {},
    });
    mockFetch(async () => {
      throw new TypeError("Network down");
    });

    // 3 flushes: retry, retry, drop
    await flush();
    expect(await pendingCount()).toBe(1);
    await flush();
    expect(await pendingCount()).toBe(1);
    const last = await flush();
    expect(await pendingCount()).toBe(0);
    expect(last.failed).toBe(1);
  });

  it("preserves insertion order on flush", async () => {
    await enqueue({ type: "card:create", method: "POST", path: "/api/cards", body: { n: 1 } });
    await enqueue({ type: "card:update", method: "PATCH", path: "/api/cards/c2", body: { n: 2 } });
    await enqueue({ type: "card:delete", method: "DELETE", path: "/api/cards/c3" });

    const calls: string[] = [];
    mockFetch(async (input) => {
      calls.push(String(input));
      return new Response(null, { status: 204 });
    });
    await flush();
    expect(calls).toEqual(["/api/cards", "/api/cards/c2", "/api/cards/c3"]);
  });
});
