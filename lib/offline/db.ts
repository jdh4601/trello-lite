"use client";

import Dexie, { type Table } from "dexie";

/**
 * Schema for the offline cache + outgoing mutation queue.
 *
 * `pendingOps` is the workhorse: while the network is down (or a request
 * fails to reach the server) we append the mutation here, then flush them in
 * insertion order once we come back online.
 */
export type PendingOpType = "card:create" | "card:update" | "card:delete";

export type PendingOp = {
  id?: number;
  type: PendingOpType;
  method: "POST" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  createdAt: number;
  retries: number;
};

class FlowboardDB extends Dexie {
  pendingOps!: Table<PendingOp, number>;

  constructor() {
    super("flowboard");
    this.version(1).stores({
      pendingOps: "++id, createdAt",
    });
  }
}

// Lazy singleton so SSR doesn't touch Dexie.
let cached: FlowboardDB | null = null;

export function getDB(): FlowboardDB | null {
  if (typeof window === "undefined") return null;
  if (!cached) cached = new FlowboardDB();
  return cached;
}
