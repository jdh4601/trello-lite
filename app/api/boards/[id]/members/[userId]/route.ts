import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiError } from "@/lib/api-error";
import { BoardAccessError, requireBoardOwner } from "@/lib/auth/board-access";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; userId: string }> };

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "로그인이 필요합니다.");
  const { id: boardId, userId } = await params;

  try {
    await requireBoardOwner(user.id, boardId);
  } catch (error) {
    if (error instanceof BoardAccessError) {
      return error.code === "NOT_FOUND"
        ? apiError("NOT_FOUND", "보드를 찾을 수 없습니다.")
        : apiError("FORBIDDEN", "보드 소유자만 멤버를 제거할 수 있습니다.");
    }
    throw error;
  }

  if (userId === user.id) {
    return apiError("VALIDATION_FAILED", "소유자는 자신을 제거할 수 없습니다.");
  }

  await prisma.boardMember
    .delete({ where: { boardId_userId: { boardId, userId } } })
    .catch(() => null);

  return new NextResponse(null, { status: 204 });
}
