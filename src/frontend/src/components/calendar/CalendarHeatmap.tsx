"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { recordsApi } from "@/lib/api";
import type { CalendarDay } from "@/lib/types";

export default function CalendarHeatmap() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(false);

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

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

  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-100 dark:bg-gray-800";
    const ratio = count / maxCount;
    if (ratio <= 0.25) return "bg-green-200";
    if (ratio <= 0.5) return "bg-green-400";
    if (ratio <= 0.75) return "bg-green-600";
    return "bg-green-800";
  };

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="max-w-md mx-auto">
      {/* 月份选择器 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            if (month === 1) { setMonth(12); setYear((y) => y - 1); }
            else setMonth((m) => m - 1);
          }}
          className="text-sm px-3 py-1 border rounded hover:bg-accent"
        >
          上个月
        </button>
        <span className="font-semibold text-lg">{year}年{month}月</span>
        <button
          onClick={() => {
            if (month === 12) { setMonth(1); setYear((y) => y + 1); }
            else setMonth((m) => m + 1);
          }}
          className="text-sm px-3 py-1 border rounded hover:bg-accent"
        >
          下个月
        </button>
      </div>

      {/* 周标题 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-xs text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* 日历格子 */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {cells.map((cell) => (
          <Link
            key={cell.date}
            href={`/records?date=${cell.date}`}
            className={`aspect-square rounded flex items-center justify-center text-sm
              ${getColor(cell.count)}
              ${cell.count > 0 ? "text-white font-medium" : "text-foreground"}
              hover:ring-2 ring-primary transition-all`}
            title={`${cell.date}: ${cell.count} 条记录`}
          >
            {cell.day}
          </Link>
        ))}
      </div>

      {loading && (
        <p className="text-center text-muted-foreground mt-4">加载中...</p>
      )}
    </div>
  );
}
