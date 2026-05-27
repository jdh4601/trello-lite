"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CardModal, type CardData } from "./CardModal";
import type { Label } from "./types";

function dueDateBadge(iso: string | null | undefined): {
  label: string;
  tone: "overdue" | "soon" | "normal";
} | null {
  if (!iso) return null;
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return null;
  const now = Date.now();
  const diff = due.getTime() - now;
  const day = 24 * 60 * 60 * 1000;
  const label = due.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  if (diff < 0) return { label, tone: "overdue" };
  if (diff < 3 * day) return { label, tone: "soon" };
  return { label, tone: "normal" };
}

export function CardItem({
  card,
  boardLabels,
}: {
  card: CardData;
  boardLabels: Label[];
}) {
  const [open, setOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const badge = dueDateBadge(card.dueDate);
  const labels = card.labels ?? [];

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={(e) => {
          if (isDragging) return;
          if ((e.target as HTMLElement).closest("[data-no-modal]")) return;
          setOpen(true);
        }}
        className="block w-full cursor-grab rounded border border-neutral-200 bg-white p-2.5 text-left text-sm shadow-sm hover:border-neutral-400 active:cursor-grabbing dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-500"
      >
        {labels.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {labels.map((l) => (
              <span
                key={l.id}
                title={l.name}
                className="h-1.5 w-8 rounded-full"
                style={{ backgroundColor: l.color }}
              />
            ))}
          </div>
        )}
        <p className="line-clamp-3 text-neutral-900 dark:text-neutral-100">{card.title}</p>
        {badge && (
          <span
            className={`mt-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
              badge.tone === "overdue"
                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                : badge.tone === "soon"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
            }`}
          >
            ⏰ {badge.label}
          </span>
        )}
      </div>
      {open && (
        <CardModal card={card} boardLabels={boardLabels} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
