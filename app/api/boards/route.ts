import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiError } from "@/lib/api-error";
import { createBoardSchema } from "@/lib/schemas/board";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "로그인이 필요합니다.");

  const boards = await prisma.board.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, ownerId: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ data: { boards } });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "로그인이 필요합니다.");

  const body = await req.json().catch(() => null);
  const parsed = createBoardSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_FAILED", "이름을 확인해주세요.");

  const board = await prisma.board.create({
    data: { name: parsed.data.name, ownerId: user.id },
    select: { id: true, name: true, ownerId: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ data: { board } }, { status: 201 });
}
