import Link from "next/link";

export type BoardSummary = {
  id: string;
  name: string;
  updatedAt: string;
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
      <h3 className="font-medium text-neutral-900 dark:text-neutral-100">{board.name}</h3>
      <p className="mt-1 text-xs text-neutral-500">
        마지막 활동 · {formatDate(board.updatedAt)}
      </p>
    </Link>
  );
}
