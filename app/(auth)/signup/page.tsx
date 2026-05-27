import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = { title: "회원가입 — FlowBoard" };

export default function SignupPage() {
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold">회원가입</h2>
      <SignupForm />
      <p className="text-sm text-neutral-500 text-center">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          로그인
        </Link>
      </p>
    </section>
  );
}
