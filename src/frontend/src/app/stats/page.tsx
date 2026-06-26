import StatsCharts from "@/components/charts/StatsCharts";
import { BarChart3, Sparkles } from "lucide-react";

export default function StatsPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-[11px] font-medium text-primary">
          <BarChart3 size={12} />
          健康统计
        </div>
        <h1 className="text-xl font-bold">数据统计</h1>
        <p className="text-sm text-muted-foreground">
          从频率、时长和布里斯托形状分布三个维度观察你的排便趋势
        </p>
        <div className="inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-[11px] text-muted-foreground ring-1 ring-border/40">
          <Sparkles size={11} className="text-accent" />
          切换时间范围可快速查看短期和长期变化
        </div>
      </div>
      <StatsCharts />
    </div>
  );
}
