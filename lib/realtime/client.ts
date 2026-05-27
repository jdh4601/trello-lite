"use client";

import PusherClient, { type Channel } from "pusher-js";
import { boardChannel, type RealtimeEventName, type RealtimePayloads } from "./events";

let client: PusherClient | null = null;

export function getRealtimeClient(): PusherClient | null {
  if (client) return client;
  if (typeof window === "undefined") return null;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) return null;

  client = new PusherClient(key, {
    cluster,
    authEndpoint: "/api/pusher/auth",
    forceTLS: true,
  });
  return client;
}

/**
 * Returns the current socket id once connected, or null otherwise.
 * Used to set the `X-Socket-Id` header so the server can echo-exclude us.
 */
export function currentSocketId(): string | null {
  return client?.connection.socket_id ?? null;
}

export function subscribeBoard(boardId: string): Channel | null {
  const c = getRealtimeClient();
  if (!c) return null;
  return c.subscribe(boardChannel(boardId));
}

export function unsubscribeBoard(boardId: string): void {
  client?.unsubscribe(boardChannel(boardId));
}

export type RealtimeHandlers = {
  [E in RealtimeEventName]?: (payload: RealtimePayloads[E]) => void;
};

export function bindHandlers(channel: Channel, handlers: RealtimeHandlers): () => void {
  const bound: Array<[string, (data: unknown) => void]> = [];
  for (const [event, handler] of Object.entries(handlers)) {
    if (!handler) continue;
    const fn = (data: unknown) => handler(data as never);
    channel.bind(event, fn);
    bound.push([event, fn]);
  }
  return () => {
    for (const [event, fn] of bound) channel.unbind(event, fn);
  };
}
