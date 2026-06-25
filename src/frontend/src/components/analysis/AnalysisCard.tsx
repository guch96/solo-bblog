"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalysisData } from "@/lib/types";
import { Calendar, Cpu, Lightbulb } from "lucide-react";

interface Props {
  analysis: AnalysisData;
}

export default function AnalysisCard({ analysis }: Props) {
  const suggestions: string[] = analysis.suggestions
    ? JSON.parse(analysis.suggestions)
    : [];

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar size={15} className="text-primary" />
            {new Date(analysis.date_from).toLocaleDateString("zh-CN")} ~{" "}
            {new Date(analysis.date_to).toLocaleDateString("zh-CN")}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-normal bg-muted/50 px-2 py-0.5 rounded-full">
            <Cpu size={11} />
            {analysis.provider} / {analysis.model}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 分析摘要 */}
        <div className="bg-muted/30 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">分析摘要</h4>
          <p className="text-sm leading-relaxed">{analysis.summary}</p>
        </div>

        {/* 健康建议 */}
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
      </CardContent>
    </Card>
  );
}
