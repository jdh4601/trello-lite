"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { flush, pendingCount } from "@/lib/offline/queue";

/**
 * Header chip that surfaces the current online/offline status and the size
 * of the offline mutation queue. Mounts the global "online" handler that
 * drains the queue on reconnect.
 */
export function OfflineIndicator() {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    setOnline(navigator.onLine);
    refreshCount();

    async function refreshCount() {
      setPending(await pendingCount());
    }

    async function onOnline() {
      setOnline(true);
      const result = await flush();
      await refreshCount();
      if (result.conflicts > 0) {
        alert(
          `오프라인 변경 중 ${result.conflicts}건이 서버와 충돌했습니다. 보드를 새로 불러옵니다.`,
        );
      }
      // Re-fetch the page so we apply whatever the server now says.
      router.refresh();
    }

    function onOffline() {
      setOnline(false);
    }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // Poll occasionally so the badge stays accurate after offline writes.
    const interval = window.setInterval(refreshCount, 2000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.clearInterval(interval);
    };
  }, [router]);

  if (online && pending === 0) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-950/50 dark:text-green-300"
        title="실시간 연결됨"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        온라인
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
      title={online ? "보낼 변경이 큐에 있습니다" : "네트워크 끊김 — 작업은 로컬에 저장됩니다"}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${online ? "bg-amber-500" : "bg-red-500"}`}
      />
      {online ? `동기화 중 (${pending})` : `오프라인${pending ? ` · ${pending}건 대기` : ""}`}
    </span>
  );
}
