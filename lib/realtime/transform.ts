import type { CardRealtime } from "./events";

/** Normalize a Prisma Card row for broadcast: Date → ISO string. */
export function toRealtimeCard(card: {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  position: number;
  dueDate: Date | null;
}): CardRealtime {
  return {
    id: card.id,
    listId: card.listId,
    title: card.title,
    description: card.description,
    position: card.position,
    dueDate: card.dueDate ? card.dueDate.toISOString() : null,
  };
}
