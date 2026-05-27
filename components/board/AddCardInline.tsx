"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";

export function AddCardInline({ listId }: { listId: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const trimmed = title.trim();
    if (!trimmed) {
      setEditing(false);
      setTitle("");
      return;
    }
    setSubmitting(true);
    try {
      await api("/api/cards", { method: "POST", body: { listId, title: trimmed } });
      setTitle("");
      router.refresh();
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : "카드 추가 실패");
    } finally {
      setSubmitting(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="block w-full rounded px-2 py-1.5 text-left text-xs text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
      >
        + 카드 추가
      </button>
    );
  }

  return (
    <div className="space-y-1.5 px-1">
      <textarea
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") {
            setEditing(false);
            setTitle("");
          }
        }}
        rows={2}
        placeholder="카드 제목"
        className="w-full resize-none rounded border border-neutral-300 bg-white p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={submitting}
          className="rounded bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {submitting ? "추가 중…" : "추가"}
        </button>
        <button
          onClick={() => {
            setEditing(false);
            setTitle("");
          }}
          className="rounded px-3 py-1 text-xs text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
        >
          취소
        </button>
      </div>
    </div>
  );
}
