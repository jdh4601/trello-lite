"use client";

import { useState } from "react";
import { CardModal, type CardData } from "./CardModal";

export function CardItem({ card }: { card: CardData }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="block w-full rounded border border-neutral-200 bg-white p-2.5 text-left text-sm shadow-sm hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-500"
      >
        <p className="line-clamp-3 text-neutral-900 dark:text-neutral-100">{card.title}</p>
      </button>
      {open && <CardModal card={card} onClose={() => setOpen(false)} />}
    </>
  );
}
