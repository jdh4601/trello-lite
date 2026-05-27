import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowBoard — 실시간 협업 칸반보드",
  description:
    "Trello-lite. Real-time collaborative Kanban built with Next.js, Prisma, and Socket.IO.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
