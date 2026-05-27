import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const board = await prisma.board.findUnique({
    where: { id },
    select: { id: true, name: true, ownerId: true },
  });
  if (!board) notFound();
  if (board.ownerId !== user.id) notFound();

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center gap-4">
          <Link
            href="/boards"
            className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            ← 내 보드
          </Link>
          <h1 className="text-xl font-semibold">{board.name}</h1>
        </header>
        <section className="rounded-lg border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-500">
            리스트와 카드는 다음 슬라이스에서 구현됩니다.
          </p>
        </section>
      </div>
    </main>
  );
}
