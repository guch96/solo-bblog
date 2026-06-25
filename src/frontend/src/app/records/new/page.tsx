import { Suspense } from "react";
import RecordForm from "@/components/records/RecordForm";

export default function NewRecordPage() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-6">新增记录</h1>
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
