/**
 * Pusher event catalog for board-scoped real-time sync.
 *
 * Channel: `private-board-<boardId>`
 *
 * The "echo prevention" pattern: REST handlers exclude the originating
 * socket via Pusher's `socket_id` so the actor doesn't double-apply their
 * own optimistic update.
 */

export const BOARD_CHANNEL_PREFIX = "private-board-";

export const RealtimeEvent = {
  ListCreated: "list:created",
  ListUpdated: "list:updated",
  ListDeleted: "list:deleted",
  CardCreated: "card:created",
  CardUpdated: "card:updated",
  CardMoved: "card:moved",
  CardDeleted: "card:deleted",
  MemberJoined: "member:joined",
} as const;

export type RealtimeEventName = (typeof RealtimeEvent)[keyof typeof RealtimeEvent];

export type CardRealtime = {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  position: number;
  dueDate: string | null;
  labelIds: string[];
};

export type LabelRealtime = {
  id: string;
  name: string;
  color: string;
};

export type ListRealtime = {
  id: string;
  boardId: string;
  name: string;
  position: number;
};

export type RealtimePayloads = {
  "list:created": { list: ListRealtime };
  "list:updated": { list: ListRealtime };
  "list:deleted": { listId: string };
  "card:created": { card: CardRealtime };
  "card:updated": { card: CardRealtime };
  "card:moved": { card: CardRealtime; fromListId: string };
  "card:deleted": { cardId: string; listId: string };
  "member:joined": { userId: string; name: string; email: string };
};

export function boardChannel(boardId: string): string {
  return `${BOARD_CHANNEL_PREFIX}${boardId}`;
}
