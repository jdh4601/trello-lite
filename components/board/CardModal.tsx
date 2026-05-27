"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";

export type CardData = {
  id: string;
  title: string;
  description: string | null;
};

export function CardModal({ card, onClose }: { card: CardData; onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("제목을 입력해주세요.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await api(`/api/cards/${card.id}`, {
        method: "PATCH",
        body: {
          title: trimmedTitle,
          description: description.trim() ? description.trim() : null,
        },
      });
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("이 카드를 삭제하시겠습니까?")) return;
    setSaving(true);
    try {
      await api(`/api/cards/${card.id}`, { method: "DELETE" });
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "삭제 실패");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="card-title" className="text-xs font-medium text-neutral-500">
              제목
            </label>
            <input
              id="card-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-base font-medium dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="card-description"
              className="text-xs font-medium text-neutral-500"
            >
              설명
            </label>
            <textarea
              id="card-description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="카드에 대한 자세한 설명을 입력하세요…"
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={remove}
              disabled={saving}
              className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-950"
            >
              삭제
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={saving}
                className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                취소
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
              >
                {saving ? "저장 중…" : "저장"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
