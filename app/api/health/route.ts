import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  try {
    const result = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
    const dbOk = result[0]?.ok === 1;

    return NextResponse.json(
      {
        status: dbOk ? "ok" : "degraded",
        db: dbOk,
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: dbOk ? 200 : 503 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        db: false,
        error: error instanceof Error ? error.message : "Unknown error",
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
