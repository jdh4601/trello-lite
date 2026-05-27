import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiError } from "@/lib/api-error";
import { BoardAccessError, requireBoardMember } from "@/lib/auth/board-access";
import { updateListSchema } from "@/lib/schemas/list";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function loadListBoardId(listId: string): Promise<string | null> {
  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: { boardId: true },
  });
  return list?.boardId ?? null;
}

function handleAccessError(error: unknown): NextResponse | null {
  if (error instanceof BoardAccessError) {
    if (error.code === "NOT_FOUND") return apiError("NOT_FOUND", "리스트를 찾을 수 없습니다.");
    if (error.code === "FORBIDDEN") return apiError("FORBIDDEN", "권한이 없습니다.");
  }
  return null;
}

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "로그인이 필요합니다.");
  const { id } = await params;

  const boardId = await loadListBoardId(id);
  if (!boardId) return apiError("NOT_FOUND", "리스트를 찾을 수 없습니다.");

  try {
    await requireBoardMember(user.id, boardId);
  } catch (error) {
    return handleAccessError(error) ?? apiError("INTERNAL", "오류가 발생했습니다.");
  }

  const body = await req.json().catch(() => null);
  const parsed = updateListSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_FAILED", "입력값을 확인해주세요.");

  const list = await prisma.list.update({
    where: { id },
    data: parsed.data,
    select: { id: true, boardId: true, name: true, position: true },
  });

  return NextResponse.json({ data: { list } });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "로그인이 필요합니다.");
  const { id } = await params;

  const boardId = await loadListBoardId(id);
  if (!boardId) return new NextResponse(null, { status: 204 });

  try {
    await requireBoardMember(user.id, boardId);
  } catch (error) {
    return handleAccessError(error) ?? apiError("INTERNAL", "오류가 발생했습니다.");
  }

  await prisma.list.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
