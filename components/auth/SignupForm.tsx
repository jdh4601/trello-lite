"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@/lib/auth/schemas";

export function SignupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(values: SignupInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setServerError(data?.error?.message ?? "회원가입에 실패했습니다.");
        return;
      }
      router.push("/boards");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">
          이름
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          {...register("name")}
        />
        {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
          이메일
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          {...register("email")}
        />
        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">
          비밀번호
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          {...register("password")}
        />
        <p className="text-xs text-neutral-500">영문 + 숫자 포함 최소 8자</p>
        {errors.password && (
          <p className="text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      {serverError && (
        <p role="alert" className="text-sm text-red-600">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {submitting ? "가입 중…" : "회원가입"}
      </button>
    </form>
  );
}
