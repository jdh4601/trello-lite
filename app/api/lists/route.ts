import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiError } from "@/lib/api-error";
import { BoardAccessError, requireBoardMember } from "@/lib/auth/board-access";
import { createListSchema } from "@/lib/schemas/list";
import { positionAfter } from "@/lib/position";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "로그인이 필요합니다.");

  const body = await req.json().catch(() => null);
  const parsed = createListSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_FAILED", "입력값을 확인해주세요.");

  const { boardId, name } = parsed.data;

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

  const last = await prisma.list.findFirst({
    where: { boardId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const list = await prisma.list.create({
    data: {
      boardId,
      name,
      position: positionAfter(last?.position),
    },
    select: { id: true, boardId: true, name: true, position: true },
  });

  return NextResponse.json({ data: { list } }, { status: 201 });
}
