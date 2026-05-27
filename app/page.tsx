export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl text-center space-y-4">
        <h1 className="text-3xl font-bold">FlowBoard</h1>
        <p className="text-sm text-neutral-500">
          실시간 협업 칸반보드 — 인프라 골격 (Slice 1).
        </p>
        <p className="text-xs text-neutral-400">
          Health check: <code className="font-mono">GET /api/health</code>
        </p>
      </div>
    </main>
  );
}
