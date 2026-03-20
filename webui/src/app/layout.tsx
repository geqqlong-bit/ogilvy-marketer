import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarketerClaw",
  description: "营销作战控制台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">
        <Sidebar />
        <main className="ml-[220px] min-h-screen bg-slate-50/50">
          {children}
        </main>
      </body>
    </html>
  );
}
