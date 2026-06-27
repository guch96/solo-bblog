import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import StatsSummaryCards from "@/components/charts/StatsSummaryCards";
import type { StatsSummary } from "@/lib/types";

const mockSummary: StatsSummary = {
  total_count: 42,
  this_week_count: 7,
  avg_duration_seconds: 300,
  most_common_shape: "4",
  most_common_shape_label: "光滑条状",
  abnormal_days: 2,
  avg_frequency_per_day: 1.8,
  longest_duration_seconds: 600,
  record_days: 30,
  streak_days: 10,
};

describe("StatsSummaryCards", () => {
  it("data 为 null 时返回 null（不渲染任何内容）", () => {
    const { container } = render(<StatsSummaryCards data={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("渲染 9 个指标卡片标签", () => {
    render(<StatsSummaryCards data={mockSummary} />);
    expect(screen.getByText("总记录")).toBeInTheDocument();
    expect(screen.getByText("本周")).toBeInTheDocument();
    expect(screen.getByText("日均")).toBeInTheDocument();
    expect(screen.getByText("连续打卡")).toBeInTheDocument();
    expect(screen.getByText("平均时长")).toBeInTheDocument();
    expect(screen.getByText("最长时长")).toBeInTheDocument();
    expect(screen.getByText("常见形状")).toBeInTheDocument();
    expect(screen.getByText("异常天数")).toBeInTheDocument();
    expect(screen.getByText("记录天数")).toBeInTheDocument();
  });

  it("显示正确的数值", () => {
    render(<StatsSummaryCards data={mockSummary} />);
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("光滑条状")).toBeInTheDocument();
    expect(screen.getByText("10天")).toBeInTheDocument();
  });
});
