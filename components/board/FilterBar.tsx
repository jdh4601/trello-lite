"use client";

import type { Label } from "./types";

export type BoardFilters = {
  labelIds: string[];
  dueSoonOnly: boolean;
};

export const EMPTY_FILTERS: BoardFilters = { labelIds: [], dueSoonOnly: false };

export function isFilterActive(f: BoardFilters): boolean {
  return f.labelIds.length > 0 || f.dueSoonOnly;
}

export function FilterBar({
  labels,
  value,
  onChange,
}: {
  labels: Label[];
  value: BoardFilters;
  onChange: (next: BoardFilters) => void;
}) {
  function toggleLabel(id: string) {
    onChange({
      ...value,
      labelIds: value.labelIds.includes(id)
        ? value.labelIds.filter((x) => x !== id)
        : [...value.labelIds, id],
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs dark:border-neutral-800 dark:bg-neutral-900/40">
      <span className="text-neutral-500">필터</span>
      {labels.length === 0 ? (
        <span className="text-neutral-400">라벨 없음</span>
      ) : (
        labels.map((l) => {
          const active = value.labelIds.includes(l.id);
          return (
            <button
              key={l.id}
              onClick={() => toggleLabel(l.id)}
              className={`rounded px-2 py-0.5 ${
                active
                  ? "ring-2 ring-offset-1 ring-neutral-900 dark:ring-white"
                  : "opacity-70 hover:opacity-100"
              }`}
              style={{ backgroundColor: l.color, color: "#fff" }}
            >
              {l.name}
            </button>
          );
        })
      )}

      <label className="ml-auto flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
        <input
          type="checkbox"
          checked={value.dueSoonOnly}
          onChange={(e) => onChange({ ...value, dueSoonOnly: e.target.checked })}
        />
        마감 임박 (3일 이내)
      </label>

      {isFilterActive(value) && (
        <button
          onClick={() => onChange(EMPTY_FILTERS)}
          className="text-neutral-500 underline hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          초기화
        </button>
      )}
    </div>
  );
}
