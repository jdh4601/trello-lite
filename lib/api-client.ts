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

export async function api<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const res = await fetch(path, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
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
