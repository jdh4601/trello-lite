import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/auth/schemas";
import { verifyPassword } from "@/lib/auth/password";
import { signSession } from "@/lib/auth/jwt";
import { sessionCookieOptions } from "@/lib/auth/cookies";
import { apiError } from "@/lib/api-error";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limit = rateLimit(`login:${clientIp(req)}`, 5, 60_000);
  if (!limit.ok) {
    return apiError("RATE_LIMITED", "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.");
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_FAILED", "입력값을 확인해주세요.");
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return apiError("INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return apiError("INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  const token = await signSession({ sub: user.id, email: user.email });
  const cookie = sessionCookieOptions(token);

  const res = NextResponse.json({
    data: { user: { id: user.id, email: user.email, name: user.name } },
  });
  res.cookies.set(cookie);
  return res;
}
