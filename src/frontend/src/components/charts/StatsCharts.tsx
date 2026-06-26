"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recordsApi } from "@/lib/api";
import { SHAPE_LABELS, type StatsData, type ShapeType } from "@/lib/types";
import StatsSummaryCards from "./StatsSummaryCards";
import { BarChart3, CalendarDays } from "lucide-react";
import { RECORDS_CHANGED_EVENT } from "@/lib/records-events";


export default function StatsCharts() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadStats = () => {
      Promise.resolve().then(() => {
        if (active) setLoading(true);
      });
      recordsApi
        .stats(days)
        .then((res) => {
          if (active) setData(res);
        })
        .catch(() => {
          if (active) setData(null);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    loadStats();

    const handleRecordsChanged = () => {
      loadStats();
    };

    window.addEventListener(RECORDS_CHANGED_EVENT, handleRecordsChanged);
    return () => {
      active = false;
      window.removeEventListener(RECORDS_CHANGED_EVENT, handleRecordsChanged);
    };
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">加载中...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-5xl">📊</span>
          <p className="text-sm font-medium text-foreground">暂无统计数据</p>
          <p className="text-xs text-muted-foreground text-center max-w-[220px]">
            记录更多数据后会显示统计图表
          </p>
        </CardContent>
      </Card>
    );
  }

  const freqLabelFormatter = (v: unknown) => String(v ?? "");
  const freqTooltipFormatter = (value: unknown) => [`${value} 次`, "记录次数"];

  const durationTooltipFormatter = (value: unknown) => {
    const v = Number(value ?? 0);
    const m = Math.floor(v / 60);
    const s = Math.round(v % 60);
    return [`${m}分${s}秒`, "平均时长"];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pieLabelRenderer = (props: any) => {
    const s = (props.shape ?? props.payload?.shape ?? "") as string;
    return SHAPE_LABELS[s as ShapeType]?.split("（")[0] || s || "";
  };

  const pieTooltipFormatter = (value: unknown, _name: unknown, entry: unknown) => {
    const shape = (entry as Record<string, unknown>)?.payload as Record<string, unknown> | undefined;
    return [`${value} 次`, SHAPE_LABELS[(shape?.shape ?? "") as ShapeType] || ""];
  };

  const rangeOptions = [
    { value: 7, label: "7 天" },
    { value: 14, label: "14 天" },
    { value: 30, label: "30 天" },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.03] shadow-sm">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-[11px] font-medium text-primary">
                <BarChart3 size={12} />
                统计范围
              </div>
              <p className="text-xs text-muted-foreground">
                选择一个时间窗口，查看这一阶段的排便频率、时长和形状变化
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-[11px] text-muted-foreground ring-1 ring-border/40">
              <CalendarDays size={11} />
              当前范围：近 {days} 天
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {rangeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                  days === opt.value
                    ? "border-primary/35 bg-primary/10 text-primary shadow-sm shadow-primary/10"
                    : "border-border/50 bg-background/70 text-muted-foreground hover:border-primary/20 hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 数据汇总卡片 */}
      <StatsSummaryCards data={data.summary} />

      {/* 每日频率柱状图（增强版） */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-chart-1" />
            每日记录次数
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.frequency.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">暂无数据</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.frequency} barCategoryGap="20%">
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.02 80)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => v.slice(5)}
                  tick={{ fontSize: 12, fill: "oklch(0.5 0.03 70)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "oklch(0.5 0.03 70)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(1 0 0 / 0.85)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "12px",
                    border: "1px solid oklch(0.90 0.02 80)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    padding: "10px 14px",
                  }}
                  labelFormatter={freqLabelFormatter}
                  formatter={freqTooltipFormatter}
                  cursor={{ fill: "oklch(0.95 0.02 80)", radius: 8 }}
                />
                <Bar
                  dataKey="count"
                  fill="url(#barGradient)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={48}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 时长趋势折线图 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-chart-3" />
            每日平均时长
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.avg_duration.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">暂无数据</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.avg_duration}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.02 80)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => v.slice(5)}
                  tick={{ fontSize: 12, fill: "oklch(0.5 0.03 70)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "oklch(0.5 0.03 70)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(1 0 0 / 0.85)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "12px",
                    border: "1px solid oklch(0.90 0.02 80)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    padding: "10px 14px",
                  }}
                  labelFormatter={freqLabelFormatter}
                  formatter={durationTooltipFormatter}
                />
                <Line
                  type="monotone"
                  dataKey="avg_seconds"
                  stroke="var(--chart-3)"
                  strokeWidth={2.5}
                  dot={{ fill: "var(--chart-3)", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "var(--chart-3)", stroke: "var(--card)", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 形状分布饼图 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-chart-5" />
            布里斯托分类分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.shape_distribution.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">暂无数据</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={data.shape_distribution}
                  dataKey="count"
                  nameKey="shape"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={50}
                  label={pieLabelRenderer}
                  labelLine={{ stroke: "oklch(0.5 0.03 70)", strokeWidth: 1 }}
                >
                  {data.shape_distribution.map((_, i) => (
                    <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "oklch(1 0 0 / 0.85)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "12px",
                    border: "1px solid oklch(0.90 0.02 80)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    padding: "10px 14px",
                  }}
                  formatter={pieTooltipFormatter}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
