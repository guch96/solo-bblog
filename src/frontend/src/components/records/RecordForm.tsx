"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { recordsApi } from "@/lib/api";
import {
  SHAPE_LABELS, COLOR_LABELS, SMELL_LABELS, COMFORT_LABELS, PROCESS_FEELING_LABELS,
  type RecordCreate, type RecordData, type InputMode,
  type ShapeType, type ColorType, type SmellType, type ComfortType, type ProcessFeelingType,
} from "@/lib/types";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

interface Props {
  record?: RecordData;
}

// Bristol 形状配置：表情 + 简短标签 + 描述
const SHAPE_OPTIONS: { key: ShapeType; emoji: string; label: string; desc: string }[] = [
  { key: "1", emoji: "🪨", label: "硬块状", desc: "分离的硬块，像坚果" },
  { key: "2", emoji: "🥜", label: "香肠状", desc: "块状香肠形，表面凹凸" },
  { key: "3", emoji: "🌭", label: "条状裂纹", desc: "表面有裂纹的条状" },
  { key: "4", emoji: "🍌", label: "光滑条状", desc: "光滑柔软，像香蕉" },
  { key: "5", emoji: "🍇", label: "软团状", desc: "柔软的团块，边缘清晰" },
  { key: "6", emoji: "🥞", label: "糊状", desc: "蓬松糊状，边缘模糊" },
  { key: "7", emoji: "💧", label: "水样状", desc: "完全液态，无固体" },
];

// 颜色配置：实际颜色值 + 标签
const COLOR_OPTIONS: { key: ColorType; hex: string; ring: string; label: string }[] = [
  { key: "brown", hex: "#8B6914", ring: "ring-amber-400", label: "棕色" },
  { key: "dark_brown", hex: "#3E2723", ring: "ring-stone-800", label: "深棕色" },
  { key: "yellow", hex: "#F5C842", ring: "ring-yellow-400", label: "黄色" },
  { key: "green", hex: "#6B8E23", ring: "ring-green-400", label: "绿色" },
  { key: "black", hex: "#1A1A1A", ring: "ring-gray-800", label: "黑色" },
  { key: "red", hex: "#C0392B", ring: "ring-red-400", label: "红色" },
  { key: "other", hex: "#9B59B6", ring: "ring-purple-400", label: "其他" },
];

// 气味配置：表情 + 标签
const SMELL_OPTIONS: { key: SmellType; emoji: string; label: string; desc: string }[] = [
  { key: "normal", emoji: "👃", label: "正常", desc: "普通气味" },
  { key: "strong", emoji: "😷", label: "偏臭", desc: "比平时更重" },
  { key: "odorless", emoji: "🌸", label: "无味", desc: "几乎没有气味" },
  { key: "other", emoji: "🤔", label: "其他", desc: "不寻常的气味" },
];

// 身体感受配置：表情 + 标签
const COMFORT_OPTIONS: { key: ComfortType; emoji: string; label: string; desc: string }[] = [
  { key: "comfortable", emoji: "😊", label: "舒适", desc: "顺畅无不适" },
  { key: "bloating", emoji: "🎈", label: "腹胀", desc: "肚子胀胀的" },
  { key: "pain", emoji: "😖", label: "腹痛", desc: "肚子有痛感" },
  { key: "difficulty", emoji: "😰", label: "排便困难", desc: "费力不顺畅" },
  { key: "other", emoji: "🤷", label: "其他", desc: "其他感受" },
];

// 排便过程感受配置：表情 + 标签
const PROCESS_FEELING_OPTIONS: { key: ProcessFeelingType; emoji: string; label: string; desc: string }[] = [
  { key: "smooth", emoji: "💨", label: "顺畅", desc: "一气呵成" },
  { key: "urgent", emoji: "🏃", label: "急迫", desc: "突然急需" },
  { key: "straining", emoji: "💪", label: "费力", desc: "需要用力" },
  { key: "incomplete", emoji: "🔄", label: "便不尽感", desc: "排不干净" },
  { key: "intermittent", emoji: "⏸", label: "断断续续", desc: "时断时续" },
  { key: "normal", emoji: "👌", label: "正常", desc: "没有特别" },
  { key: "other", emoji: "🤷", label: "其他", desc: "其他感受" },
];

const sectionClass = "bg-card rounded-xl p-4 space-y-3 ring-1 ring-border/30";
const sectionTitleClass = "text-sm font-semibold text-muted-foreground flex items-center gap-1.5";

