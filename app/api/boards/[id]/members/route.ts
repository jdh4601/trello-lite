import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiError } from "@/lib/api-error";
import { BoardAccessError, requireBoardMember } from "@/lib/auth/board-access";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "로그인이 필요합니다.");
  const { id: boardId } = await params;

  try {
    await requireBoardMember(user.id, boardId);
  } catch (error) {
    if (error instanceof BoardAccessError) {
      return error.code === "NOT_FOUND"
        ? apiError("NOT_FOUND", "보드를 찾을 수 없습니다.")
        : apiError("FORBIDDEN", "권한이 없습니다.");
    }
    throw error;
  }

  const board = await prisma.board.findUniqueOrThrow({
    where: { id: boardId },
    select: {
      ownerId: true,
      owner: { select: { id: true, name: true, email: true } },
      members: {
        orderBy: { createdAt: "asc" },
        select: { role: true, user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  const members = [
    { id: board.owner.id, name: board.owner.name, email: board.owner.email, role: "OWNER" as const },
    ...board.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
    })),
  ];

  return NextResponse.json({ data: { members } });
}
