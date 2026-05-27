"use client";

import { useEffect, useState } from "react";
import { api, ApiClientError } from "@/lib/api-client";
import { bindHandlers, subscribeBoard, unsubscribeBoard } from "@/lib/realtime/client";

export type BoardMember = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MEMBER";
};

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

export function MembersPanel({
  boardId,
  initialMembers,
  isOwner,
  currentUserId,
}: {
  boardId: string;
  initialMembers: BoardMember[];
  isOwner: boolean;
  currentUserId: string;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMembers(initialMembers), [initialMembers]);

  useEffect(() => {
    const channel = subscribeBoard(boardId);
    if (!channel) return;
    const unbind = bindHandlers(channel, {
      "member:joined": ({ userId, name, email }) =>
        setMembers((prev) =>
          prev.some((m) => m.id === userId)
            ? prev
            : [...prev, { id: userId, name, email, role: "MEMBER" }],
        ),
    });
    return () => {
      unbind();
      unsubscribeBoard(boardId);
    };
  }, [boardId]);

  async function invite() {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("이메일을 입력해주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { member } = await api<{ member: BoardMember }>(
        `/api/boards/${boardId}/invite`,
        { method: "POST", body: { email: trimmed } },
      );
      setMembers((prev) =>
        prev.some((m) => m.id === member.id) ? prev : [...prev, member],
      );
      setEmail("");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "초대 실패");
    } finally {
      setBusy(false);
    }
  }

  async function remove(userId: string) {
    if (!confirm("이 멤버를 보드에서 제거하시겠습니까?")) return;
    try {
      await api(`/api/boards/${boardId}/members/${userId}`, { method: "DELETE" });
      setMembers((prev) => prev.filter((m) => m.id !== userId));
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : "제거 실패");
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        <div className="flex -space-x-1.5">
          {members.slice(0, 4).map((m) => (
            <span
              key={m.id}
              title={`${m.name} (${m.email})`}
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-neutral-500 text-[10px] font-medium text-white dark:border-neutral-900"
            >
              {initials(m.name)}
            </span>
          ))}
        </div>
        <span className="ml-1">멤버 {members.length}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-500 text-xs font-medium text-white">
                  {initials(m.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {m.name}
                    {m.id === currentUserId && (
                      <span className="ml-1 text-xs text-neutral-500">(나)</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-neutral-500">{m.email}</p>
                </div>
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  {m.role === "OWNER" ? "소유자" : "멤버"}
                </span>
                {isOwner && m.role !== "OWNER" && (
                  <button
                    onClick={() => remove(m.id)}
                    className="text-xs text-red-600 hover:underline"
                    aria-label={`${m.name} 제거`}
                  >
                    제거
                  </button>
                )}
              </li>
            ))}
          </ul>

          {isOwner && (
            <div className="mt-3 space-y-1.5 border-t border-neutral-200 pt-3 dark:border-neutral-700">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    invite();
                  }
                }}
                placeholder="초대할 사용자 이메일"
                className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
              />
              {error && (
                <p role="alert" className="text-xs text-red-600">
                  {error}
                </p>
              )}
              <button
                onClick={invite}
                disabled={busy}
                className="w-full rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
              >
                {busy ? "초대 중…" : "초대"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
