"use client";

import { useEffect, useState } from "react";
import { recordsApi } from "@/lib/api";
import { SHAPE_LABELS, type RecordData, type ShapeType } from "@/lib/types";
import RecordCard from "./RecordCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Filter, RotateCcw, CalendarDays, Sparkles, Check, ChevronDown } from "lucide-react";
import { getLocalDateDaysAgoString, getLocalTodayString } from "@/lib/datetime";
import { RECORDS_CHANGED_EVENT } from "@/lib/records-events";

interface Props {
  defaultDate?: string;
}

const SHAPE_FILTER_OPTIONS: { key: ShapeType; emoji: string; shortLabel: string }[] = [
  { key: "1", emoji: "🪨", shortLabel: "硬块状" },
  { key: "2", emoji: "🥜", shortLabel: "香肠状" },
  { key: "3", emoji: "🌭", shortLabel: "条状裂纹" },
  { key: "4", emoji: "🍌", shortLabel: "光滑条状" },
  { key: "5", emoji: "🍇", shortLabel: "软团状" },
  { key: "6", emoji: "🥞", shortLabel: "糊状" },
  { key: "7", emoji: "💧", shortLabel: "水样状" },
];

const DATE_SHORTCUTS = [
  { key: "today", label: "今天", getValue: () => ({ dateFrom: getLocalTodayString(), dateTo: getLocalTodayString() }) },
  { key: "week", label: "近7天", getValue: () => ({ dateFrom: getLocalDateDaysAgoString(6), dateTo: getLocalTodayString() }) },
  { key: "clear", label: "清空日期", getValue: () => ({ dateFrom: "", dateTo: "" }) },
] as const;

