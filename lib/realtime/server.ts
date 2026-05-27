import "server-only";
import Pusher from "pusher";
import { boardChannel, type RealtimeEventName, type RealtimePayloads } from "./events";

let cached: Pusher | null = null;

function getPusher(): Pusher | null {
  if (cached) return cached;
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    // Real-time is optional; missing creds shouldn't break REST mutations.
    return null;
  }
  cached = new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true,
  });
  return cached;
}

/**
 * Broadcast a board event. `socketId` is the originating client's socket so
 * Pusher excludes them — prevents double-application on top of the actor's
 * optimistic update.
 */
export async function broadcastBoard<E extends RealtimeEventName>(
  boardId: string,
  event: E,
  payload: RealtimePayloads[E],
  socketId?: string | null,
): Promise<void> {
  const pusher = getPusher();
  if (!pusher) return;
  try {
    await pusher.trigger(boardChannel(boardId), event, payload, {
      socket_id: socketId ?? undefined,
    });
  } catch (err) {
    // Logging only — never let a missing broker break a successful DB write.
    console.error("[pusher] broadcast failed", { boardId, event, err });
  }
}

export function authorizeBoardChannel(
  channel: string,
  socketId: string,
): { auth: string } | null {
  const pusher = getPusher();
  if (!pusher) return null;
  return pusher.authorizeChannel(socketId, channel);
}

/**
 * Pull the originating socket id from a REST request header.
 * Clients attach `X-Socket-Id` so the server can exclude them from the broadcast.
 */
export function socketIdFromRequest(req: Request): string | null {
  return req.headers.get("x-socket-id");
}
