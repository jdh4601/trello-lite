export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-bold">FlowBoard</h1>
          <p className="text-xs text-neutral-500">실시간 협업 칸반보드</p>
        </header>
        {children}
      </div>
    </main>
  );
}
