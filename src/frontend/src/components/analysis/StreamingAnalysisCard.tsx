"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analysesApi } from "@/lib/api";
import { Calendar, Lightbulb, Sparkles } from "lucide-react";

interface Props {
  dateFrom: string;
  dateTo: string;
  onComplete: () => void;
  onError: (err: string) => void;
}

export default function StreamingAnalysisCard({ dateFrom, dateTo, onComplete, onError }: Props) {
  const [summary, setSummary] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const summaryRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let cancelled = false;

    analysesApi.stream(
      { date_from: dateFrom, date_to: dateTo },
      (chunk) => {
        if (!cancelled) setSummary((prev) => prev + chunk);
      },
      (sugs) => {
        if (!cancelled) setSuggestions(sugs);
      },
      () => {
        if (!cancelled) {
          setDone(true);
          onComplete();
        }
      },
      (err) => {
        if (!cancelled) {
          setError(err);
          onError(err);
        }
      },
    );

    return () => { cancelled = true; };
  }, [dateFrom, dateTo, onError]);

  useEffect(() => {
    // 自动滚动到最新内容
    if (summaryRef.current) {
      summaryRef.current.scrollTop = summaryRef.current.scrollHeight;
    }
  }, [summary]);

  return (
    <Card className="animate-fade-in-up ring-2 ring-accent/30">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles size={15} className="text-accent animate-pulse" />
            {done ? "分析完成" : "AI 分析中..."}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-normal bg-muted/50 px-2 py-0.5 rounded-full">
            <Calendar size={11} />
            {dateFrom} ~ {dateTo}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="bg-destructive/10 rounded-xl p-4 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <>
            {/* 流式摘要 */}
            <div className="bg-muted/30 rounded-xl p-4 min-h-[120px] max-h-[400px] overflow-y-auto" ref={summaryRef}>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                分析摘要
              </h4>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {summary}
                {!done && <span className="inline-block w-1.5 h-4 bg-accent animate-pulse ml-0.5 align-text-bottom rounded-sm" />}
              </p>
            </div>

            {/* 建议列表 */}
            {suggestions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Lightbulb size={13} className="text-accent" />
                  健康建议
                </h4>
                <ul className="space-y-2">
                  {suggestions.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm bg-accent/5 rounded-xl px-4 py-2.5"
                    >
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent/15 text-accent text-[11px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
