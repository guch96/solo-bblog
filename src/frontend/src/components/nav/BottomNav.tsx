"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Calendar, BarChart3, Sparkles } from "lucide-react";

const tabs = [
  { href: "/", label: "首页", icon: Home },
  { href: "/calendar", label: "日历", icon: Calendar },
  { href: "/records", label: "记录", icon: FileText },
  { href: "/stats", label: "统计", icon: BarChart3 },
  { href: "/analysis", label: "AI 分析", icon: Sparkles },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around h-16 pb-[env(safe-area-inset-bottom,0px)]">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 min-w-0 px-2 py-1 relative group"
            >
              <div
                className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300 ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 2}
                  className="transition-all duration-300"
                />
              </div>
              <span
                className={`text-[10px] leading-none transition-colors duration-300 ${
                  active ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
