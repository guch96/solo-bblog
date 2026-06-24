"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recordsApi } from "@/lib/api";
import {
  SHAPE_LABELS, COLOR_LABELS, SMELL_LABELS, COMFORT_LABELS,
  type RecordCreate, type RecordData, type InputMode,
} from "@/lib/types";
import { toast } from "sonner";

interface Props {
  record?: RecordData; // 编辑模式时传入已有记录
}

export default function RecordForm({ record }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = !!record;
  const [submitting, setSubmitting] = useState(false);

  // 计时器模式：从 URL 参数读取预设值
  const timerData = !isEdit
    ? {
        start_time: searchParams.get("start_time") || "",
        end_time: searchParams.get("end_time") || "",
        duration: searchParams.get("duration") || "",
        input_mode: (searchParams.get("input_mode") as InputMode) || "manual",
      }
    : null;

  interface FormState {
    start_time: string;
    end_time: string;
    duration: number | null;
    shape: string;
    color: string;
    smell: string;
    comfort: string;
    notes: string;
    input_mode: string;
  }

  const [form, setForm] = useState<FormState>({
    start_time: record?.start_time?.slice(0, 16) ?? timerData?.start_time?.slice(0, 16) ?? "",
    end_time: record?.end_time?.slice(0, 16) ?? timerData?.end_time?.slice(0, 16) ?? "",
    duration: record?.duration ?? (timerData?.duration ? Number(timerData.duration) : null),
    shape: record?.shape ?? "",
    color: record?.color ?? "",
    smell: record?.smell ?? "",
    comfort: record?.comfort ?? "",
    notes: record?.notes ?? "",
    input_mode: record?.input_mode ?? timerData?.input_mode ?? "manual",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.start_time) {
      toast.error("请填写开始时间");
      return;
    }

    setSubmitting(true);
    try {
      const data: RecordCreate = {
        start_time: new Date(form.start_time).toISOString(),
        end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
        duration: form.duration,
        shape: (form.shape as RecordCreate["shape"]) || null,
        color: (form.color as RecordCreate["color"]) || null,
        smell: (form.smell as RecordCreate["smell"]) || null,
        comfort: (form.comfort as RecordCreate["comfort"]) || null,
        notes: form.notes || null,
        input_mode: form.input_mode as InputMode,
      };

      if (isEdit) {
        await recordsApi.update(record!.id, data);
        toast.success("记录已更新");
      } else {
        await recordsApi.create(data);
        toast.success("记录已保存");
      }
      router.push("/records");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">开始时间 *</Label>
          <Input
            id="start_time"
            type="datetime-local"
            value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time">结束时间</Label>
          <Input
            id="end_time"
            type="datetime-local"
            value={form.end_time}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
          />
        </div>
      </div>

      {form.input_mode === "timer" && form.duration && (
        <div className="text-sm text-muted-foreground">
          计时时长：{Math.floor(form.duration / 60)}分{form.duration % 60}秒
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* 布里斯托形状 */}
        <div className="space-y-2">
          <Label>形状（布里斯托分类）</Label>
          <Select
            value={form.shape as string}
            onValueChange={(v) => setForm({ ...form, shape: v ?? "" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择形状" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SHAPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 颜色 */}
        <div className="space-y-2">
          <Label>颜色</Label>
          <Select
            value={form.color as string}
            onValueChange={(v) => setForm({ ...form, color: v ?? "" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择颜色" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(COLOR_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 气味 */}
        <div className="space-y-2">
          <Label>气味</Label>
          <Select
            value={form.smell as string}
            onValueChange={(v) => setForm({ ...form, smell: v ?? "" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择气味" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SMELL_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 身体感受 */}
        <div className="space-y-2">
          <Label>身体感受</Label>
          <Select
            value={form.comfort as string}
            onValueChange={(v) => setForm({ ...form, comfort: v ?? "" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择感受" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(COMFORT_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">备注</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="其他想记录的内容..."
          rows={3}
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? "保存中..." : isEdit ? "更新记录" : "保存记录"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
        >
          取消
        </Button>
      </div>
    </form>
  );
}
