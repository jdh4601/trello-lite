import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/auth/schemas";
import { hashPassword } from "@/lib/auth/password";
import { signSession } from "@/lib/auth/jwt";
import { sessionCookieOptions } from "@/lib/auth/cookies";
import { apiError } from "@/lib/api-error";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limit = rateLimit(`signup:${clientIp(req)}`, 5, 60_000);
  if (!limit.ok) {
    return apiError("RATE_LIMITED", "잠시 후 다시 시도해주세요.");
  }

  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_FAILED", "입력값을 확인해주세요.", parsed.error.flatten());
  }

  const { email, name, password } = parsed.data;
  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: { email, name, passwordHash },
      select: { id: true, email: true, name: true },
    });

    const token = await signSession({ sub: user.id, email: user.email });
    const cookie = sessionCookieOptions(token);

    const res = NextResponse.json({ data: { user } }, { status: 201 });
    res.cookies.set(cookie);
    return res;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return apiError("EMAIL_TAKEN", "이미 가입된 이메일입니다.");
    }
    throw error;
  }
}
