"use client";

import { useState } from "react";
import { api, ApiClientError } from "@/lib/api-client";
import { LABEL_PALETTE } from "@/lib/schemas/label";
import type { Label } from "./types";

export function LabelManager({
  boardId,
  initialLabels,
}: {
  boardId: string;
  initialLabels: Label[];
}) {
  const [labels, setLabels] = useState(initialLabels);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(LABEL_PALETTE[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("이름을 입력해주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { label } = await api<{ label: Label }>(
        `/api/boards/${boardId}/labels`,
        { method: "POST", body: { name: trimmed, color } },
      );
      setLabels((prev) => [...prev, label].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "라벨 생성 실패");
    } finally {
      setBusy(false);
    }
  }

  async function remove(labelId: string) {
    if (!confirm("이 라벨을 삭제하시겠습니까?")) return;
    try {
      await api(`/api/labels/${labelId}`, { method: "DELETE" });
      setLabels((prev) => prev.filter((l) => l.id !== labelId));
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : "삭제 실패");
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        라벨 {labels.length}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <ul className="space-y-1.5">
            {labels.map((l) => (
              <li key={l.id} className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-6 rounded"
                  style={{ backgroundColor: l.color }}
                />
                <span className="flex-1 truncate">{l.name}</span>
                <button
                  onClick={() => remove(l.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  삭제
                </button>
              </li>
            ))}
            {labels.length === 0 && (
              <li className="text-xs text-neutral-500">아직 라벨이 없습니다.</li>
            )}
          </ul>
          <div className="mt-3 space-y-1.5 border-t border-neutral-200 pt-3 dark:border-neutral-700">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="라벨 이름"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  create();
                }
              }}
              className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />
            <div className="flex flex-wrap gap-1">
              {LABEL_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`색상 ${c}`}
                  className={`h-6 w-6 rounded border-2 ${
                    color === c ? "border-neutral-900 dark:border-white" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              onClick={create}
              disabled={busy}
              className="w-full rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
            >
              {busy ? "추가 중…" : "라벨 추가"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
