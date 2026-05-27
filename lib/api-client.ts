/**
 * Tiny fetch wrapper that throws on non-2xx and returns parsed JSON `.data`.
 * Server responses follow the shape: `{ data: ... }` or `{ error: { code, message } }`.
 *
 * On network failure (offline / DNS) the wrapper enqueues card mutations
 * into IndexedDB so they can be flushed on reconnect (TRE-11). Non-card
 * mutations and reads still surface the error to the caller.
 */

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export class OfflineQueuedError extends Error {
  constructor() {
    super("OFFLINE_QUEUED");
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
type FetchOptions = Omit<RequestInit, "body"> & { body?: unknown };

async function realtimeHeader(): Promise<Record<string, string>> {
  if (typeof window === "undefined") return {};
  try {
    const { currentSocketId } = await import("@/lib/realtime/client");
    const id = currentSocketId();
    return id ? { "X-Socket-Id": id } : {};
  } catch {
    return {};
  }
}

function isCardMutation(path: string, method: Method | undefined): boolean {
  if (!method || method === "GET") return false;
  return /^\/api\/cards(\/|$)/.test(path);
}

function cardOpType(path: string, method: Method): "card:create" | "card:update" | "card:delete" {
  if (method === "DELETE") return "card:delete";
  if (method === "POST") return "card:create";
  return "card:update";
}

export async function api<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const method = (rest.method as Method | undefined) ?? "GET";
  const rtHeaders = await realtimeHeader();

  let res: Response;
  try {
    res = await fetch(path, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...rtHeaders,
        ...(headers ?? {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    // Network unreachable — queue card mutations so they replay on reconnect.
    if (typeof window !== "undefined" && isCardMutation(path, method)) {
      const { enqueue } = await import("@/lib/offline/queue");
      await enqueue({
        type: cardOpType(path, method),
        method: method as "POST" | "PATCH" | "DELETE",
        path,
        body,
      });
      throw new OfflineQueuedError();
    }
    throw err;
  }

  if (res.status === 204) return undefined as T;

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const code = payload?.error?.code ?? "UNKNOWN";
    const message = payload?.error?.message ?? "요청 처리 중 오류가 발생했습니다.";
    throw new ApiClientError(code, message, res.status);
  }
  return payload?.data as T;
}
