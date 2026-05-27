"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { readJSON, remove, StorageKeys, writeJSON } from "@/lib/storage/web-storage";
import type { Label } from "./types";

export type CardData = {
  id: string;
  title: string;
  description: string | null;
  dueDate?: string | null;
  labels?: Label[];
};

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function CardModal({
  card,
  boardLabels,
  onClose,
}: {
  card: CardData;
  boardLabels: Label[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(card.title);
  const originalDescription = card.description ?? "";
  const [description, setDescription] = useState(originalDescription);
  const [dueDate, setDueDate] = useState(toDateInputValue(card.dueDate ?? null));
  const [labelIds, setLabelIds] = useState<string[]>(
    (card.labels ?? []).map((l) => l.id),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const draftKey = StorageKeys.cardDraft(card.id);
  const initialized = useRef(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Restore an in-progress draft from sessionStorage on first mount.
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const draft = readJSON<string | null>("session", draftKey, null);
    if (draft && draft !== originalDescription) {
      setDescription(draft);
      setDraftRestored(true);
    }
  }, [draftKey, originalDescription]);

  // Mirror description changes into the session draft until they're saved.
  useEffect(() => {
    if (!initialized.current) return;
    if (description === originalDescription) {
      remove("session", draftKey);
      return;
    }
    writeJSON("session", draftKey, description);
  }, [description, draftKey, originalDescription]);

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
          dueDate: dueDate ? new Date(`${dueDate}T23:59:59`).toISOString() : null,
          labelIds,
        },
      });
      remove("session", draftKey);
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCard() {
    if (!confirm("이 카드를 삭제하시겠습니까?")) return;
    setSaving(true);
    try {
      await api(`/api/cards/${card.id}`, { method: "DELETE" });
      remove("session", draftKey);
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "삭제 실패");
      setSaving(false);
    }
  }

  function discardDraft() {
    setDescription(originalDescription);
    remove("session", draftKey);
    setDraftRestored(false);
  }

  function toggleLabel(id: string) {
    setLabelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
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
            <label htmlFor="card-description" className="text-xs font-medium text-neutral-500">
              설명
            </label>
            {draftRestored && (
              <div className="flex items-center justify-between rounded bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <span>이전에 저장하지 않은 작성 중인 내용을 복구했습니다.</span>
                <button
                  type="button"
                  onClick={discardDraft}
                  className="underline hover:no-underline"
                >
                  되돌리기
                </button>
              </div>
            )}
            <textarea
              id="card-description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="카드에 대한 자세한 설명을 입력하세요…"
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="card-due" className="text-xs font-medium text-neutral-500">
              마감일
            </label>
            <div className="flex items-center gap-2">
              <input
                id="card-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
              />
              {dueDate && (
                <button
                  onClick={() => setDueDate("")}
                  className="text-xs text-neutral-500 hover:text-red-600"
                >
                  지우기
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-neutral-500">라벨</p>
            {boardLabels.length === 0 ? (
              <p className="text-xs text-neutral-400">
                보드 라벨이 없습니다. 우측 상단 라벨 관리에서 추가하세요.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {boardLabels.map((l) => {
                  const active = labelIds.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      onClick={() => toggleLabel(l.id)}
                      className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${
                        active ? "ring-2 ring-offset-1 ring-neutral-900 dark:ring-white" : ""
                      }`}
                      style={{ backgroundColor: l.color, color: "#fff" }}
                    >
                      {l.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={deleteCard}
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
