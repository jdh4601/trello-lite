"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { api, ApiClientError } from "@/lib/api-client";
import { computeInsertPosition } from "@/lib/position";
import { AddListInline } from "./AddListInline";
import { Column } from "./Column";
import type { CardData } from "./CardModal";

export type BoardListData = {
  id: string;
  name: string;
  position: number;
  cards: Array<CardData & { position: number }>;
};

type DragItem = {
  cardId: string;
  fromListId: string;
};

export function BoardView({
  boardId,
  lists: initialLists,
}: {
  boardId: string;
  lists: BoardListData[];
}) {
  const router = useRouter();
  const [lists, setLists] = useState(initialLists);
  const [active, setActive] = useState<DragItem | null>(null);

  // Map cardId -> listId for quick lookup of source on drag end.
  const cardToList = useMemo(() => {
    const map = new Map<string, string>();
    for (const list of lists) for (const card of list.cards) map.set(card.id, list.id);
    return map;
  }, [lists]);

  const activeCard = useMemo(() => {
    if (!active) return null;
    const list = lists.find((l) => l.id === active.fromListId);
    return list?.cards.find((c) => c.id === active.cardId) ?? null;
  }, [active, lists]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      const cardId = String(event.active.id);
      const fromListId = cardToList.get(cardId);
      if (!fromListId) return;
      setActive({ cardId, fromListId });
    },
    [cardToList],
  );

  const onDragCancel = useCallback(() => setActive(null), []);

  const onDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active: dragged, over } = event;
      setActive(null);
      if (!over) return;

      const cardId = String(dragged.id);
      const fromListId = cardToList.get(cardId);
      if (!fromListId) return;

      const overId = String(over.id);
      // `over.id` is either a list id (when dropping on an empty column) or a card id.
      const targetListId = lists.some((l) => l.id === overId)
        ? overId
        : cardToList.get(overId);
      if (!targetListId) return;

      const previousLists = lists;
      const sourceList = previousLists.find((l) => l.id === fromListId)!;
      const targetList = previousLists.find((l) => l.id === targetListId)!;
      const card = sourceList.cards.find((c) => c.id === cardId)!;

      // Compute the target index inside the target list AFTER removing the
      // dragged card from its source position.
      const remainingTargetCards =
        sourceList.id === targetList.id
          ? targetList.cards.filter((c) => c.id !== cardId)
          : targetList.cards;
      const overCardIndex = remainingTargetCards.findIndex((c) => c.id === overId);
      const toIndex =
        overCardIndex === -1 ? remainingTargetCards.length : overCardIndex;

      // No-op move (same list, same slot).
      const currentIndex = sourceList.cards.findIndex((c) => c.id === cardId);
      if (sourceList.id === targetList.id && currentIndex === toIndex) return;

      const newPosition = computeInsertPosition(
        remainingTargetCards.map((c) => c.position),
        toIndex,
      );

      // Optimistic update.
      const optimistic = previousLists.map((list) => {
        if (list.id !== sourceList.id && list.id !== targetList.id) return list;
        let cards = list.cards.filter((c) => c.id !== cardId);
        if (list.id === targetList.id) {
          const moved = { ...card, position: newPosition };
          cards = [...cards.slice(0, toIndex), moved, ...cards.slice(toIndex)].sort(
            (a, b) => a.position - b.position,
          );
        }
        return { ...list, cards };
      });
      setLists(optimistic);

      try {
        await api(`/api/cards/${cardId}`, {
          method: "PATCH",
          body: { listId: targetListId, position: newPosition },
        });
        // Refresh in the background to absorb any server-side rebalance.
        router.refresh();
      } catch (err) {
        setLists(previousLists);
        alert(err instanceof ApiClientError ? err.message : "카드 이동 실패");
      }
    },
    [cardToList, lists, router],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragCancel={onDragCancel}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {lists.map((list) => (
          <SortableContext
            key={list.id}
            id={list.id}
            items={list.cards.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <Column list={list} />
          </SortableContext>
        ))}
        <AddListInline boardId={boardId} />
      </div>

      <DragOverlay>
        {activeCard ? (
          <div className="rounded border border-neutral-400 bg-white p-2.5 text-sm shadow-lg dark:border-neutral-500 dark:bg-neutral-900">
            <p className="line-clamp-3 text-neutral-900 dark:text-neutral-100">
              {activeCard.title}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
