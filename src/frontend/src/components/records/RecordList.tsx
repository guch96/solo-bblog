"use client";

import { useEffect, useState } from "react";
import { recordsApi } from "@/lib/api";
import type { InputMode, RecordData } from "@/lib/types";
import RecordCard from "./RecordCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  defaultDate?: string;
}

export default function RecordList({ defaultDate }: Props) {
  const [records, setRecords] = useState<RecordData[] | null>(null);
  const [error, setError] = useState(false);
  const [dateFrom, setDateFrom] = useState(defaultDate ?? "");
  const [dateTo, setDateTo] = useState(defaultDate ?? "");
  const [inputMode, setInputMode] = useState<"all" | InputMode>("all");

  useEffect(() => {
    let active = true;
    const loadRecords = async () => {
      try {
        const data = await recordsApi.list({
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        });
        if (active) {
          setRecords(inputMode === "all" ? data : data.filter((r) => r.input_mode === inputMode));
          setError(false);
        }
      } catch {
        if (active) setError(true);
      }
    };
    loadRecords();
    return () => {
      active = false;
    };
  }, [dateFrom, dateTo, inputMode]);

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

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">起始日期</p>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">结束日期</p>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">录入方式</p>
              <Select value={inputMode} onValueChange={(v) => setInputMode(v as "all" | InputMode)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="manual">手动</SelectItem>
                  <SelectItem value="timer">计时</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); setInputMode("all"); }}>
              重置筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {records.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-5xl">📋</span>
            <p className="text-sm text-muted-foreground">暂无记录</p>
            <p className="text-xs text-muted-foreground/70">开始你的第一条健康记录吧</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {records.map((r, i) => (
            <div key={r.id} style={{ animationDelay: `${i * 0.06}s` }} className="animate-fade-in-up">
              <RecordCard record={r} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
