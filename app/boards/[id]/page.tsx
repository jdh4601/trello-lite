import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getBoardAccess } from "@/lib/auth/board-access";
import { BoardView } from "@/components/board/BoardView";
import { LabelManager } from "@/components/board/LabelManager";
import { MembersPanel } from "@/components/board/MembersPanel";
import { OfflineIndicator } from "@/components/board/OfflineIndicator";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const access = await getBoardAccess(user.id, id);
  if (!access || !access.isMember) notFound();

  const board = await prisma.board.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      ownerId: true,
      owner: { select: { id: true, name: true, email: true } },
      members: {
        orderBy: { createdAt: "asc" },
        select: {
          role: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
      labels: {
        orderBy: { name: "asc" },
        select: { id: true, name: true, color: true },
      },
      lists: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          name: true,
          position: true,
          cards: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              position: true,
              dueDate: true,
              labels: { select: { id: true, name: true, color: true } },
            },
          },
        },
      },
    },
  });
  if (!board) notFound();

  const members = [
    {
      id: board.owner.id,
      name: board.owner.name,
      email: board.owner.email,
      role: "OWNER" as const,
    },
    ...board.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
    })),
  ];

  const lists = board.lists.map((list) => ({
    ...list,
    cards: list.cards.map((c) => ({
      ...c,
      dueDate: c.dueDate ? c.dueDate.toISOString() : null,
    })),
  }));

  return (
    <main className="min-h-screen px-6 py-6">
      <div className="max-w-full space-y-4">
        <header className="flex flex-wrap items-center gap-4">
          <Link
            href="/boards"
            className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            ← 내 보드
          </Link>
          <h1 className="text-xl font-semibold">{board.name}</h1>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            {access.isOwner ? "소유자" : "멤버"}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <OfflineIndicator />
            <ThemeToggle />
            <LabelManager boardId={board.id} initialLabels={board.labels} />
            <MembersPanel
              boardId={board.id}
              initialMembers={members}
              isOwner={access.isOwner}
              currentUserId={user.id}
            />
          </div>
        </header>

        <BoardView boardId={board.id} lists={lists} boardLabels={board.labels} />
      </div>
    </main>
  );
}
