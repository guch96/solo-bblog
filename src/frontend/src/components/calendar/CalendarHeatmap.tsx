"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { recordsApi } from "@/lib/api";
import type { CalendarDay, RecordData } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getBeijingDateParts } from "@/lib/datetime";
import RecordCard from "@/components/records/RecordCard";

export default function CalendarHeatmap() {
  const now = getBeijingDateParts();
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [data, setData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<RecordData[] | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const todayStr = `${now.year}-${String(now.month).padStart(2, "0")}-${String(now.day).padStart(2, "0")}`;

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) setLoading(true);
    });
    recordsApi
      .calendar(monthStr)
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() => {
        if (active) setData([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
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

  useEffect(() => {
    if (!selectedDate) return;
    let active = true;
    Promise.resolve().then(() => {
      if (active) setSelectedLoading(true);
    });
    recordsApi
      .list({ date_from: selectedDate, date_to: selectedDate })
      .then((res) => {
        if (active) setSelectedRecords(res);
      })
      .catch(() => {
        if (active) setSelectedRecords([]);
      })
      .finally(() => {
        if (active) setSelectedLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedDate]);

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
              <button
                key={cell.date}
                type="button"
                onClick={() => setSelectedDate(cell.date)}
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
              </button>
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

        {selectedDate && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{selectedDate} 的记录</h3>
              <button className="text-xs text-muted-foreground" onClick={() => setSelectedDate(null)}>
                关闭
              </button>
            </div>
            {selectedLoading ? (
              <div className="text-sm text-muted-foreground">加载中...</div>
            ) : selectedRecords && selectedRecords.length > 0 ? (
              <div className="space-y-3">
                {selectedRecords.map((record) => (
                  <RecordCard key={record.id} record={record} />
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">这一天还没有记录</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
