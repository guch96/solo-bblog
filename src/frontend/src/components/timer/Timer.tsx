"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";

export default function Timer() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const startTimeRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const start = useCallback(() => {
    setIsRunning(true);
    startTimeRef.current = new Date().toISOString();
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);

    const endTime = new Date().toISOString();
    const params = new URLSearchParams({
      start_time: startTimeRef.current!,
      end_time: endTime,
      duration: String(seconds),
      input_mode: "timer",
    });
    router.push(`/records/new?${params.toString()}`);
  }, [seconds, router]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (!mounted) {
    return (
      <div className="flex flex-col items-center gap-6 py-10">
        <div className="text-5xl sm:text-6xl font-bold tabular-nums text-muted-foreground/30">
          00:00
        </div>
        <Button size="xl" className="gap-2 min-w-[140px] opacity-50" disabled>
          <Play size={22} />
          开始
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8 sm:py-10">
      {/* 计时器数字 */}
      <div className="relative">
        {/* 背景光环 */}
        <div
          className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 ${
            isRunning
              ? "bg-primary/20 scale-150 animate-pulse"
              : "bg-primary/5 scale-100"
          }`}
        />
        {/* 时间显示 */}
        <div
          className={`relative text-5xl sm:text-6xl font-bold tabular-nums tracking-tight transition-colors duration-300 ${
            isRunning ? "text-primary" : "text-foreground"
          }`}
        >
          {formatTime(seconds)}
        </div>
      </div>

      {/* 状态标签 */}
      <div
        className={`text-xs font-medium px-3 py-1 rounded-full transition-all duration-300 ${
          isRunning
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isRunning ? "正在记录中..." : "准备开始记录"}
      </div>

      {/* 按钮 */}
      {isRunning ? (
        <Button
          size="xl"
          variant="destructive"
          onClick={stop}
          className="gap-2 min-w-[140px] animate-fade-in"
        >
          <Square size={20} />
          停止记录
        </Button>
      ) : (
        <Button
          size="xl"
          onClick={start}
          className="gap-2 min-w-[140px] animate-pulse-ring animate-fade-in"
        >
          <Play size={22} />
          开始记录
        </Button>
      )}
    </div>
  );
}
