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


export default function StatsCharts() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    recordsApi
      .stats(days)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
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
          <p className="text-sm text-muted-foreground">暂无统计数据</p>
          <p className="text-xs text-muted-foreground/70">记录更多数据后会显示统计图表</p>
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
      {/* 范围选择 */}
      <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-full w-fit">
        {rangeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setDays(opt.value)}
            className={`px-4 py-1.5 text-sm rounded-full font-medium transition-all duration-200 ${
              days === opt.value
                ? "bg-card text-foreground shadow-sm ring-1 ring-border/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 数据汇总卡片 */}
      <StatsSummaryCards data={data.summary} />

      {/* 每日频率柱状图 */}
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
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.frequency}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.02 80)" />
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
                <Tooltip labelFormatter={freqLabelFormatter} formatter={freqTooltipFormatter} />
                <Bar dataKey="count" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
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
                <Tooltip labelFormatter={freqLabelFormatter} formatter={durationTooltipFormatter} />
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
                <Tooltip formatter={pieTooltipFormatter} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
