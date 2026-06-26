"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
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
  SHAPE_DISPLAY, COLOR_LABELS,
  type RecordData, type ShapeType, type ColorType,
} from "@/lib/types";
import { toast } from "sonner";
import { Clock, Pencil, Trash2 } from "lucide-react";
import { formatRecordDateTime } from "@/lib/datetime";
import { emitRecordsChanged } from "@/lib/records-events";

interface Props {
  record: RecordData;
}

export default function RecordCard({ record }: Props) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await recordsApi.delete(record.id);
      toast.success("记录已删除");
      emitRecordsChanged();
      setShowDelete(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeleting(false);
    }
  };

  const durationStr = record.duration
    ? `${Math.floor(record.duration / 60)}分${record.duration % 60}秒`
    : null;

  return (
    <>
      <Card className="group animate-fade-in-up">
        <CardContent className="p-4">
          <Link href={`/records/${record.id}`} className="block">
            {/* 顶部：时间 + 图标 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                  <Clock size={16} />
                </div>
                <span className="font-semibold text-sm">
                  {formatRecordDateTime(record.start_time)}
                </span>
              </div>
              <span className="text-2xl leading-none">
                {record.shape ? SHAPE_DISPLAY[record.shape as ShapeType]?.emoji || "💩" : "💩"}
              </span>
            </div>

            {/* 中部：属性标签 */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {durationStr && (
                <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                  {durationStr}
                </span>
              )}
              {record.shape && (
                <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary font-medium px-2.5 py-1 rounded-full">
                  {SHAPE_DISPLAY[record.shape as ShapeType]?.shortLabel || record.shape}
                </span>
              )}
              {record.color && (
                <span className="inline-flex items-center gap-1 text-xs bg-accent/15 text-accent-foreground font-medium px-2.5 py-1 rounded-full">
                  {COLOR_LABELS[record.color as ColorType]}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs bg-secondary/50 text-secondary-foreground px-2.5 py-1 rounded-full">
                {record.input_mode === "timer" ? "⏱ 计时" : "✍️ 手动"}
              </span>
            </div>

            {/* 备注 */}
            {record.notes && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {record.notes}
              </p>
            )}
          </Link>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-border/50">
            <Link href={`/records/${record.id}/edit`}>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <Pencil size={13} />
                编辑
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 size={13} />
              删除
            </Button>
          </div>
        </CardContent>
      </Card>

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
    </>
  );
}
