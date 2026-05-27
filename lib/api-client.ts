/**
 * Tiny fetch wrapper that throws on non-2xx and returns parsed JSON `.data`.
 * Server responses follow the shape: `{ data: ... }` or `{ error: { code, message } }`.
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

type FetchOptions = Omit<RequestInit, "body"> & { body?: unknown };

/**
 * Attach the originating socket id on every mutation so the realtime
 * broadcaster can exclude us — prevents double-application of our own
 * optimistic update.
 */
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

export async function api<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const rtHeaders = await realtimeHeader();
  const res = await fetch(path, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...rtHeaders,
      ...(headers ?? {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return undefined as T;

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const code = payload?.error?.code ?? "UNKNOWN";
    const message = payload?.error?.message ?? "요청 처리 중 오류가 발생했습니다.";
    throw new ApiClientError(code, message, res.status);
  }
  return payload?.data as T;
}
