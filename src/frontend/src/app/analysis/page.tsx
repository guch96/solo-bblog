"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { analysesApi } from "@/lib/api";
import type { AnalysisData } from "@/lib/types";
import AnalysisCard from "@/components/analysis/AnalysisCard";
import StreamingAnalysisCard from "@/components/analysis/StreamingAnalysisCard";
import { toast } from "sonner";
import { Sparkles, Calendar } from "lucide-react";

export default function AnalysisPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(today);
  const [analyzing, setAnalyzing] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisData[]>([]);

  useEffect(() => {
    analysesApi.list().then(setAnalyses).catch(() => {});
  }, []);

  const handleAnalyze = async () => {
    if (!dateFrom || !dateTo) {
      toast.error("请选择时间范围");
      return;
    }
    setAnalyzing(true);
    try {
      const result = await analysesApi.create({ date_from: dateFrom, date_to: dateTo });
      setAnalyses((prev) => [result, ...prev]);
      toast.success("AI 分析完成！");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "分析失败");
    } finally {
      setAnalyzing(false);
    }
  };

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
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Calendar size={16} />
            选择分析范围
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="date_from" className="text-xs">起始日期</Label>
              <Input
                id="date_from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="date_to" className="text-xs">结束日期</Label>
              <Input
                id="date_to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Button
              onClick={handleStreamAnalyze}
              disabled={analyzing || streaming}
              size="lg"
              className="gap-2 sm:shrink-0"
            >
              <Sparkles size={18} />
              {analyzing || streaming ? "分析中..." : "开始分析"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 流式分析输出 */}
      {streaming && (
        <StreamingAnalysisCard
          dateFrom={dateFrom}
          dateTo={dateTo}
          onComplete={handleStreamDone}
          onError={handleStreamError}
        />
      )}

      {/* 历史分析列表 */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">历史分析</h2>
        {analyses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
              <span className="text-5xl">🤖</span>
              <p className="text-sm text-muted-foreground">暂无分析记录</p>
              <p className="text-xs text-muted-foreground/70">选择时间范围，让 AI 为你分析肠道健康趋势</p>
            </CardContent>
          </Card>
        ) : (
          analyses.map((a) => <AnalysisCard key={a.id} analysis={a} />)
        )}
      </div>
    </div>
  );
}
