"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { recordsApi } from "@/lib/api";
import { SHAPE_LABELS, type StatsData, type ShapeType } from "@/lib/types";

const COLORS = ["#f87171", "#fb923c", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa", "#f472b6"];

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
    return <p className="text-center text-muted-foreground py-12">加载中...</p>;
  }

  if (!data) {
    return <p className="text-center text-muted-foreground py-12">暂无统计数据</p>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const freqLabelFormatter = (v: any) => String(v ?? "");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const freqTooltipFormatter = (value: any) => [`${value} 次`, "记录次数"];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const durationTooltipFormatter = (value: any) => {
    const v = Number(value ?? 0);
    const m = Math.floor(v / 60);
    const s = Math.round(v % 60);
    return [`${m}分${s}秒`, "平均时长"];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pieLabelRenderer = (props: any) => {
    const s = props.shape ?? props.payload?.shape;
    return `${SHAPE_LABELS[s as ShapeType]?.split("（")[0] || s} (${props.count ?? props.payload?.count})`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pieTooltipFormatter = (value: any, _name: any, entry: any) => {
    const shape = entry?.payload?.shape;
    return [`${value} 次`, SHAPE_LABELS[shape as ShapeType] || shape];
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">统计范围：</span>
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 text-sm rounded border transition-colors ${
              days === d ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            {d} 天
          </button>
        ))}
      </div>

      {/* 频率柱状图 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">每日记录次数</h3>
        {data.frequency.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.frequency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} />
              <YAxis allowDecimals={false} />
              <Tooltip labelFormatter={freqLabelFormatter} formatter={freqTooltipFormatter} />
              <Bar dataKey="count" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 时长趋势折线图 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">每日平均时长（秒）</h3>
        {data.avg_duration.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.avg_duration}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} />
              <YAxis />
              <Tooltip labelFormatter={freqLabelFormatter} formatter={durationTooltipFormatter} />
              <Line type="monotone" dataKey="avg_seconds" stroke="#60a5fa" strokeWidth={2} dot={{ fill: "#60a5fa" }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 形状分布饼图 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">布里斯托分类分布</h3>
        {data.shape_distribution.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie data={data.shape_distribution} dataKey="count" nameKey="shape" cx="50%" cy="50%" outerRadius={120} label={pieLabelRenderer}>
                {data.shape_distribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={pieTooltipFormatter} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
