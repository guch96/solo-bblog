"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analysesApi } from "@/lib/api";
import type { AnalysisData } from "@/lib/types";
import AnalysisCard from "@/components/analysis/AnalysisCard";
import { toast } from "sonner";

export default function AnalysisPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(today);
  const [analyzing, setAnalyzing] = useState(false);
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

  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold">AI 健康分析</h1>

      {/* 分析触发区域 */}
      <div className="border rounded-lg p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          选择一段时间范围，AI 将分析该范围内的所有记录，给出肠道健康评估和建议。
        </p>
        <div className="flex items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="date_from">起始日期</Label>
            <Input id="date_from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date_to">结束日期</Label>
            <Input id="date_to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <Button onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? "分析中..." : "开始分析"}
          </Button>
        </div>
      </div>

      {/* 历史分析列表 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">历史分析</h2>
        {analyses.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">暂无分析记录</p>
        ) : (
          analyses.map((a) => <AnalysisCard key={a.id} analysis={a} />)
        )}
      </div>
    </div>
  );
}
