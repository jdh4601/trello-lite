import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiError } from "@/lib/api-error";
import { BoardAccessError, requireBoardMember } from "@/lib/auth/board-access";
import { updateCardSchema } from "@/lib/schemas/card";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function loadCardContext(cardId: string) {
  return prisma.card.findUnique({
    where: { id: cardId },
    select: {
      id: true,
      listId: true,
      list: { select: { boardId: true } },
    },
  });
}

function handleAccessError(error: unknown): NextResponse | null {
  if (error instanceof BoardAccessError) {
    if (error.code === "NOT_FOUND") return apiError("NOT_FOUND", "카드를 찾을 수 없습니다.");
    if (error.code === "FORBIDDEN") return apiError("FORBIDDEN", "권한이 없습니다.");
  }
  return null;
}

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "로그인이 필요합니다.");
  const { id } = await params;

  const ctx = await loadCardContext(id);
  if (!ctx) return apiError("NOT_FOUND", "카드를 찾을 수 없습니다.");

  try {
    await requireBoardMember(user.id, ctx.list.boardId);
  } catch (error) {
    return handleAccessError(error) ?? apiError("INTERNAL", "오류가 발생했습니다.");
  }

  const body = await req.json().catch(() => null);
  const parsed = updateCardSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_FAILED", "입력값을 확인해주세요.");

  // If moving to a different list, validate that the target list belongs to
  // the same board (no cross-board moves).
  if (parsed.data.listId && parsed.data.listId !== ctx.listId) {
    const target = await prisma.list.findUnique({
      where: { id: parsed.data.listId },
      select: { boardId: true },
    });
    if (!target) return apiError("NOT_FOUND", "대상 리스트를 찾을 수 없습니다.");
    if (target.boardId !== ctx.list.boardId) {
      return apiError("FORBIDDEN", "다른 보드의 리스트로는 이동할 수 없습니다.");
    }
  }

  const card = await prisma.card.update({
    where: { id },
    data: {
      ...parsed.data,
      dueDate:
        parsed.data.dueDate === undefined ? undefined : parsed.data.dueDate
          ? new Date(parsed.data.dueDate)
          : null,
    },
    select: {
      id: true,
      listId: true,
      title: true,
      description: true,
      position: true,
      dueDate: true,
    },
  });

  return NextResponse.json({ data: { card } });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "로그인이 필요합니다.");
  const { id } = await params;

  const ctx = await loadCardContext(id);
  if (!ctx) return new NextResponse(null, { status: 204 });

  try {
    await requireBoardMember(user.id, ctx.list.boardId);
  } catch (error) {
    return handleAccessError(error) ?? apiError("INTERNAL", "오류가 발생했습니다.");
  }

  await prisma.card.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
