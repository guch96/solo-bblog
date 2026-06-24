"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { recordsApi } from "@/lib/api";
import {
  SHAPE_LABELS, COLOR_LABELS, SMELL_LABELS, COMFORT_LABELS,
  type RecordData, type ShapeType, type ColorType, type SmellType, type ComfortType,
} from "@/lib/types";
import { toast } from "sonner";

export default function RecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [record, setRecord] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recordsApi
      .get(Number(params.id))
      .then(setRecord)
      .catch(() => toast.error("加载记录失败"))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm("确定删除这条记录？")) return;
    try {
      await recordsApi.delete(record!.id);
      toast.success("记录已删除");
      router.push("/records");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    }
  };

  if (loading) {
    return <p className="text-center text-muted-foreground py-12">加载中...</p>;
  }

  if (!record) {
    return <p className="text-center text-muted-foreground py-12">记录不存在</p>;
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const durationStr = record.duration
    ? `${Math.floor(record.duration / 60)}分${record.duration % 60}秒`
    : null;

  // 字段显示行组件
  const Field = ({ label, value }: { label: string; value: string | null }) =>
    value ? (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground w-20 shrink-0">{label}</span>
        <span>{value}</span>
      </div>
    ) : null;

  return (
    <div className="container max-w-lg mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">记录详情</h1>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          返回
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{formatTime(record.start_time)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="结束时间" value={record.end_time ? formatTime(record.end_time) : null} />
          <Field label="时长" value={durationStr} />
          <Field
            label="形状"
            value={record.shape ? SHAPE_LABELS[record.shape as ShapeType] : null}
          />
          <Field
            label="颜色"
            value={record.color ? COLOR_LABELS[record.color as ColorType] : null}
          />
          <Field
            label="气味"
            value={record.smell ? SMELL_LABELS[record.smell as SmellType] : null}
          />
          <Field
            label="感受"
            value={record.comfort ? COMFORT_LABELS[record.comfort as ComfortType] : null}
          />
          <Field label="备注" value={record.notes} />
          <div className="flex items-center gap-2 text-sm pt-2">
            <span className="text-muted-foreground w-20 shrink-0">记录方式</span>
            <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full">
              {record.input_mode === "timer" ? "计时器" : "手动"}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Link href={`/records/${record.id}/edit`} className="flex-1">
          <Button variant="outline" className="w-full">
            编辑
          </Button>
        </Link>
        <Button variant="destructive" onClick={handleDelete} className="flex-1">
          删除
        </Button>
      </div>
    </div>
  );
}
