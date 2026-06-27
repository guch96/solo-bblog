import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/react";
import RecordCard from "@/components/records/RecordCard";
import type { RecordData } from "@/lib/types";

// 顶层 vi.mock 确保在 RecordCard 导入前被 hoisted 拦截 next/navigation
const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), forward: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const mockRecord: RecordData = {
  id: 1,
  start_time: "2026-06-27T10:00:00",
  end_time: "2026-06-27T10:05:00",
  duration: 300,
  shape: "4",
  color: "brown",
  smell: "normal",
  comfort: "comfortable",
  process_feeling: "smooth",
  notes: "无异常",
  input_mode: "manual",
  created_at: "2026-06-27T10:00:00",
  updated_at: "2026-06-27T10:00:00",
};

describe("RecordCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("渲染记录时间", () => {
    render(<RecordCard record={mockRecord} />);
    // duration: 300s = 5分0秒
    expect(screen.getByText("5分0秒")).toBeInTheDocument();
  });

  it("渲染形状 emoji", () => {
    render(<RecordCard record={mockRecord} />);
    // shape "4" 映射为 🍌
    expect(screen.getByText("🍌")).toBeInTheDocument();
  });

  it("渲染形状标签", () => {
    render(<RecordCard record={mockRecord} />);
    // shape "4" 的 shortLabel 为 "光滑条状"
    expect(screen.getByText("光滑条状")).toBeInTheDocument();
  });

  it("渲染备注内容", () => {
    render(<RecordCard record={mockRecord} />);
    expect(screen.getByText("无异常")).toBeInTheDocument();
  });

  it("显示编辑和删除按钮", () => {
    render(<RecordCard record={mockRecord} />);
    expect(screen.getByText("编辑")).toBeInTheDocument();
    expect(screen.getByText("删除")).toBeInTheDocument();
  });

  it("点击删除按钮弹出确认弹窗", async () => {
    const user = userEvent.setup();
    render(<RecordCard record={mockRecord} />);
    await user.click(screen.getByText("删除"));
    // "确认删除" 同时作为标题和按钮文本出现
    expect(screen.getAllByText("确认删除")).toHaveLength(2);
    expect(screen.getByText("取消")).toBeInTheDocument();
  });

  it("弹窗中点击取消关闭弹窗", async () => {
    const user = userEvent.setup();
    render(<RecordCard record={mockRecord} />);
    await user.click(screen.getByText("删除"));
    await user.click(screen.getByText("取消"));
    // 弹窗应关闭，dialog 不再出现在 DOM 中
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
