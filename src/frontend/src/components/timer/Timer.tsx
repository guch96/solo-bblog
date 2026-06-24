"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Timer() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const startTimeRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="text-6xl font-mono font-bold tabular-nums">
        {formatTime(seconds)}
      </div>
      {isRunning ? (
        <Button
          size="lg"
          variant="destructive"
          onClick={stop}
          className="h-16 w-32 text-lg"
        >
          停止
        </Button>
      ) : (
        <Button
          size="lg"
          onClick={start}
          className="h-16 w-32 text-lg"
        >
          开始
        </Button>
      )}
    </div>
  );
}
