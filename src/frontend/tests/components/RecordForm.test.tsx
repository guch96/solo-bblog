import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/react";
import RecordForm from "@/components/records/RecordForm";

// Mock router
const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), forward: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/records/new",
  useSearchParams: () => new URLSearchParams(),
}));

describe("RecordForm（新建模式）", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("渲染 7 组字段区域标题", () => {
    render(<RecordForm />);
    expect(screen.getByText("时间信息")).toBeInTheDocument();
    expect(screen.getByText("布里斯托形状分类")).toBeInTheDocument();
    expect(screen.getByText("颜色")).toBeInTheDocument();
    expect(screen.getByText("气味")).toBeInTheDocument();
    expect(screen.getByText("身体感受")).toBeInTheDocument();
    expect(screen.getByText("排便过程感受")).toBeInTheDocument();
    expect(screen.getByText("备注")).toBeInTheDocument();
  });

  it("新建模式显示'保存记录'按钮", () => {
    render(<RecordForm />);
    expect(screen.getByText("保存记录")).toBeInTheDocument();
  });

  it("渲染'取消'按钮", () => {
    render(<RecordForm />);
    expect(screen.getByText("取消")).toBeInTheDocument();
  });

  it("编辑模式显示'更新记录'按钮", () => {
    const recordData = {
      id: 1,
      start_time: "2026-06-27T10:00:00",
      shape: "4" as const,
      color: "brown" as const,
      smell: "normal" as const,
      comfort: "comfortable" as const,
      process_feeling: "smooth" as const,
      notes: "编辑测试",
      input_mode: "manual" as const,
    };
    render(<RecordForm record={recordData as any} />);
    expect(screen.getByText("更新记录")).toBeInTheDocument();
  });
});
