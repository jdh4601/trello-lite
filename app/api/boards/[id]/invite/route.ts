import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiError } from "@/lib/api-error";
import { BoardAccessError, requireBoardOwner } from "@/lib/auth/board-access";
import { inviteMemberSchema } from "@/lib/schemas/board";
import { broadcastBoard, socketIdFromRequest } from "@/lib/realtime/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "로그인이 필요합니다.");
  const { id: boardId } = await params;

  try {
    await requireBoardOwner(user.id, boardId);
  } catch (error) {
    if (error instanceof BoardAccessError) {
      return error.code === "NOT_FOUND"
        ? apiError("NOT_FOUND", "보드를 찾을 수 없습니다.")
        : apiError("FORBIDDEN", "보드 소유자만 멤버를 초대할 수 있습니다.");
    }
    throw error;
  }

  const body = await req.json().catch(() => null);
  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_FAILED", "이메일을 확인해주세요.");

  const invitee = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true },
  });
  if (!invitee) return apiError("NOT_FOUND", "해당 이메일의 사용자를 찾을 수 없습니다.");
  if (invitee.id === user.id) {
    return apiError("VALIDATION_FAILED", "본인은 이미 보드의 소유자입니다.");
  }

  try {
    await prisma.boardMember.create({
      data: { boardId, userId: invitee.id, role: "MEMBER" },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("CONFLICT", "이미 이 보드의 멤버입니다.");
    }
    throw error;
  }

  await broadcastBoard(
    boardId,
    "member:joined",
    { userId: invitee.id, name: invitee.name, email: invitee.email },
    socketIdFromRequest(req),
  );

  return NextResponse.json(
    {
      data: {
        member: { id: invitee.id, name: invitee.name, email: invitee.email, role: "MEMBER" },
      },
    },
    { status: 201 },
  );
}
