"use client";

import { useState, useEffect } from "react";
import { recordsApi } from "@/lib/api";
import type { RecordData } from "@/lib/types";
import RecordCard from "./RecordCard";
import { Card, CardContent } from "@/components/ui/card";

export default function RecordList() {
  const [records, setRecords] = useState<RecordData[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    recordsApi.list()
      .then(setRecords)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-5xl">⚠️</span>
          <p className="text-sm text-muted-foreground">加载记录失败</p>
          <p className="text-xs text-muted-foreground/70">请确认后端服务已启动</p>
        </CardContent>
      </Card>
    );
  }

  if (!records) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-sm text-muted-foreground">加载中...</span>
        </CardContent>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-5xl">📋</span>
          <p className="text-sm text-muted-foreground">暂无记录</p>
          <p className="text-xs text-muted-foreground/70">开始你的第一条健康记录吧</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((r, i) => (
        <div key={r.id} style={{ animationDelay: `${i * 0.06}s` }} className="animate-fade-in-up">
          <RecordCard record={r} />
        </div>
      ))}
    </div>
  );
}
