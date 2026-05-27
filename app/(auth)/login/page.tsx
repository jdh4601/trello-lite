import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "로그인 — FlowBoard" };
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold">로그인</h2>
      <Suspense fallback={<p className="text-sm text-neutral-500">불러오는 중…</p>}>
        <LoginForm />
      </Suspense>
      <p className="text-sm text-neutral-500 text-center">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="text-blue-600 hover:underline">
          회원가입
        </Link>
      </p>
    </section>
  );
}
