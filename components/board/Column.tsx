"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { AddCardInline } from "./AddCardInline";
import { CardItem } from "./CardItem";
import type { CardData } from "./CardModal";

export type ColumnData = {
  id: string;
  name: string;
  cards: CardData[];
};

export function Column({ list }: { list: ColumnData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list.name);

  async function rename() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === list.name) {
      setName(list.name);
      setEditing(false);
      return;
    }
    try {
      await api(`/api/lists/${list.id}`, { method: "PATCH", body: { name: trimmed } });
      setEditing(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : "이름 변경 실패");
      setName(list.name);
      setEditing(false);
    }
  }

  async function remove() {
    if (!confirm(`"${list.name}" 리스트를 삭제하시겠습니까? (포함된 카드도 함께 삭제됩니다)`)) {
      return;
    }
    try {
      await api(`/api/lists/${list.id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : "삭제 실패");
    }
  }

  return (
    <div className="w-72 shrink-0 rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800">
      <header className="flex items-center justify-between px-2 py-1.5">
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={rename}
            onKeyDown={(e) => {
              if (e.key === "Enter") rename();
              if (e.key === "Escape") {
                setName(list.name);
                setEditing(false);
              }
            }}
            className="w-full rounded border border-neutral-300 bg-white px-2 py-0.5 text-sm font-medium dark:border-neutral-600 dark:bg-neutral-900"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
          >
            {list.name}
          </button>
        )}
        <button
          onClick={remove}
          aria-label="리스트 삭제"
          className="text-xs text-neutral-400 hover:text-red-600"
        >
          ✕
        </button>
      </header>

      <div className="space-y-2 px-1 py-2 min-h-[40px]">
        {list.cards.map((card) => (
          <CardItem key={card.id} card={card} />
        ))}
        <AddCardInline listId={list.id} />
      </div>
    </div>
  );
}