export default function RecordList({ defaultDate }: Props) {
  const [records, setRecords] = useState<RecordData[] | null>(null);
  const [error, setError] = useState(false);
  const [dateFrom, setDateFrom] = useState(defaultDate ?? "");
  const [dateTo, setDateTo] = useState(defaultDate ?? "");
  const [shapeFilter, setShapeFilter] = useState<ShapeType | "">("");
  const [activeDateShortcut, setActiveDateShortcut] = useState<string>(defaultDate ? "today" : "");
  const [showFilters, setShowFilters] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 640;
  });

  useEffect(() => {
    let active = true;
    const loadRecords = async () => {
      try {
        const data = await recordsApi.list({
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        });

        const filteredData = shapeFilter
          ? data.filter((record) => record.shape === shapeFilter)
          : data;

        if (active) {
          setRecords(filteredData);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      }
    };

    loadRecords();

    const handleRecordsChanged = () => {
      loadRecords();
    };

    window.addEventListener(RECORDS_CHANGED_EVENT, handleRecordsChanged);
    return () => {
      active = false;
      window.removeEventListener(RECORDS_CHANGED_EVENT, handleRecordsChanged);
    };
  }, [dateFrom, dateTo, shapeFilter]);

  const resetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setShapeFilter("");
    setActiveDateShortcut("");
  };

  const hasActiveFilters = Boolean(dateFrom || dateTo || shapeFilter);

  const applyDateShortcut = (shortcutKey: (typeof DATE_SHORTCUTS)[number]["key"]) => {
    const shortcut = DATE_SHORTCUTS.find((item) => item.key === shortcutKey);
    if (!shortcut) return;
    const next = shortcut.getValue();
    setDateFrom(next.dateFrom);
    setDateTo(next.dateTo);
    setActiveDateShortcut(shortcutKey === "clear" ? "" : shortcutKey);
  };

  if (error) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-5xl">⚠️</span>
          <p className="text-sm text-muted-foreground">加载记录失败</p>
          <p className="text-xs text-muted-foreground/70">请确认后端服务已启动</p>
        </CardContent>
      </Card>
    );
  }

  if (!records) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-sm text-muted-foreground">加载中...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.03] shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-[11px] font-medium text-primary">
                <Filter size={12} />
                记录筛选
              </div>
              <p className="text-xs text-muted-foreground">
                按日期范围和便便形状快速缩小结果
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw size={13} />
                重置
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFilters((prev) => !prev)}
                className="h-8 rounded-full px-3 text-xs sm:hidden"
              >
                {showFilters ? "收起" : "展开"}
                <ChevronDown
                  size={13}
                  className={cn("transition-transform duration-200", showFilters && "rotate-180")}
                />
              </Button>
            </div>
          </div>

          {!showFilters && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-border/60 bg-background/55 px-3 py-3 sm:hidden">
              <span className="text-[11px] font-medium text-muted-foreground">当前筛选</span>
              {hasActiveFilters ? (
                <>
                  {(dateFrom || dateTo) && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] text-primary">
                      {dateFrom || "不限"} ~ {dateTo || "不限"}
                    </span>
                  )}
                  {shapeFilter && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] text-primary">
                      {SHAPE_LABELS[shapeFilter].split("（")[0]}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[11px] text-muted-foreground">未设置筛选条件</span>
              )}
            </div>
          )}

          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-out",
              showFilters ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0 sm:max-h-[520px] sm:opacity-100"
            )}
          >
            <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/50 bg-background/80 px-3 py-3 shadow-xs">
                <div className="flex items-center gap-2 mb-2 text-[11px] font-medium text-muted-foreground">
                  <CalendarDays size={13} />
                  起始日期
                </div>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setActiveDateShortcut("");
                  }}
                  className="h-10 rounded-xl border-border/50 bg-transparent text-sm"
                />
              </div>

              <div className="rounded-2xl border border-border/50 bg-background/80 px-3 py-3 shadow-xs">
                <div className="flex items-center gap-2 mb-2 text-[11px] font-medium text-muted-foreground">
                  <CalendarDays size={13} />
                  结束日期
                </div>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setActiveDateShortcut("");
                  }}
                  className="h-10 rounded-xl border-border/50 bg-transparent text-sm"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {DATE_SHORTCUTS.map((shortcut) => {
                const selected = activeDateShortcut === shortcut.key;
                return (
                  <button
                    key={shortcut.key}
                    type="button"
                    onClick={() => applyDateShortcut(shortcut.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all duration-200",
                      selected
                        ? "border-primary/35 bg-primary/10 text-primary shadow-sm shadow-primary/10"
                        : "border-border/50 bg-background/70 text-muted-foreground hover:border-primary/20 hover:text-foreground"
                    )}
                  >
                    {selected && <Sparkles size={11} />}
                    {shortcut.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-[11px] font-medium text-muted-foreground">形状筛选</p>
                {shapeFilter && (
                  <span className="text-[11px] text-primary">
                    当前：{SHAPE_LABELS[shapeFilter].split("（")[0]}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SHAPE_FILTER_OPTIONS.map((option) => {
                  const selected = shapeFilter === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setShapeFilter(selected ? "" : option.key)}
                      className={cn(
                        "group relative overflow-hidden rounded-2xl border px-3 py-3 text-left transition-all duration-200",
                        "bg-background/75 hover:-translate-y-0.5 hover:shadow-sm",
                        selected
                          ? "border-primary/40 bg-linear-to-br from-primary/12 via-primary/8 to-background shadow-sm shadow-primary/10 ring-1 ring-primary/10"
                          : "border-border/50 hover:border-primary/20"
                      )}
                    >
                      {selected && (
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-primary/20 via-primary to-primary/20" />
                      )}
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200",
                            selected ? "bg-primary/12 shadow-inner" : "bg-muted/40"
                          )}
                        >
                          <span className="text-lg leading-none">{option.emoji}</span>
                        </div>
                        <div className="min-w-0">
                          <div className={cn("text-xs font-semibold", selected ? "text-primary" : "text-foreground")}>
                            {option.shortLabel}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {option.key} 型
                          </div>
                        </div>
                        {selected && (
                          <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                            <Check size={11} />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {records.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-5xl">📋</span>
            <p className="text-sm font-medium text-foreground">暂无符合条件的记录</p>
            <p className="text-xs text-muted-foreground text-center max-w-[220px]">
              试试调整日期范围或切换形状筛选
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {records.map((r, i) => (
            <div key={r.id} style={{ animationDelay: `${i * 0.06}s` }} className="animate-fade-in-up">
              <RecordCard record={r} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
