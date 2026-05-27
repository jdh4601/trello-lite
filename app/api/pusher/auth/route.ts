import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { apiError } from "@/lib/api-error";
import { BoardAccessError, requireBoardMember } from "@/lib/auth/board-access";
import { BOARD_CHANNEL_PREFIX } from "@/lib/realtime/events";
import { authorizeBoardChannel } from "@/lib/realtime/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "로그인이 필요합니다.");

  // Pusher posts URL-encoded `socket_id` and `channel_name`.
  const form = await req.formData().catch(() => null);
  const socketId = form?.get("socket_id");
  const channelName = form?.get("channel_name");
  if (typeof socketId !== "string" || typeof channelName !== "string") {
    return apiError("VALIDATION_FAILED", "잘못된 요청입니다.");
  }

  if (!channelName.startsWith(BOARD_CHANNEL_PREFIX)) {
    return apiError("FORBIDDEN", "허용되지 않은 채널입니다.");
  }
  const boardId = channelName.slice(BOARD_CHANNEL_PREFIX.length);

  try {
    await requireBoardMember(user.id, boardId);
  } catch (error) {
    if (error instanceof BoardAccessError) {
      return apiError(error.code, "보드 접근 권한이 없습니다.");
    }
    throw error;
  }

  const auth = authorizeBoardChannel(channelName, socketId);
  if (!auth) return apiError("INTERNAL", "실시간 서버가 설정되지 않았습니다.");
  return NextResponse.json(auth);
}
