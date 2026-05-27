"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, ApiClientError } from "@/lib/api-client";
import { createBoardSchema, type CreateBoardInput } from "@/lib/schemas/board";

export function CreateBoardDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBoardInput>({
    resolver: zodResolver(createBoardSchema),
  });

  function close() {
    setOpen(false);
    setServerError(null);
    reset();
  }

  async function onSubmit(values: CreateBoardInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const result = await api<{ board: { id: string } }>("/api/boards", {
        method: "POST",
        body: values,
      });
      close();
      router.push(`/boards/${result.board.id}`);
      router.refresh();
    } catch (err) {
      setServerError(
        err instanceof ApiClientError ? err.message : "보드 생성에 실패했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        + 새 보드
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
            <h3 className="text-base font-semibold">새 보드 만들기</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div className="space-y-1">
                <label htmlFor="name" className="text-sm font-medium">
                  보드 이름
                </label>
                <input
                  id="name"
                  autoFocus
                  className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                  placeholder="예: 기말 프로젝트"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-red-600">{errors.name.message}</p>
                )}
              </div>

              {serverError && (
                <p role="alert" className="text-sm text-red-600">
                  {serverError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={close}
                  className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  {submitting ? "생성 중…" : "생성"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
