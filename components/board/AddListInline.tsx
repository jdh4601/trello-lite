"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";

export function AddListInline({ boardId }: { boardId: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setEditing(false);
      setName("");
      return;
    }
    setSubmitting(true);
    try {
      await api("/api/lists", { method: "POST", body: { boardId, name: trimmed } });
      setName("");
      setEditing(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : "리스트 추가 실패");
    } finally {
      setSubmitting(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-72 shrink-0 rounded-lg border border-dashed border-neutral-300 px-3 py-3 text-left text-sm text-neutral-500 hover:border-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-500 dark:hover:bg-neutral-800"
      >
        + 리스트 추가
      </button>
    );
  }

  return (
    <div className="w-72 shrink-0 rounded-lg border border-neutral-200 bg-white p-2 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") {
            setEditing(false);
            setName("");
          }
        }}
        placeholder="리스트 이름"
        className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      />
      <div className="mt-2 flex gap-2">
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
            setName("");
          }}
          className="rounded px-3 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          취소
        </button>
      </div>
    </div>
  );
}
