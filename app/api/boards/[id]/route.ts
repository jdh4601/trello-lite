import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiError } from "@/lib/api-error";
import { updateBoardSchema } from "@/lib/schemas/board";
import {
  BoardAccessError,
  requireBoardMember,
  requireBoardOwner,
} from "@/lib/auth/board-access";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function handleAccessError(error: unknown): NextResponse | null {
  if (error instanceof BoardAccessError) {
    if (error.code === "NOT_FOUND") return apiError("NOT_FOUND", "보드를 찾을 수 없습니다.");
    if (error.code === "FORBIDDEN") return apiError("FORBIDDEN", "권한이 없습니다.");
  }
  return null;
}

export async function GET(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "로그인이 필요합니다.");
  const { id } = await params;

  try {
    await requireBoardMember(user.id, id);
  } catch (error) {
    return handleAccessError(error) ?? apiError("INTERNAL", "오류가 발생했습니다.");
  }

  const board = await prisma.board.findUnique({
    where: { id },
    select: { id: true, name: true, ownerId: true, createdAt: true, updatedAt: true },
  });
  if (!board) return apiError("NOT_FOUND", "보드를 찾을 수 없습니다.");

  return NextResponse.json({ data: { board } });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "로그인이 필요합니다.");
  const { id } = await params;

  try {
    await requireBoardOwner(user.id, id);
  } catch (error) {
    return handleAccessError(error) ?? apiError("INTERNAL", "오류가 발생했습니다.");
  }

  const body = await req.json().catch(() => null);
  const parsed = updateBoardSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_FAILED", "입력값을 확인해주세요.");

  const board = await prisma.board.update({
    where: { id },
    data: parsed.data,
    select: { id: true, name: true, ownerId: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ data: { board } });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "로그인이 필요합니다.");
  const { id } = await params;

  try {
    await requireBoardOwner(user.id, id);
  } catch (error) {
    return handleAccessError(error) ?? apiError("INTERNAL", "오류가 발생했습니다.");
  }

  await prisma.board.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
