"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { recordsApi } from "@/lib/api";
import type { CalendarDay } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarHeatmap() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(false);

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  useEffect(() => {
    setLoading(true);
    recordsApi
      .calendar(monthStr)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [monthStr]);

  const countMap = new Map(data.map((d) => [d.date, d.count]));
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();

  const cells: { date: string; day: number; count: number }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({
      date: dateStr,
      day: d,
      count: countMap.get(dateStr) || 0,
    });
  }

  // 平滑色阶：从极淡到主色饱和
  const getColor = (count: number) => {
    if (count === 0) return "bg-muted/50 text-foreground";
    const ratio = count / maxCount;
    if (ratio <= 0.2) return "bg-primary/15 text-foreground";
    if (ratio <= 0.4) return "bg-primary/30 text-foreground";
    if (ratio <= 0.6) return "bg-primary/50 text-primary-foreground";
    if (ratio <= 0.8) return "bg-primary/70 text-primary-foreground";
    return "bg-primary text-primary-foreground";
  };

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  const goToPrev = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const goToNext = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  return (
    <Card className="animate-fade-in-up">
      <CardContent className="p-5">
        {/* 月份选择器 */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={goToPrev}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft size={18} className="text-muted-foreground" />
          </button>
          <span className="font-bold text-base">
            {year}年{month}月
          </span>
          <button
            onClick={goToNext}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* 周标题 */}
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {weekDays.map((d, i) => (
            <div
              key={d}
              className={`text-center text-xs font-medium py-1 ${
                i === 0 || i === 6 ? "text-accent/70" : "text-muted-foreground"
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 日历格子 */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {cells.map((cell) => {
            const isToday = cell.date === todayStr;
            return (
              <Link
                key={cell.date}
                href={`/records?date=${cell.date}`}
                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-200 hover:scale-110 hover:shadow-md relative
                  ${getColor(cell.count)}
                  ${isToday ? "ring-2 ring-accent ring-offset-1 ring-offset-card" : ""}
                `}
                title={`${cell.date}: ${cell.count} 条记录`}
              >
                {cell.day}
                {isToday && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </div>

        {/* 图例 */}
        <div className="flex items-center justify-center gap-1.5 mt-5 text-xs text-muted-foreground">
          <span>少</span>
          <div className="w-3.5 h-3.5 rounded-sm bg-muted/50" />
          <div className="w-3.5 h-3.5 rounded-sm bg-primary/15" />
          <div className="w-3.5 h-3.5 rounded-sm bg-primary/30" />
          <div className="w-3.5 h-3.5 rounded-sm bg-primary/50" />
          <div className="w-3.5 h-3.5 rounded-sm bg-primary/70" />
          <div className="w-3.5 h-3.5 rounded-sm bg-primary" />
          <span>多</span>
        </div>

        {loading && (
          <div className="flex justify-center mt-4">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
