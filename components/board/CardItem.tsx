"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CardModal, type CardData } from "./CardModal";

export function CardItem({ card }: { card: CardData }) {
  const [open, setOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={(e) => {
          // dnd-kit fires click after a drag; ignore clicks during drag.
          if (isDragging) return;
          // Only open the modal for genuine clicks, not after a drag gesture
          // (PointerSensor's `distance` constraint suppresses synthetic clicks).
          if ((e.target as HTMLElement).closest("[data-no-modal]")) return;
          setOpen(true);
        }}
        className="block w-full cursor-grab rounded border border-neutral-200 bg-white p-2.5 text-left text-sm shadow-sm hover:border-neutral-400 active:cursor-grabbing dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-500"
      >
        <p className="line-clamp-3 text-neutral-900 dark:text-neutral-100">{card.title}</p>
      </div>
      {open && <CardModal card={card} onClose={() => setOpen(false)} />}
    </>
  );
}
