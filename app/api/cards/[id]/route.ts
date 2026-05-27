import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiError } from "@/lib/api-error";
import { BoardAccessError, requireBoardMember } from "@/lib/auth/board-access";
import { updateCardSchema } from "@/lib/schemas/card";
import { minGap, PRECISION_THRESHOLD, rebalance } from "@/lib/position";

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

  // Cross-board moves are blocked: target list must live on the same board.
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

  const data = parsed.data;

  const card = await prisma.$transaction(async (tx) => {
    const updated = await tx.card.update({
      where: { id },
      data: {
        ...data,
        dueDate:
          data.dueDate === undefined ? undefined : data.dueDate ? new Date(data.dueDate) : null,
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

    // If position changed, check whether the destination list needs rebalancing.
    if (data.position !== undefined || data.listId !== undefined) {
      const affectedListIds = new Set<string>([updated.listId]);
      if (data.listId && data.listId !== ctx.listId) affectedListIds.add(ctx.listId);

      for (const listId of affectedListIds) {
        const siblings = await tx.card.findMany({
          where: { listId },
          orderBy: { position: "asc" },
          select: { id: true, position: true },
        });
        if (siblings.length < 2) continue;
        if (minGap(siblings.map((s) => s.position)) >= PRECISION_THRESHOLD) continue;

        // Neighbors too close — re-space everything to integer steps. One
        // transaction ensures clients never observe a partial state.
        const positions = rebalance(siblings.length);
        for (let i = 0; i < siblings.length; i++) {
          await tx.card.update({
            where: { id: siblings[i]!.id },
            data: { position: positions[i] },
          });
        }
      }

      // Re-fetch in case the moving card was itself rebalanced.
      return tx.card.findUniqueOrThrow({
        where: { id },
        select: {
          id: true,
          listId: true,
          title: true,
          description: true,
          position: true,
          dueDate: true,
        },
      });
    }

    return updated;
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
