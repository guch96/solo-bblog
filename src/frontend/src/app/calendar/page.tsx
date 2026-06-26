import CalendarHeatmap from "@/components/calendar/CalendarHeatmap";
import { CalendarDays, Sparkles } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-[11px] font-medium text-primary">
          <CalendarDays size={12} />
          记录日历
        </div>
        <h1 className="text-xl font-bold">日历视图</h1>
        <p className="text-sm text-muted-foreground">
          用热力日历快速查看记录密度，点选某一天可直接展开当天记录
        </p>
        <div className="inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-[11px] text-muted-foreground ring-1 ring-border/40">
          <Sparkles size={11} className="text-accent" />
          颜色越深，代表当天记录越多
        </div>
      </div>
      <CalendarHeatmap />
    </div>
  );
}
