import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiError } from "@/lib/api-error";
import { BoardAccessError, requireBoardMember } from "@/lib/auth/board-access";
import { updateLabelSchema } from "@/lib/schemas/label";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function loadLabelBoardId(labelId: string): Promise<string | null> {
  const row = await prisma.label.findUnique({
    where: { id: labelId },
    select: { boardId: true },
  });
  return row?.boardId ?? null;
}

function handleAccessError(error: unknown): NextResponse | null {
  if (error instanceof BoardAccessError) {
    if (error.code === "NOT_FOUND") return apiError("NOT_FOUND", "라벨을 찾을 수 없습니다.");
    if (error.code === "FORBIDDEN") return apiError("FORBIDDEN", "권한이 없습니다.");
  }
  return null;
}

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "로그인이 필요합니다.");
  const { id } = await params;

  const boardId = await loadLabelBoardId(id);
  if (!boardId) return apiError("NOT_FOUND", "라벨을 찾을 수 없습니다.");

  try {
    await requireBoardMember(user.id, boardId);
  } catch (error) {
    return handleAccessError(error) ?? apiError("INTERNAL", "오류가 발생했습니다.");
  }

  const body = await req.json().catch(() => null);
  const parsed = updateLabelSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_FAILED", "입력값을 확인해주세요.");

  const label = await prisma.label.update({
    where: { id },
    data: parsed.data,
    select: { id: true, name: true, color: true },
  });
  return NextResponse.json({ data: { label } });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "로그인이 필요합니다.");
  const { id } = await params;

  const boardId = await loadLabelBoardId(id);
  if (!boardId) return new NextResponse(null, { status: 204 });

  try {
    await requireBoardMember(user.id, boardId);
  } catch (error) {
    return handleAccessError(error) ?? apiError("INTERNAL", "오류가 발생했습니다.");
  }

  await prisma.label.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
