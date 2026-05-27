import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/boards");

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">FlowBoard</h1>
          <p className="text-sm text-neutral-500">실시간 협업 칸반보드</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            회원가입
          </Link>
        </div>
      </div>
    </main>
  );
}
