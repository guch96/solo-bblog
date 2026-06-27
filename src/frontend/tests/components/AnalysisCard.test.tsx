import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/react";
import AnalysisCard from "@/components/analysis/AnalysisCard";
import type { AnalysisData } from "@/lib/types";

const mockAnalysis: AnalysisData = {
  id: 1,
  date_from: "2026-06-20",
  date_to: "2026-06-27",
  provider: "TestProvider",
  model: "test-model",
  summary: "您的肠道健康状况良好。布里斯托评分以4型为主，整体排便规律。".repeat(3),
  suggestions: JSON.stringify(["增加膳食纤维摄入", "保持每天2L饮水量", "每周运动3次"]),
  record_ids: JSON.stringify([1, 2, 3]),
  created_at: "2026-06-27T12:00:00",
};

describe("AnalysisCard", () => {
  it("渲染 provider/model", () => {
    render(<AnalysisCard analysis={mockAnalysis} />);
    expect(screen.getByText(/TestProvider/)).toBeInTheDocument();
    expect(screen.getByText(/test-model/)).toBeInTheDocument();
  });

  it("点击展开详情显示建议", async () => {
    const user = userEvent.setup();
    render(<AnalysisCard analysis={mockAnalysis} />);
    await user.click(screen.getByText("展开详情"));
    expect(screen.getByText("健康建议")).toBeInTheDocument();
    expect(screen.getByText("增加膳食纤维摄入")).toBeInTheDocument();
  });

  it("展开后按钮变为收起详情", async () => {
    const user = userEvent.setup();
    render(<AnalysisCard analysis={mockAnalysis} />);
    await user.click(screen.getByText("展开详情"));
    expect(screen.getByText("收起详情")).toBeInTheDocument();
  });

  it("无建议时不显示建议区域", () => {
    const noSuggestions = { ...mockAnalysis, suggestions: null };
    render(<AnalysisCard analysis={noSuggestions} />);
    expect(screen.queryByText("健康建议")).not.toBeInTheDocument();
  });
});
