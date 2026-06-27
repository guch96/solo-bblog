import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { render } from "@testing-library/react";
import StatsCharts from "@/components/charts/StatsCharts";
import { resetRecords } from "../mocks/handlers";

// Mock matchMedia for Recharts ResponsiveContainer
beforeEach(() => {
  vi.clearAllMocks();
  resetRecords();
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  });
});

describe("StatsCharts", () => {
  it("渲染统计范围选择器", async () => {
    render(<StatsCharts />);
    await waitFor(() => {
      expect(screen.getByText("7 天")).toBeInTheDocument();
      expect(screen.getByText("14 天")).toBeInTheDocument();
      expect(screen.getByText("30 天")).toBeInTheDocument();
    });
  });

  it("加载完成后显示图表标题", async () => {
    render(<StatsCharts />);
    await waitFor(() => {
      expect(screen.getByText("每日记录次数")).toBeInTheDocument();
      expect(screen.getByText("每日平均时长")).toBeInTheDocument();
      expect(screen.getByText("布里斯托分类分布")).toBeInTheDocument();
    });
  });
});
