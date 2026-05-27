"use client";

import { getDB, type PendingOp, type PendingOpType } from "./db";

const MAX_RETRIES = 3;

export type FlushResult = {
  succeeded: number;
  failed: number;
  conflicts: number;
};

export async function enqueue(op: Omit<PendingOp, "id" | "createdAt" | "retries">): Promise<void> {
  const db = getDB();
  if (!db) return;
  await db.pendingOps.add({ ...op, createdAt: Date.now(), retries: 0 });
}

export async function pendingCount(): Promise<number> {
  const db = getDB();
  if (!db) return 0;
  return db.pendingOps.count();
}

function isNetworkError(err: unknown): boolean {
  // fetch throws TypeError on offline / DNS failures; treat any thrown
  // value as a transient network failure so we'll retry it.
  return err instanceof TypeError || err instanceof Error;
}

/**
 * Replay queued mutations in insertion order against the live network. On
 * network failure we keep the op (bumping retries). On HTTP failures we drop
 * the op — 409 returns a "conflict" so the caller can re-sync the board.
 */
export async function flush(): Promise<FlushResult> {
  const db = getDB();
  const result: FlushResult = { succeeded: 0, failed: 0, conflicts: 0 };
  if (!db) return result;

  const ops = await db.pendingOps.orderBy("createdAt").toArray();
  for (const op of ops) {
    try {
      const res = await fetch(op.path, {
        method: op.method,
        headers: { "Content-Type": "application/json" },
        body: op.body === undefined ? undefined : JSON.stringify(op.body),
      });

      if (res.ok || res.status === 204) {
        await db.pendingOps.delete(op.id!);
        result.succeeded += 1;
        continue;
      }

      if (res.status === 409) {
        await db.pendingOps.delete(op.id!);
        result.conflicts += 1;
        continue;
      }

      // Permanent client errors — drop the op so the queue can drain.
      if (res.status >= 400 && res.status < 500) {
        await db.pendingOps.delete(op.id!);
        result.failed += 1;
        continue;
      }

      // Transient (5xx) — retry up to MAX_RETRIES.
      await bumpOrDrop(op, result);
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      await bumpOrDrop(op, result);
      // Network is still down — stop draining; we'll be called again on
      // the next `online` event.
      break;
    }
  }
  return result;
}

async function bumpOrDrop(op: PendingOp, result: FlushResult) {
  const db = getDB();
  if (!db) return;
  const retries = op.retries + 1;
  if (retries >= MAX_RETRIES) {
    await db.pendingOps.delete(op.id!);
    result.failed += 1;
    return;
  }
  await db.pendingOps.update(op.id!, { retries });
}

export function describeOp(type: PendingOpType): string {
  switch (type) {
    case "card:create":
      return "카드 추가";
    case "card:update":
      return "카드 수정";
    case "card:delete":
      return "카드 삭제";
  }
}
