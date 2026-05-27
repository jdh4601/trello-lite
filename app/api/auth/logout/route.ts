import { NextResponse } from "next/server";
import { clearSessionCookieOptions } from "@/lib/auth/cookies";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = new NextResponse(null, { status: 204 });
  res.cookies.set(clearSessionCookieOptions());
  return res;
}
