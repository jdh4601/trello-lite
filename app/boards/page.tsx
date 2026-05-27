import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { BoardCard } from "@/components/boards/BoardCard";
import { CreateBoardDialog } from "@/components/boards/CreateBoardDialog";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const dynamic = "force-dynamic";
export const metadata = { title: "내 보드 — FlowBoard" };

export default async function BoardsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Owned + invited boards together; the BoardCard surfaces the role.
  const boards = await prisma.board.findMany({
    where: {
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, ownerId: true, updatedAt: true },
  });

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">내 보드</h1>
            <p className="text-sm text-neutral-500">
              {user.name} · {user.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <CreateBoardDialog />
            <LogoutButton />
          </div>
        </header>

        {boards.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={{
                  id: board.id,
                  name: board.name,
                  updatedAt: board.updatedAt.toISOString(),
                  role: board.ownerId === user.id ? "OWNER" : "MEMBER",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <section className="rounded-lg border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
      <p className="text-sm text-neutral-500">아직 보드가 없습니다.</p>
      <p className="mt-1 text-xs text-neutral-400">
        오른쪽 위 <span className="font-medium">+ 새 보드</span> 버튼으로 시작하세요.
      </p>
    </section>
  );
}
