import { Suspense } from "react";
import RecordForm from "@/components/records/RecordForm";
import { FilePlus2, Sparkles } from "lucide-react";

export default function NewRecordPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-[11px] font-medium text-primary">
          <FilePlus2 size={12} />
          新建记录
        </div>
        <h1 className="text-xl font-bold">新增记录</h1>
        <p className="text-sm text-muted-foreground">
          补充一次新的如厕记录，支持手动填写时间、形状、颜色和身体感受
        </p>
        <div className="inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-[11px] text-muted-foreground ring-1 ring-border/40">
          <Sparkles size={11} className="text-accent" />
          完整记录越详细，后续 AI 分析越准确
        </div>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">加载中...</span>
            </div>
          </div>
        }
      >
        <RecordForm />
      </Suspense>
    </div>
  );
}
