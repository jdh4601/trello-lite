import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiError } from "@/lib/api-error";
import { BoardAccessError, requireBoardMember } from "@/lib/auth/board-access";
import { createCardSchema } from "@/lib/schemas/card";
import { positionAfter } from "@/lib/position";
import { broadcastBoard, socketIdFromRequest } from "@/lib/realtime/server";
import { toRealtimeCard } from "@/lib/realtime/transform";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "로그인이 필요합니다.");

  const body = await req.json().catch(() => null);
  const parsed = createCardSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_FAILED", "입력값을 확인해주세요.");

  const { listId, title } = parsed.data;

  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: { boardId: true },
  });
  if (!list) return apiError("NOT_FOUND", "리스트를 찾을 수 없습니다.");

  try {
    await requireBoardMember(user.id, list.boardId);
  } catch (error) {
    if (error instanceof BoardAccessError) {
      return error.code === "NOT_FOUND"
        ? apiError("NOT_FOUND", "리스트를 찾을 수 없습니다.")
        : apiError("FORBIDDEN", "권한이 없습니다.");
    }
    throw error;
  }

  const last = await prisma.card.findFirst({
    where: { listId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const card = await prisma.card.create({
    data: {
      listId,
      title,
      position: positionAfter(last?.position),
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

  await broadcastBoard(
    list.boardId,
    "card:created",
    { card: toRealtimeCard(card) },
    socketIdFromRequest(req),
  );

  return NextResponse.json({ data: { card } }, { status: 201 });
}
