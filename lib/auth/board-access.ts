import { prisma } from "@/lib/prisma";

export type BoardAccess = {
  isOwner: boolean;
  isMember: boolean;
};

/**
 * Resolve a user's relationship to a board.
 *
 * Slice 8 (TRE-8) will introduce explicit BoardMember rows for invited users;
 * until then, only the owner has access.
 */
export async function getBoardAccess(
  userId: string,
  boardId: string,
): Promise<BoardAccess | null> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { ownerId: true },
  });
  if (!board) return null;

  return {
    isOwner: board.ownerId === userId,
    isMember: board.ownerId === userId,
  };
}

export async function requireBoardOwner(userId: string, boardId: string): Promise<void> {
  const access = await getBoardAccess(userId, boardId);
  if (!access) throw new BoardAccessError("NOT_FOUND");
  if (!access.isOwner) throw new BoardAccessError("FORBIDDEN");
}

export async function requireBoardMember(userId: string, boardId: string): Promise<void> {
  const access = await getBoardAccess(userId, boardId);
  if (!access) throw new BoardAccessError("NOT_FOUND");
  if (!access.isMember) throw new BoardAccessError("FORBIDDEN");
}

export class BoardAccessError extends Error {
  constructor(public code: "NOT_FOUND" | "FORBIDDEN") {
    super(code);
  }
}
