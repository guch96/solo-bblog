"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalysisData } from "@/lib/types";

interface Props {
  analysis: AnalysisData;
}

export default function AnalysisCard({ analysis }: Props) {
  const suggestions: string[] = analysis.suggestions
    ? JSON.parse(analysis.suggestions)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>
            {new Date(analysis.date_from).toLocaleDateString("zh-CN")} ~{" "}
            {new Date(analysis.date_to).toLocaleDateString("zh-CN")}
          </span>
          <span className="text-xs text-muted-foreground font-normal">
            {analysis.provider} / {analysis.model}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-1">分析摘要</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {analysis.summary}
          </p>
        </div>
        {suggestions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-1">健康建议</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
