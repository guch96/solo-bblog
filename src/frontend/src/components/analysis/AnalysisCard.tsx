"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalysisData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Calendar, Cpu, Lightbulb, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  analysis: AnalysisData;
}

export default function AnalysisCard({ analysis }: Props) {
  const [expanded, setExpanded] = useState(false);
  const suggestions: string[] = analysis.suggestions
    ? JSON.parse(analysis.suggestions)
    : [];
  const summaryPreview = analysis.summary.length > 120
    ? `${analysis.summary.slice(0, 120)}...`
    : analysis.summary;

  return (
    <Card className="animate-fade-in-up overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.02] shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-base font-semibold">
              <Calendar size={16} className="text-primary" />
              <span>
                {new Date(analysis.date_from).toLocaleDateString("zh-CN")} ~{" "}
                {new Date(analysis.date_to).toLocaleDateString("zh-CN")}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-[11px] font-normal text-muted-foreground">
              <Cpu size={11} />
              {analysis.provider} / {analysis.model}
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((prev) => !prev)}
            className="h-8 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground sm:self-start"
          >
            {expanded ? "收起详情" : "展开详情"}
            <ChevronDown size={13} className={cn("transition-transform duration-200", expanded && "rotate-180")} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Sparkles size={13} className="text-accent" />
            分析摘要
          </div>
          <p className="text-sm leading-7 text-foreground/95">
            {expanded ? analysis.summary : summaryPreview}
          </p>
        </div>

        {suggestions.length > 0 && expanded && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
              <Lightbulb size={13} className="text-accent" />
              健康建议
            </h4>
            <ul className="space-y-2">
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 rounded-2xl border border-accent/10 bg-accent/5 px-4 py-3 text-sm"
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

        {!expanded && suggestions.length > 0 && (
          <div className="rounded-2xl border border-dashed border-border/50 bg-background/55 px-4 py-3 text-xs text-muted-foreground">
            已收起 {suggestions.length} 条健康建议，点击“展开详情”查看完整内容。
          </div>
        )}
      </CardContent>
    </Card>
  );
}
