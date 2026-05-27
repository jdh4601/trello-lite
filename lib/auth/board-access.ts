import { prisma } from "@/lib/prisma";

export type BoardAccess = {
  isOwner: boolean;
  isMember: boolean;
};

/**
 * Resolve a user's relationship to a board.
 *
 * Owner has implicit member access; explicit BoardMember rows grant access
 * to invited users (see TRE-8).
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

  const isOwner = board.ownerId === userId;
  if (isOwner) return { isOwner: true, isMember: true };

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
    select: { boardId: true },
  });
  return { isOwner: false, isMember: membership !== null };
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
