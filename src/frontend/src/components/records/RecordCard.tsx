"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { recordsApi } from "@/lib/api";
import { SHAPE_LABELS, COLOR_LABELS, type RecordData, type ShapeType, type ColorType } from "@/lib/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  record: RecordData;
}

export default function RecordCard({ record }: Props) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("确定删除这条记录？")) return;
    try {
      await recordsApi.delete(record.id);
      toast.success("记录已删除");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const durationStr = record.duration
    ? `${Math.floor(record.duration / 60)}分${record.duration % 60}秒`
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <Link href={`/records/${record.id}`} className="flex-1">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-medium">
                {formatTime(record.start_time)}
              </span>
              {durationStr && (
                <span className="text-muted-foreground">{durationStr}</span>
              )}
              {record.shape && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {SHAPE_LABELS[record.shape as ShapeType]?.split("（")[0] || record.shape}
                </span>
              )}
              {record.color && (
                <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full">
                  {COLOR_LABELS[record.color as ColorType]}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {record.input_mode === "timer" ? "计时" : "手动"}
              </span>
            </div>
            {record.notes && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {record.notes}
              </p>
            )}
          </Link>
          <div className="flex gap-1 ml-2">
            <Link href={`/records/${record.id}/edit`}>
              <Button variant="ghost" size="sm">
                编辑
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              删除
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
