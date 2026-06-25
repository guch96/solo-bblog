"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import RecordForm from "@/components/records/RecordForm";
import { recordsApi } from "@/lib/api";
import type { RecordData } from "@/lib/types";

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
        <p className="text-sm text-muted-foreground">记录不存在</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">编辑记录</h1>
      <RecordForm record={record} />
    </div>
  );
}
