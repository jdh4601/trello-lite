import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LogoutButton } from "@/components/auth/LogoutButton";

export const dynamic = "force-dynamic";

export default async function BoardsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">내 보드</h1>
            <p className="text-sm text-neutral-500">
              {user.name} ({user.email})
            </p>
          </div>
          <LogoutButton />
        </header>
        <section className="rounded border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-500">
            보드 목록은 다음 슬라이스(TRE-3)에서 구현됩니다.
          </p>
        </section>
      </div>
    </main>
  );
}
