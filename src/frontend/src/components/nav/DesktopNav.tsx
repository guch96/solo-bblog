"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/calendar", label: "日历" },
  { href: "/records", label: "记录" },
  { href: "/stats", label: "统计" },
  { href: "/analysis", label: "AI 分析" },
];

export default function DesktopNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="hidden md:block border-b sticky top-0 bg-background/80 backdrop-blur-xl z-50">
      <nav className="container max-w-2xl mx-auto flex items-center h-14 px-5">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-lg mr-8 shrink-0">
          <span className="text-xl">💩</span>
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            PoopTracker
          </span>
        </Link>
        <div className="flex gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