export default function RecordForm({ record }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = !!record;
  const [submitting, setSubmitting] = useState(false);

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
    process_feeling: string;
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
    process_feeling: record?.process_feeling ?? "",
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
        process_feeling: (form.process_feeling as RecordCreate["process_feeling"]) || null,
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
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg animate-fade-in-up">
      {/* 时间信息 */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>
          <span>🕐</span> 时间信息
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="start_time" className="text-xs">开始时间 *</Label>
            <Input
              id="start_time"
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              required
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end_time" className="text-xs">结束时间</Label>
            <Input
              id="end_time"
              type="datetime-local"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              className="rounded-xl"
            />
          </div>
        </div>
        {form.input_mode === "timer" && form.duration && (
          <div className="flex items-center gap-2 text-sm text-primary font-medium bg-primary/5 rounded-full px-4 py-2 w-fit">
            <span>⏱</span>
            计时时长：{Math.floor(form.duration / 60)}分{form.duration % 60}秒
          </div>
        )}
      </div>

      {/* 形状 — 卡片选择器 */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>
          <span>💩</span> 布里斯托形状分类
        </h3>
        <p className="text-xs text-muted-foreground -mt-1">
          选择最接近本次便便的形状
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SHAPE_OPTIONS.map((opt) => {
            const selected = form.shape === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setForm({ ...form, shape: selected ? "" : opt.key })}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none
                  ${selected
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10 -translate-y-0.5"
                    : "border-transparent bg-muted/30 hover:bg-muted/60 hover:border-muted-foreground/20"
                  }
                  active:scale-[0.96]
                `}
              >
                <span className="text-2xl leading-none transition-transform duration-200 group-hover:scale-110">
                  {opt.emoji}
                </span>
                <span className={`text-[11px] font-semibold leading-tight ${selected ? "text-primary" : "text-foreground"}`}>
                  {opt.label}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight text-center">
                  {opt.desc}
                </span>
                {selected && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 颜色 — 圆形色盘 */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>
          <span>🎨</span> 颜色
        </h3>
        <p className="text-xs text-muted-foreground -mt-1">
          选择最接近的颜色
        </p>
        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
          {COLOR_OPTIONS.map((opt) => {
            const selected = form.color === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setForm({ ...form, color: selected ? "" : opt.key })}
                className="flex flex-col items-center gap-1.5 group cursor-pointer select-none"
              >
                {/* 色盘 */}
                <div
                  className={`relative w-11 h-11 rounded-full transition-all duration-200 shadow-sm
                    ${selected ? "ring-2 ring-offset-2 ring-primary ring-offset-background scale-110" : "ring-1 ring-border/50 hover:scale-105"}
                  `}
                  style={{ backgroundColor: opt.hex }}
                >
                  {/* 光泽效果 */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                  {selected && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </div>
                <span className={`text-[11px] font-medium leading-tight transition-colors ${selected ? "text-primary" : "text-muted-foreground"}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 气味 — 卡片选择器 */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>
          <span>👃</span> 气味
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {SMELL_OPTIONS.map((opt) => {
            const selected = form.smell === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setForm({ ...form, smell: selected ? "" : opt.key })}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none
                  ${selected
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                    : "border-transparent bg-muted/30 hover:bg-muted/60 hover:border-muted-foreground/20"
                  }
                  active:scale-[0.97]
                `}
              >
                <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
                <div className="text-left min-w-0">
                  <div className={`text-sm font-semibold ${selected ? "text-primary" : "text-foreground"}`}>
                    {opt.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{opt.desc}</div>
                </div>
                {selected && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 身体感受 — 卡片选择器 */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>
          <span>💪</span> 身体感受
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {COMFORT_OPTIONS.map((opt) => {
            const selected = form.comfort === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setForm({ ...form, comfort: selected ? "" : opt.key })}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none
                  ${selected
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10 -translate-y-0.5"
                    : "border-transparent bg-muted/30 hover:bg-muted/60 hover:border-muted-foreground/20"
                  }
                  active:scale-[0.96]
                `}
              >
                <span className="text-2xl leading-none">{opt.emoji}</span>
                <span className={`text-xs font-semibold ${selected ? "text-primary" : "text-foreground"}`}>
                  {opt.label}
                </span>
                {selected && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 排便过程感受 — 卡片选择器 */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>
          <span>🚽</span> 排便过程感受
        </h3>
        <p className="text-xs text-muted-foreground -mt-1">
          选择最接近本次排便过程的体验
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PROCESS_FEELING_OPTIONS.map((opt) => {
            const selected = form.process_feeling === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setForm({ ...form, process_feeling: selected ? "" : opt.key })}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none
                  ${selected
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10 -translate-y-0.5"
                    : "border-transparent bg-muted/30 hover:bg-muted/60 hover:border-muted-foreground/20"
                  }
                  active:scale-[0.96]
                `}
              >
                <span className="text-2xl leading-none">{opt.emoji}</span>
                <span className={`text-xs font-semibold ${selected ? "text-primary" : "text-foreground"}`}>
                  {opt.label}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight text-center">
                  {opt.desc}
                </span>
                {selected && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 备注 */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>
          <span>📝</span> 备注
        </h3>
        <div className="space-y-1.5">
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="今天有什么特别的？饮食？身体感受？"
            rows={3}
            className="rounded-xl resize-none"
          />
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={submitting} size="lg" className="flex-1 gap-1.5">
          <Save size={18} />
          {submitting ? "保存中..." : isEdit ? "更新记录" : "保存记录"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.back()}
          className="flex-1 gap-1.5"
        >
          <ArrowLeft size={18} />
          取消
        </Button>
      </div>
    </form>
  );
}
