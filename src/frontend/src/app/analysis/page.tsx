"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { analysesApi } from "@/lib/api";
import type { AnalysisData } from "@/lib/types";
import AnalysisCard from "@/components/analysis/AnalysisCard";
import StreamingAnalysisCard from "@/components/analysis/StreamingAnalysisCard";
import { toast } from "sonner";
import { Sparkles, Calendar, Filter, CalendarDays, History, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLocalDateDaysAgoString, getLocalTodayString } from "@/lib/datetime";
import { RECORDS_CHANGED_EVENT } from "@/lib/records-events";

const ANALYSIS_SHORTCUTS = [
  { key: "today", label: "今天", getValue: () => ({ dateFrom: getLocalTodayString(), dateTo: getLocalTodayString() }) },
  { key: "week", label: "近7天", getValue: () => ({ dateFrom: getLocalDateDaysAgoString(6), dateTo: getLocalTodayString() }) },
  { key: "two-weeks", label: "近14天", getValue: () => ({ dateFrom: getLocalDateDaysAgoString(13), dateTo: getLocalTodayString() }) },
  { key: "month", label: "近30天", getValue: () => ({ dateFrom: getLocalDateDaysAgoString(29), dateTo: getLocalTodayString() }) },
] as const;

export default function AnalysisPage() {
  const today = getLocalTodayString();
  const [dateFrom, setDateFrom] = useState(getLocalDateDaysAgoString(7));
  const [dateTo, setDateTo] = useState(today);
  const [streaming, setStreaming] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisData[]>([]);
  const [activeShortcut, setActiveShortcut] = useState<string>("week");
  const streamingSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    const loadAnalyses = async () => {
      try {
        const data = await analysesApi.list();
        if (active) setAnalyses(data);
      } catch {
        // no-op
      }
    };

    loadAnalyses();

    const handleRecordsChanged = () => {
      if (!streaming) {
        loadAnalyses();
      }
    };

    window.addEventListener(RECORDS_CHANGED_EVENT, handleRecordsChanged);
    return () => {
      active = false;
      window.removeEventListener(RECORDS_CHANGED_EVENT, handleRecordsChanged);
    };
  }, [streaming]);

  const handleStreamAnalyze = async () => {
    if (!dateFrom || !dateTo) {
      toast.error("请选择时间范围");
      return;
    }
    setStreaming(true);
  };

  const handleStreamDone = () => {
    setStreaming(false);
    // 流式完成后刷新分析列表
    analysesApi.list().then(setAnalyses).catch(() => {});
    toast.success("AI 分析完成！");
  };

  const handleStreamError = (err: string) => {
    setStreaming(false);
    toast.error(err);
  };

  const applyShortcut = (shortcutKey: (typeof ANALYSIS_SHORTCUTS)[number]["key"]) => {
    const shortcut = ANALYSIS_SHORTCUTS.find((item) => item.key === shortcutKey);
    if (!shortcut) return;
    const next = shortcut.getValue();
    setDateFrom(next.dateFrom);
    setDateTo(next.dateTo);
    setActiveShortcut(shortcutKey);
  };

  useEffect(() => {
    if (!streaming || !streamingSectionRef.current) return;
    streamingSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [streaming]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Sparkles size={22} className="text-accent" />
          AI 健康分析
        </h1>
        <p className="text-sm text-muted-foreground mt-1">基于你的记录数据，AI 提供肠道健康评估</p>
      </div>

      {/* 分析触发区域 */}
      <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.03] shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-[11px] font-medium text-primary">
                <Filter size={12} />
                分析范围
              </div>
              <p className="text-xs text-muted-foreground">
                先选时间范围，再让 AI 生成肠道健康分析
              </p>
            </div>
            <div className="rounded-full bg-background/70 px-3 py-1 text-[11px] text-muted-foreground">
              {dateFrom} ~ {dateTo}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {ANALYSIS_SHORTCUTS.map((shortcut) => {
              const selected = activeShortcut === shortcut.key;
              return (
                <button
                  key={shortcut.key}
                  type="button"
                  onClick={() => applyShortcut(shortcut.key)}
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/50 bg-background/80 px-3 py-3 shadow-xs">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                <CalendarDays size={13} />
                起始日期
              </div>
              <Input
                id="date_from"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setActiveShortcut("");
                }}
                className="h-10 rounded-xl border-border/50 bg-transparent text-sm"
              />
            </div>

            <div className="rounded-2xl border border-border/50 bg-background/80 px-3 py-3 shadow-xs">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                <CalendarDays size={13} />
                结束日期
              </div>
              <Input
                id="date_to"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setActiveShortcut("");
                }}
                className="h-10 rounded-xl border-border/50 bg-transparent text-sm"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-border/60 bg-background/55 px-3 py-3">
            <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
              <Calendar size={13} />
              即将分析的时间范围
            </div>
            <p className="mt-1 text-sm font-medium text-foreground">
              {dateFrom} ~ {dateTo}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleStreamAnalyze}
              disabled={streaming}
              size="lg"
              className="h-12 gap-2 rounded-full text-base font-semibold"
            >
              <Sparkles size={18} />
              {streaming ? "分析中..." : "开始分析"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              将基于所选范围内的记录生成摘要和健康建议
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 流式分析输出 */}
      {streaming && (
        <div ref={streamingSectionRef} className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowDown size={13} />
            正在生成新的分析结果，已自动定位到结果区域
          </div>
          <StreamingAnalysisCard
            dateFrom={dateFrom}
            dateTo={dateTo}
            onComplete={handleStreamDone}
            onError={handleStreamError}
          />
        </div>
      )}

      {/* 历史分析列表 */}
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <History size={18} className="text-primary" />
              历史分析
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              共 {analyses.length} 条分析记录，按时间倒序展示
            </p>
          </div>
          {analyses.length > 0 && (
            <div className="rounded-full bg-primary/8 px-3 py-1 text-[11px] font-medium text-primary">
              最新范围：{dateFrom} ~ {dateTo}
            </div>
          )}
        </div>
        {analyses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
              <span className="text-5xl">🤖</span>
              <p className="text-sm font-medium text-foreground">暂无分析记录</p>
              <p className="text-xs text-muted-foreground text-center max-w-[220px]">
                选择时间范围，让 AI 为你分析肠道健康趋势
              </p>
            </CardContent>
          </Card>
        ) : (
          analyses.map((a) => <AnalysisCard key={a.id} analysis={a} />)
        )}
      </div>
    </div>
  );
}
