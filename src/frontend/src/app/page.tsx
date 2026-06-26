"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { recordsApi } from "@/lib/api";
import type { RecordData } from "@/lib/types";
import Timer from "@/components/timer/Timer";
import RecordCard from "@/components/records/RecordCard";
import { Plus, ArrowRight } from "lucide-react";

export default function HomePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [todayRecords, setTodayRecords] = useState<RecordData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recordsApi.list({ date_from: today, date_to: today })
      .then(setTodayRecords)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [today]);

  return (
    <div className="space-y-8">
      {/* Hero 区域：计时器 */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-primary/5 via-primary/3 to-transparent p-6 sm:p-8">
        {/* 装饰性背景圆 */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/5 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-accent/10 blur-2xl" />

        <div className="relative">
          <h2 className="text-center text-sm font-semibold text-muted-foreground mb-1 tracking-wide">
            计时记录
          </h2>
          <Timer />

          {/* 快捷入口 */}
          <div className="flex justify-center mt-2">
            <Link href="/records/new?input_mode=manual">
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-1 text-xs">
                手动记录
                <ArrowRight size={12} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 今日记录 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">今日记录</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {loading ? "加载中..." : todayRecords.length > 0 ? `共 ${todayRecords.length} 条记录` : "今天还没有记录"}
            </p>
          </div>
          <Link href="/records/new?input_mode=manual">
            <Button size="sm" className="gap-1 rounded-full">
              <Plus size={16} />
              新增
            </Button>
          </Link>
        </div>

        {loading ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
              <span className="text-sm text-muted-foreground">加载中...</span>
            </CardContent>
          </Card>
        ) : todayRecords.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
              <span className="text-5xl">🧻</span>
              <p className="text-sm text-muted-foreground">今天还没有记录</p>
              <p className="text-xs text-muted-foreground/70">
                点击上方"开始记录"或"手动记录"添加第一条记录吧
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {todayRecords.map((r, i) => (
              <div key={r.id} className="stagger-1" style={{ animationDelay: `${i * 0.08}s` }}>
                <RecordCard record={r} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 快捷跳转 */}
      {todayRecords.length > 0 && (
        <div className="flex justify-center">
          <Link href="/records">
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-1 text-xs">
              查看所有记录
              <ArrowRight size={12} />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
