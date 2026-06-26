"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import RecordForm from "@/components/records/RecordForm";
import { recordsApi } from "@/lib/api";
import type { RecordData } from "@/lib/types";
import { FilePenLine, Sparkles } from "lucide-react";

export default function EditRecordPage() {
  const params = useParams();
  const [record, setRecord] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recordsApi
      .get(Number(params.id))
      .then(setRecord)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

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

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-4xl">🔍</span>
        <p className="text-sm font-medium text-foreground">记录不存在</p>
        <p className="text-xs text-muted-foreground text-center max-w-[220px]">
          这条记录可能已被删除，或者当前账号没有访问权限
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-[11px] font-medium text-primary">
          <FilePenLine size={12} />
          编辑记录
        </div>
        <h1 className="text-xl font-bold">编辑记录</h1>
        <p className="text-sm text-muted-foreground">
          调整本次记录的细节字段，完善形状、颜色、感受和备注信息
        </p>
        <div className="inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-[11px] text-muted-foreground ring-1 ring-border/40">
          <Sparkles size={11} className="text-accent" />
          计时记录的起止时间会保持锁定，避免破坏原始计时数据
        </div>
      </div>
      <RecordForm record={record} />
    </div>
  );
}
