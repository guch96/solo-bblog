import type { Metadata } from "next";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "PoopTracker - 便便健康记录",
  description: "记录每日如厕情况，AI 分析健康建议",
};

const navItems = [
  { href: "/", label: "首页" },
  { href: "/records", label: "记录" },
  { href: "/calendar", label: "日历" },
  { href: "/stats", label: "统计" },
  { href: "/analysis", label: "AI 分析" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background antialiased">
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
          <nav className="container max-w-2xl mx-auto flex items-center gap-6 h-14">
            <Link href="/" className="font-bold text-lg">
              PoopTracker
            </Link>
            <div className="flex gap-4 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
