import Link from "next/link";

export type BoardSummary = {
  id: string;
  name: string;
  updatedAt: string;
  role: "OWNER" | "MEMBER";
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BoardCard({ board }: { board: BoardSummary }) {
  return (
    <Link
      href={`/boards/${board.id}`}
      className="block rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-neutral-400 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-600"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">{board.name}</h3>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          {board.role === "OWNER" ? "소유자" : "멤버"}
        </span>
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        마지막 활동 · {formatDate(board.updatedAt)}
      </p>
    </Link>
  );
}
