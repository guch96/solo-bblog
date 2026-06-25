"use client";

import type { StatsSummary } from "@/lib/types";

interface Props {
  data: StatsSummary | null;
}

interface CardItem {
  key: string;
  icon: string;
  label: string;
  value: (d: StatsSummary) => string | number;
}

const CARDS: CardItem[] = [
  { key: "total", icon: "📋", label: "总记录", value: (d) => d.total_count },
  { key: "week", icon: "📅", label: "本周", value: (d) => d.this_week_count },
  { key: "avg_freq", icon: "📊", label: "日均", value: (d) => d.avg_frequency_per_day },
  { key: "streak", icon: "🔥", label: "连续打卡", value: (d) => `${d.streak_days}天` },
  { key: "avg_dur", icon: "⏱", label: "平均时长", value: (d) => formatDuration(d.avg_duration_seconds) },
  { key: "longest", icon: "🐢", label: "最长时长", value: (d) => formatDuration(d.longest_duration_seconds) },
  { key: "shape", icon: "💩", label: "常见形状", value: (d) => d.most_common_shape_label || "-" },
  { key: "abnormal", icon: "⚠️", label: "异常天数", value: (d) => d.abnormal_days },
  { key: "days", icon: "📆", label: "记录天数", value: (d) => d.record_days },
];

function formatDuration(seconds: number): string {
  if (!seconds) return "-";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}分${s}秒`;
}

export default function StatsSummaryCards({ data }: Props) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {CARDS.map((card) => (
        <div
          key={card.key}
          className="bg-card rounded-xl p-4 ring-1 ring-border/30 hover:ring-border/50 hover:shadow-md transition-all duration-200 flex flex-col gap-2"
        >
          <span className="text-2xl leading-none">{card.icon}</span>
          <div>
            <div className="text-2xl font-bold text-foreground tabular-nums">
              {card.value(data)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
