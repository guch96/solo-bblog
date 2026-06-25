import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import BottomNav from "@/components/nav/BottomNav";
import DesktopNav from "@/components/nav/DesktopNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "PoopTracker - 便便健康记录",
  description: "记录每日如厕情况，AI 分析健康建议",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased pb-20 md:pb-0">
        <DesktopNav />
        <main className="container max-w-2xl mx-auto px-5 py-6 md:py-8">
          {children}
        </main>
        <BottomNav />
        <Toaster />
      </body>
    </html>
  );
}
