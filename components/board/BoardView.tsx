"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { bindHandlers, subscribeBoard, unsubscribeBoard } from "@/lib/realtime/client";
import type { CardRealtime, ListRealtime } from "@/lib/realtime/events";
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

function sortByPosition<T extends { position: number }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.position - b.position);
}

function applyCardUpsert(
  lists: BoardListData[],
  card: CardRealtime,
  fromListId?: string,
): BoardListData[] {
  return lists.map((list) => {
    // Remove the card from its previous list (handles moves).
    let cards = list.cards.filter((c) => c.id !== card.id);
    if (fromListId && list.id === fromListId && list.id !== card.listId) {
      return { ...list, cards };
    }
    if (list.id === card.listId) {
      const next: CardData & { position: number } = {
        id: card.id,
        title: card.title,
        description: card.description,
        position: card.position,
      };
      cards = sortByPosition([...cards, next]);
    }
    return { ...list, cards };
  });
}

function applyListUpsert(lists: BoardListData[], list: ListRealtime): BoardListData[] {
  const existing = lists.find((l) => l.id === list.id);
  const next: BoardListData = existing
    ? { ...existing, name: list.name, position: list.position }
    : { id: list.id, name: list.name, position: list.position, cards: [] };
  const others = lists.filter((l) => l.id !== list.id);
  return sortByPosition([...others, next]);
}

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

  // Reset to server-truth when the route refreshes (e.g., after a navigation).
  useEffect(() => {
    setLists(initialLists);
  }, [initialLists]);

  useEffect(() => {
    const channel = subscribeBoard(boardId);
    if (!channel) return;

    const unbind = bindHandlers(channel, {
      "list:created": ({ list }) => setLists((prev) => applyListUpsert(prev, list)),
      "list:updated": ({ list }) => setLists((prev) => applyListUpsert(prev, list)),
      "list:deleted": ({ listId }) =>
        setLists((prev) => prev.filter((l) => l.id !== listId)),
      "card:created": ({ card }) => setLists((prev) => applyCardUpsert(prev, card)),
      "card:updated": ({ card }) => setLists((prev) => applyCardUpsert(prev, card)),
      "card:moved": ({ card, fromListId }) =>
        setLists((prev) => applyCardUpsert(prev, card, fromListId)),
      "card:deleted": ({ cardId, listId }) =>
        setLists((prev) =>
          prev.map((l) =>
            l.id === listId ? { ...l, cards: l.cards.filter((c) => c.id !== cardId) } : l,
          ),
        ),
    });

    return () => {
      unbind();
      unsubscribeBoard(boardId);
    };
  }, [boardId]);

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
      const targetListId = lists.some((l) => l.id === overId)
        ? overId
        : cardToList.get(overId);
      if (!targetListId) return;

      const previousLists = lists;
      const sourceList = previousLists.find((l) => l.id === fromListId)!;
      const targetList = previousLists.find((l) => l.id === targetListId)!;
      const card = sourceList.cards.find((c) => c.id === cardId)!;

      const remainingTargetCards =
        sourceList.id === targetList.id
          ? targetList.cards.filter((c) => c.id !== cardId)
          : targetList.cards;
      const overCardIndex = remainingTargetCards.findIndex((c) => c.id === overId);
      const toIndex =
        overCardIndex === -1 ? remainingTargetCards.length : overCardIndex;

      const currentIndex = sourceList.cards.findIndex((c) => c.id === cardId);
      if (sourceList.id === targetList.id && currentIndex === toIndex) return;

      const newPosition = computeInsertPosition(
        remainingTargetCards.map((c) => c.position),
        toIndex,
      );

      const optimistic = previousLists.map((list) => {
        if (list.id !== sourceList.id && list.id !== targetList.id) return list;
        let cards = list.cards.filter((c) => c.id !== cardId);
        if (list.id === targetList.id) {
          const moved = { ...card, position: newPosition };
          cards = sortByPosition([...cards.slice(0, toIndex), moved, ...cards.slice(toIndex)]);
        }
        return { ...list, cards };
      });
      setLists(optimistic);

      try {
        await api(`/api/cards/${cardId}`, {
          method: "PATCH",
          body: { listId: targetListId, position: newPosition },
        });
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
