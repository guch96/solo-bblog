"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { recordsApi } from "@/lib/api";
import {
  SHAPE_LABELS, COLOR_LABELS, SMELL_LABELS, COMFORT_LABELS,
  type RecordData, type ShapeType, type ColorType, type SmellType, type ComfortType,
} from "@/lib/types";
import { toast } from "sonner";
import { ArrowLeft, Clock, Trash2 } from "lucide-react";
import { formatRecordDateTime } from "@/lib/datetime";

function Field({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null;
  icon?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground text-xs w-16 shrink-0 flex items-center gap-1">
        {icon && <span>{icon}</span>}
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default function RecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [record, setRecord] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    recordsApi
      .get(Number(params.id))
      .then(setRecord)
      .catch(() => toast.error("加载记录失败"))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await recordsApi.delete(record!.id);
      toast.success("记录已删除");
      router.push("/records");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeleting(false);
    }
  };

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
        <p className="text-muted-foreground text-sm">记录不存在</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft size={14} className="mr-1" />
          返回
        </Button>
      </div>
    );
  }

  const durationStr = record.duration
    ? `${Math.floor(record.duration / 60)}分${record.duration % 60}秒`
    : null;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-xl font-bold">记录详情</h1>
        </div>
      </div>

      {/* 详情卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock size={16} className="text-primary" />
            {formatRecordDateTime(record.start_time)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <Field label="结束时间" value={record.end_time ? formatRecordDateTime(record.end_time) : null} icon="🏁" />
          <Field label="时长" value={durationStr} icon="⏱" />
          <Field
            label="形状"
            value={record.shape ? SHAPE_LABELS[record.shape as ShapeType] : null}
            icon="💩"
          />
          <Field
            label="颜色"
            value={record.color ? COLOR_LABELS[record.color as ColorType] : null}
            icon="🎨"
          />
          <Field
            label="气味"
            value={record.smell ? SMELL_LABELS[record.smell as SmellType] : null}
            icon="👃"
          />
          <Field
            label="感受"
            value={record.comfort ? COMFORT_LABELS[record.comfort as ComfortType] : null}
            icon="💪"
          />
          <Field label="备注" value={record.notes} icon="📝" />
          <div className="flex items-center gap-3 py-2.5">
            <span className="text-muted-foreground text-xs w-16 shrink-0">方式</span>
            <span className="inline-flex items-center gap-1 text-xs bg-secondary/50 text-secondary-foreground font-medium px-2.5 py-1 rounded-full">
              {record.input_mode === "timer" ? "⏱ 计时器" : "✍️ 手动"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <Link href={`/records/${record.id}/edit`} className="flex-1">
          <Button variant="outline" className="w-full">
            编辑
          </Button>
        </Link>
        <Button
          variant="destructive"
          onClick={() => setShowDelete(true)}
          className="flex-1 gap-1"
        >
          <Trash2 size={16} />
          删除
        </Button>
      </div>

      {/* 删除确认弹窗 */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              这条记录将被永久删除，无法恢复。确定要继续吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)} disabled={deleting}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
