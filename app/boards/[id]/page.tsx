import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { AddListInline } from "@/components/board/AddListInline";
import { Column } from "@/components/board/Column";

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
    select: {
      id: true,
      name: true,
      ownerId: true,
      lists: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          name: true,
          position: true,
          cards: {
            orderBy: { position: "asc" },
            select: { id: true, title: true, description: true },
          },
        },
      },
    },
  });
  if (!board) notFound();
  if (board.ownerId !== user.id) notFound();

  return (
    <main className="min-h-screen px-6 py-6">
      <div className="max-w-full space-y-4">
        <header className="flex items-center gap-4">
          <Link
            href="/boards"
            className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            ← 내 보드
          </Link>
          <h1 className="text-xl font-semibold">{board.name}</h1>
        </header>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {board.lists.map((list) => (
            <Column
              key={list.id}
              list={{
                id: list.id,
                name: list.name,
                cards: list.cards,
              }}
            />
          ))}
          <AddListInline boardId={board.id} />
        </div>
      </div>
    </main>
  );
}
